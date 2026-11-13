import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomToken } from "@/lib/utils";

export const CART_COOKIE = "mix_cart";

export const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      variant: true,
    },
    orderBy: { createdAt: "asc" },
  },
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 60,
};

export function cartUnitPrice(item) {
  return item.variant?.price ?? item.product?.price ?? 0;
}

export function cartAvailableStock(item) {
  if (item.variant) return item.variant.isActive ? item.variant.stockQuantity : 0;
  return item.product?.stockQuantity ?? 0;
}

export function summarizeCart(cart) {
  if (!cart) {
    return { items: [], subtotal: 0, itemCount: 0, hasIssues: false };
  }

  let subtotal = 0;
  let itemCount = 0;
  let hasIssues = false;

  const items = cart.items.map((item) => {
    const unitPrice = cartUnitPrice(item);
    const stock = cartAvailableStock(item);
    const inactive = !item.product?.isActive || (item.variant && !item.variant.isActive);
    const lineTotal = unitPrice * item.quantity;
    const issue = inactive
      ? "This item is no longer available."
      : stock <= 0
        ? "Out of stock."
        : stock < item.quantity
          ? `Only ${stock} left in stock.`
          : null;

    if (issue) hasIssues = true;
    subtotal += lineTotal;
    itemCount += item.quantity;

    return {
      ...item,
      unitPrice,
      lineTotal,
      stock,
      inactive,
      issue,
      image: item.product?.images?.[0]?.url || null,
    };
  });

  return { items, subtotal, itemCount, hasIssues };
}

async function mergeGuestCart(userId, guestToken) {
  if (!guestToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guestCart) return;

  await prisma.$transaction(async (tx) => {
    let userCart = await tx.cart.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    if (!userCart) {
      userCart = await tx.cart.create({ data: { userId } });
    }

    for (const guestItem of guestCart.items) {
      const match = await tx.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
        },
      });

      if (match) {
        await tx.cartItem.update({
          where: { id: match.id },
          data: { quantity: match.quantity + guestItem.quantity },
        });
        await tx.cartItem.delete({ where: { id: guestItem.id } });
      } else {
        await tx.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: userCart.id },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}

async function findUserCart(userId) {
  return prisma.cart.findFirst({
    where: { userId },
    include: cartInclude,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Resolve the active cart. `create` may only be used from a Server Action or
 * Route Handler because it writes a cookie for guest carts.
 */
export async function getCart({ create = false } = {}) {
  const session = await auth();
  const store = await cookies();
  const guestToken = store.get(CART_COOKIE)?.value;

  if (session?.user?.id) {
    let cart = await findUserCart(session.user.id);

    if (guestToken) {
      await mergeGuestCart(session.user.id, guestToken);
      cart = await findUserCart(session.user.id);
    }

    if (!cart && create) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        include: cartInclude,
      });
    }

    return cart;
  }

  if (!guestToken) {
    if (!create) return null;
    const token = randomToken(18);
    const cart = await prisma.cart.create({
      data: { guestToken: token },
      include: cartInclude,
    });
    store.set(CART_COOKIE, token, cookieOptions);
    return cart;
  }

  let cart = await prisma.cart.findUnique({
    where: { guestToken },
    include: cartInclude,
  });

  if (!cart && create) {
    cart = await prisma.cart.create({
      data: { guestToken },
      include: cartInclude,
    });
  }

  return cart;
}

export async function getCartCount() {
  const cart = await getCart();
  if (!cart) return 0;
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}
