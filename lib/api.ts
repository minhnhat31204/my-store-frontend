const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export type Product = {
  ProductID: number;
  ProductName: string;
  Description?: string | null;
  Price: number | string;
  DiscountPrice?: number | string | null;
  StockQuantity?: number;
  ImageUrl?: string | null;
  CategoryID?: number | null;
};

export type User = {
  UserID: number;
  FullName?: string;
  Email: string;
  Role?: string;
  Avatar?: string | null;
};

export type Promotion = {
  PromotionID?: number;
  Title?: string | null;
  Description?: string | null;
  ImageUrl?: string | null;
  IMAGEURL?: string | null;
  imageUrl?: string | null;
  BannerImageUrl?: string | null;
  Image?: string | null;
  Url?: string | null;
  IsActive?: boolean;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : typeof data === "object" && data !== null && "message" in data
          ? String((data as { message: unknown }).message)
          : `API error: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // Products
  getProducts: () => request<Product[]>("/products"),
  createProduct: (payload: Partial<Product>) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: number, payload: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request(`/products/${id}`, { method: "DELETE" }),

  // Promotions / banners
  getPromotions: () => request<Promotion[]>("/promotions"),

  // Authentication
  sendLoginOtp: (email: string) =>
    request("/auth/send-login-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyLoginOtp: (email: string, otp: string) =>
    request<{ user: User }>("/auth/verify-login-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  // Cart
  getCart: (userId: number) => request<any[]>(`/cart/${userId}`),
  addToCart: (payload: {
    UserID: number;
    ProductID: number;
    Quantity: number;
    Price: number;
  }) =>
    request("/cart/add", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCart: (id: number, quantity: number) =>
    request(`/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify({ Quantity: quantity }),
    }),
  deleteCart: (id: number) =>
    request(`/cart/${id}`, { method: "DELETE" }),

  // Orders
  getOrders: () => request<any[]>("/orders"),
  getOrdersByUser: (userId: number) =>
    request<any[]>(`/orders/user/${userId}`),
};

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
