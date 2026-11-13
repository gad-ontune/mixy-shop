"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";

const cookieSafe = (value) => String(value || "").trim();

export async function addToCartAction(prevState, formData) {
  const productId = cookieSafe(formData.get("productId"));
  const variantId = cookieSafe(formData.get("variantId")) || null;
  const requestedQuantity = Number.parseInt(formData.get("quantity"), 10) || 1;
  const quantity = Math.min(10, Math.max(1, requestedQuantity));

  if (!productId) return { error: "Choose a product before adding it to your cart." };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { where: { isActive: true } } },
  });

  if (!product || !product.isActive) {
    return { error: "This product is not available." };
  }

  let variant = null;
  if (product.variants.length > 0) {
    if (!variantId) return { error: "Choose a colour, size or capacity first." };
    variant = product.variants.find((entry) => entry.id === variantId);
    if (!variant) return { error: "That product option is not available." };
  } else if (variantId) {
    return { error: "That product option is not available." };
  }

  const stock = variant ? variant.stockQuantity : product.stockQuantity;
  if (stock <= 0) return { error: "This item is currently out of stock." };

  const cart = await getCart({ create: true });
  if (!cart) return { error: "Could not start a cart. Please refresh and try again." };

  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: product.id,
      variantId: variant ? variant.id : null,
    },
  });

  const newQuantity = Math.min(stock, (existing?.quantity || 0) + quantity);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant ? variant.id : null,
        quantity: newQuantity,
      },
    });
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    message:
      newQuantity === (existing?.quantity || 0) + quantity
        ? `${product.name} added to your cart.`
        : `Only ${stock} in stock — your cart was updated to the available quantity.`,
  };
}

export async function updateCartItemAction(formData) {
  const itemId = cookieSafe(formData.get("itemId"));
  const quantity = Number.parseInt(formData.get("quantity"), 10);

  if (!itemId) redirect("/cart");

  const cart = await getCart();
  if (!cart) redirect("/cart");

  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) redirect("/cart");

  if (!Number.isFinite(quantity) || quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    const stock = item.variant
      ? item.variant.stockQuantity
      : item.product.stockQuantity;
    if (stock <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: Math.min(stock, Math.max(1, quantity)) },
      });
    }
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  redirect("/cart");
}

export async function removeCartItemAction(formData) {
  const itemId = cookieSafe(formData.get("itemId"));
  const cart = await getCart();
  if (cart && itemId && cart.items.some((entry) => entry.id === itemId)) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  redirect("/cart");
}

export async function clearCartAction() {
  const cart = await getCart();
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  redirect("/cart");
}
