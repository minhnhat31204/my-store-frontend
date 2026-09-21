export type CartItem = {
  ProductID: number;
  ProductName: string;
  Price: number;
  ImageUrl?: string;
  quantity: number;
};

const KEY = "computer-store-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product: Omit<CartItem, "quantity">) {
  const cart = getCart();
  const found = cart.find((item) => item.ProductID === product.ProductID);
  if (found) found.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  saveCart(cart);
}
