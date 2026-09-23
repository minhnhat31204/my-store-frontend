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
  CPU?: string | null;
  RAM?: string | null;
  Storage?: string | null;
  Display?: string | null;
  RefreshRate?: string | null;
  Series?: string | null;
};

export type User = {
  UserID: number;
  FullName?: string;
  Email: string;
  Phone?: string | null;
  RecoveryEmail?: string | null;
  RecoveryEmailVerified?: boolean;
  Address?: string | null;
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

export type ProductVariant = {
  VariantID: number;
  ProductID: number;
  Color?: string | null;
  Configuration?: string | null;
  Price?: number | string | null;
  StockQuantity?: number | null;
  ImageUrl?: string;
};

export type ProductReview = {
  ReviewID: number;
  ProductID: number;
  Rating: number | string;
  Comment?: string | null;
  ReviewDate?: string | null;
  User?: { FullName?: string | null; Avatar?: string | null } | null;
};

export type FavoriteRecord = {
  FavoriteID: number;
  UserID: number;
  ProductID: number;
  Product?: Product | null;
};

export type OrderItem = {
  OrderItemID?: number;
  OrderID: number;
  ProductID: number;
  Quantity: number;
  UnitPrice: number | string;
  Product?: Product | null;
};

export type StoreOrder = {
  OrderID: number;
  UserID: number;
  OrderDate?: string | null;
  Status?: string | null;
  TotalAmount: number | string;
  RecipientName?: string | null;
  RecipientPhone?: string | null;
  ShippingAddress?: string | null;
  Note?: string | null;
  PaymentMethod?: string | null;
  DiscountAmount?: number | string | null;
  OrderItems?: OrderItem[];
  Payments?: Array<{
    PaymentTransactionID: number;
    Status: string;
    Amount: number | string;
    CreatedAt?: string | null;
    PaidAt?: string | null;
  }>;
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

  getProductVariants: () =>
    request<ProductVariant[]>("/product-variants"),

  getProductReviews: (productId: number) =>
    request<ProductReview[]>(`/reviews/product/${productId}`),

  getFavorites: (userId: number) =>
    request<FavoriteRecord[]>(`/favorites/${userId}`),

  toggleFavorite: (userId: number, productId: number) =>
    request<{ isFavorite: boolean; message: string }>("/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ userId, productId }),
    }),

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

  register: (payload: { phone: string; firebaseIdToken: string; password: string }) =>
    request<{
      message: string;
      user: User;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (phone: string, password: string) =>
    request<{
      message: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone,
        password,
      }),
    }),

  sendPasswordResetOtp: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string }) =>
    request<{ message: string }>("/auth/forgot-password/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyPasswordResetOtp: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string; otp?: string; firebaseIdToken?: string }) =>
    request<{ message: string }>("/auth/forgot-password/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string; newPassword: string; firebaseIdToken?: string }) =>
    request<{ message: string }>("/auth/forgot-password/reset", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  sendEmailVerificationOtp: (userId: number, email: string, currentPassword: string) =>
    request<{ message: string }>("/auth/email/send-otp", {
      method: "POST",
      body: JSON.stringify({ userId, email, currentPassword }),
    }),

  verifyEmailOtp: (userId: number, email: string, otp: string) =>
    request<{ message: string; user: User }>("/auth/email/verify-otp", {
      method: "POST",
      body: JSON.stringify({ userId, email, otp }),
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
    request<StoreOrder[]>(`/orders/user/${userId}`),

  createPayOSPayment: (orderId: number, userId: number) =>
    request<{ orderId: number; paymentStatus: string; checkoutUrl: string; qrCode: string }>(`/orders/${orderId}/payos-payment`, {
      method: "POST",
      body: JSON.stringify({ UserID: userId }),
    }),

  getPaymentStatus: (orderId: number, userId: number) =>
    request<{ payment: NonNullable<StoreOrder["Payments"]>[number] | null }>(`/orders/${orderId}/payment-status?userId=${userId}`),
  
  createOrder: (payload: {
    UserID: number;
    RecipientName: string;
    RecipientPhone: string;
    ShippingAddress: string;
    Note?: string;
    TotalAmount: number;
    PaymentMethod: string;
    Status?: string;
    DiscountAmount?: number;
    Items: Array<{ ProductID: number; Quantity: number; Price: number }>;
  }) =>
    request<{ message: string; order: StoreOrder }>("/orders", {
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
