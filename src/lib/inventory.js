import "server-only";

export class InventoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "InventoryError";
  }
}

/**
 * Decrement stock for order lines inside a transaction. Uses conditional
 * updates so concurrent purchases can never drive stock below zero.
 */
export async function reserveStockForLines(tx, lines, { reason, userId = null }) {
  for (const line of lines) {
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InventoryError("Invalid quantity in order.");
    }

    if (line.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        select: { id: true, stockQuantity: true, isActive: true, name: true },
      });
      if (!variant || !variant.isActive) {
        throw new InventoryError(`${line.productName} is no longer available.`);
      }

      const variantUpdate = await tx.productVariant.updateMany({
        where: { id: line.variantId, stockQuantity: { gte: quantity } },
        data: { stockQuantity: { decrement: quantity } },
      });
      if (variantUpdate.count !== 1) {
        throw new InventoryError(
          `${line.productName} (${variant.name}) does not have enough stock.`,
        );
      }

      const product = await tx.product.findUnique({
        where: { id: line.productId },
        select: { id: true, stockQuantity: true },
      });
      const productUpdate = await tx.product.updateMany({
        where: { id: line.productId, stockQuantity: { gte: quantity } },
        data: { stockQuantity: { decrement: quantity } },
      });
      if (productUpdate.count !== 1) {
        throw new InventoryError(`${line.productName} does not have enough stock.`);
      }

      await tx.inventoryMovement.create({
        data: {
          productId: line.productId,
          variantId: line.variantId,
          userId,
          quantityChange: -quantity,
          previousQuantity: variant.stockQuantity,
          newQuantity: variant.stockQuantity - quantity,
          reason,
        },
      });

      if (product) {
        await tx.inventoryMovement.create({
          data: {
            productId: line.productId,
            variantId: null,
            userId,
            quantityChange: -quantity,
            previousQuantity: product.stockQuantity,
            newQuantity: product.stockQuantity - quantity,
            reason: `${reason} (variant aggregate)`,
          },
        });
      }
    } else {
      const product = await tx.product.findUnique({
        where: { id: line.productId },
        select: { id: true, stockQuantity: true, isActive: true },
      });
      if (!product || !product.isActive) {
        throw new InventoryError(`${line.productName} is no longer available.`);
      }

      const update = await tx.product.updateMany({
        where: { id: line.productId, stockQuantity: { gte: quantity } },
        data: { stockQuantity: { decrement: quantity } },
      });
      if (update.count !== 1) {
        throw new InventoryError(`${line.productName} does not have enough stock.`);
      }

      await tx.inventoryMovement.create({
        data: {
          productId: line.productId,
          userId,
          quantityChange: -quantity,
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity - quantity,
          reason,
        },
      });
    }
  }
}

/** Increment stock back for an order, exactly once. */
export async function restoreStockForOrder(tx, orderId, { reason, userId = null }) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.stockRestored) return false;

  for (const item of order.items) {
    if (!item.productId) continue;

    if (item.variantId) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stockQuantity: true },
      });
      if (variant) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            userId,
            quantityChange: item.quantity,
            previousQuantity: variant.stockQuantity,
            newQuantity: variant.stockQuantity + item.quantity,
            reason,
          },
        });
      }

      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true },
      });
      if (product) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            userId,
            quantityChange: item.quantity,
            previousQuantity: product.stockQuantity,
            newQuantity: product.stockQuantity + item.quantity,
            reason: `${reason} (variant aggregate)`,
          },
        });
      }
    } else {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stockQuantity: true },
      });
      if (!product) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          userId,
          quantityChange: item.quantity,
          previousQuantity: product.stockQuantity,
          newQuantity: product.stockQuantity + item.quantity,
          reason,
        },
      });
    }
  }

  await tx.order.update({
    where: { id: orderId },
    data: { stockRestored: true },
  });

  return true;
}

/** Apply a manual inventory adjustment and record the movement. */
export async function adjustInventory(tx, { productId, variantId, quantityChange, reason, userId }) {
  if (!quantityChange) throw new InventoryError("Quantity change cannot be zero.");

  if (variantId) {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, stockQuantity: true },
    });
    if (!variant || variant.productId !== productId) {
      throw new InventoryError("Variant not found for this product.");
    }

    const newQuantity = variant.stockQuantity + quantityChange;
    if (newQuantity < 0) throw new InventoryError("Stock cannot become negative.");

    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: newQuantity },
    });

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true },
    });
    const newProductQuantity = Math.max(0, product.stockQuantity + quantityChange);
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newProductQuantity },
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        variantId,
        userId,
        quantityChange,
        previousQuantity: variant.stockQuantity,
        newQuantity,
        reason,
      },
    });
    return;
  }

  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, _count: { select: { variants: true } } },
  });
  if (!product) throw new InventoryError("Product not found.");
  if (product._count.variants > 0) {
    throw new InventoryError(
      "This product has variants. Adjust stock at the variant level.",
    );
  }

  const newQuantity = product.stockQuantity + quantityChange;
  if (newQuantity < 0) throw new InventoryError("Stock cannot become negative.");

  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: newQuantity },
  });
  await tx.inventoryMovement.create({
    data: {
      productId,
      userId,
      quantityChange,
      previousQuantity: product.stockQuantity,
      newQuantity,
      reason,
    },
  });
}
