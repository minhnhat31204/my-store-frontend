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
      typeof data === "object" &&
      data !== null &&
      "error" in data
        ? String((data as { error: unknown }).error)
        : typeof data === "object" &&
            data !== null &&
            "message" in data
          ? String((data as { message: unknown }).message)
          : `API error: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  // =========================
  // PRODUCTS
  // =========================

  getProducts: () =>
    request<Product[]>("/products"),

  createProduct: (payload: Partial<Product>) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (
    id: number,
    payload: Partial<Product>
  ) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: number) =>
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  // =========================
  // PROMOTIONS / BANNERS
  // =========================

  getPromotions: () =>
    request<Promotion[]>("/promotions"),

  // =========================
  // AUTHENTICATION
  // =========================

  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }) =>
    request<{
      message: string;
      user: User;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) =>
    request<{
      message: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  // --- BỔ SUNG CÁC HÀM QUÊN MẬT KHẨU (OTP) ---
  forgotPassword: (payload: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyOtp: (payload: { email: string; otp: string }) =>
    request<{ message: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // =========================
  // USERS (ADMIN)
  // =========================

  getUsers: () =>
    request<User[]>("/users"),

  updateUserRole: (userId: number, role: string) =>
    request<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId: number) =>
    request(`/users/${userId}`, {
      method: "DELETE",
    }),

  // =========================
  // CART
  // =========================

  getCart: (userId: number) =>
    request<any[]>(`/cart/${userId}`),

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

  updateCart: (
    id: number,
    quantity: number
  ) =>
    request(`/cart/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        Quantity: quantity,
      }),
    }),

  deleteCart: (id: number) =>
    request(`/cart/${id}`, {
      method: "DELETE",
    }),

  clearCartByUser: (userId: number) =>
    request(`/cart/user/${userId}`, {
      method: "DELETE",
    }),

  // =========================
  // ORDERS
  // =========================

  getOrders: () =>
    request<any[]>("/orders"),

  getOrdersByUser: (userId: number) =>
    request<any[]>(`/orders/user/${userId}`),
  
  createOrder: (payload: {
    UserID: number;
    FullName: string;
    Phone: string;
    ShippingAddress: string;
    Note?: string;
    TotalAmount: number;
    Items: Array<{ ProductID: number; Quantity: number; Price: number }>;
  }) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// =========================
// GET USER FROM LOCAL STORAGE
// =========================

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}