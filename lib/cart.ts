import { api, getStoredUser } from "@/lib/api";

export type CartItem = {
  ID?: number;
  ProductID: number;
  ProductName: string;
  Price: number;
  DiscountPrice?: number;
  ImageUrl?: string;
  quantity: number;
};

const KEY = "computer-store-cart";

// =========================
// CART LOCAL
// =========================

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(KEY) || "[]"
    );
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));

  window.dispatchEvent(
    new Event("cart-updated")
  );
}

// =========================
// CHUYỂN DATA BACKEND
// =========================

function mapBackendCartItem(item: any): CartItem {
  return {
    ID: item.ID,
    ProductID: Number(item.ProductID),
    ProductName: item.ProductName || "Sản phẩm",
    Price: Number(
      item.DiscountPrice ?? item.Price ?? 0
    ),
    DiscountPrice:
      item.DiscountPrice != null
        ? Number(item.DiscountPrice)
        : undefined,
    ImageUrl: item.ImageUrl || "",
    quantity: Number(item.Quantity ?? 1),
  };
}

// =========================
// LẤY GIỎ HÀNG
// =========================

export async function loadCart(): Promise<CartItem[]> {
  const user = getStoredUser();

  // Chưa đăng nhập → lấy localStorage
  if (!user) {
    return getCart();
  }

  // Đã đăng nhập → lấy từ Backend / SQL Server
  try {
    const data = await api.getCart(user.UserID);

    const items = Array.isArray(data)
      ? data.map(mapBackendCartItem)
      : [];

    // Lưu bản sao local để CustomerNav cập nhật badge
    saveCart(items);

    return items;
  } catch (error) {
    console.error("Không thể tải giỏ hàng Backend:", error);

    // Nếu Backend lỗi thì giữ giỏ local
    return getCart();
  }
}

// =========================
// THÊM SẢN PHẨM
// =========================

export async function addToCart(
  product: Omit<CartItem, "quantity">
) {
  const user = getStoredUser();

  // =========================
  // CHƯA ĐĂNG NHẬP
  // =========================

  if (!user) {
    const cart = getCart();

    const found = cart.find(
      (item) =>
        item.ProductID === product.ProductID
    );

    if (found) {
      found.quantity += 1;
    } else {
      cart.push({
        ...product,
        quantity: 1,
      });
    }

    saveCart(cart);
    return;
  }

  // =========================
  // ĐÃ ĐĂNG NHẬP
  // → BACKEND → SQL SERVER
  // =========================

  try {
    await api.addToCart({
      UserID: user.UserID,
      ProductID: product.ProductID,
      Quantity: 1,
      Price: Number(product.Price),
    });

    // Lấy lại giỏ hàng mới nhất từ Backend
    const data = await api.getCart(user.UserID);

    const items = Array.isArray(data)
      ? data.map(mapBackendCartItem)
      : [];

    saveCart(items);
  } catch (error) {
    console.error("Lỗi thêm sản phẩm vào giỏ:", error);
    throw error;
  }
}

// =========================
// CẬP NHẬT SỐ LƯỢNG
// =========================

export async function updateCartItem(
  item: CartItem,
  quantity: number
) {
  const user = getStoredUser();

  // Chưa đăng nhập → localStorage
  if (!user) {
    const cart = getCart();

    const next = cart
      .map((cartItem) =>
        cartItem.ProductID === item.ProductID
          ? {
              ...cartItem,
              quantity,
            }
          : cartItem
      )
      .filter(
        (cartItem) => cartItem.quantity > 0
      );

    saveCart(next);
    return next;
  }

  // Đã đăng nhập → Backend
  if (!item.ID) {
    throw new Error(
      "Không tìm thấy ID sản phẩm trong giỏ hàng."
    );
  }

  if (quantity <= 0) {
    await api.deleteCart(item.ID);
  } else {
    await api.updateCart(
      item.ID,
      quantity
    );
  }

  const data = await api.getCart(
    user.UserID
  );

  const items = Array.isArray(data)
    ? data.map(mapBackendCartItem)
    : [];

  saveCart(items);

  return items;
}

// =========================
// XÓA SẢN PHẨM
// =========================

export async function removeFromCart(
  item: CartItem
) {
  const user = getStoredUser();

  // Chưa đăng nhập
  if (!user) {
    const next = getCart().filter(
      (cartItem) =>
        cartItem.ProductID !== item.ProductID
    );

    saveCart(next);
    return next;
  }

  // Đã đăng nhập
  if (!item.ID) {
    throw new Error(
      "Không tìm thấy ID sản phẩm trong giỏ hàng."
    );
  }

  await api.deleteCart(item.ID);

  const data = await api.getCart(
    user.UserID
  );

  const items = Array.isArray(data)
    ? data.map(mapBackendCartItem)
    : [];

  saveCart(items);

  return items;
}