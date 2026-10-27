const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const isInvalidProductionApiUrl = Boolean(
  configuredApiUrl && (
    /^http:\/\//i.test(configuredApiUrl) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(configuredApiUrl)
  )
);
const API_URL = (
  process.env.NODE_ENV === "production" && (!configuredApiUrl || isInvalidProductionApiUrl)
    ? "https://devora.id.vn/api"
    : configuredApiUrl || "http://localhost:5000/api"
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

let memoryProductsCache: Product[] | null = null;
let memoryCategoriesCache: StoreCategory[] | null = null;

export function getCachedProductsSync(): Product[] | null {
  if (memoryProductsCache && memoryProductsCache.length > 0) return memoryProductsCache;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("cache_products_list") || sessionStorage.getItem("cache_products_list");
      if (raw) {
        memoryProductsCache = JSON.parse(raw);
        return memoryProductsCache;
      }
    } catch {}
  }
  return null;
}

export function setCachedProductsSync(products: Product[]) {
  memoryProductsCache = products;
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(products);
      localStorage.setItem("cache_products_list", serialized);
      sessionStorage.setItem("cache_products_list", serialized);
    } catch {}
  }
}

export function getCachedCategoriesSync(): StoreCategory[] | null {
  if (memoryCategoriesCache && memoryCategoriesCache.length > 0) return memoryCategoriesCache;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("cache_categories_list") || sessionStorage.getItem("cache_categories_list");
      if (raw) {
        memoryCategoriesCache = JSON.parse(raw);
        return memoryCategoriesCache;
      }
    } catch {}
  }
  return null;
}

export function setCachedCategoriesSync(categories: StoreCategory[]) {
  memoryCategoriesCache = categories;
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(categories);
      localStorage.setItem("cache_categories_list", serialized);
      sessionStorage.setItem("cache_categories_list", serialized);
    } catch {}
  }
}

export type User = {
  UserID: number;
  FullName?: string;
  Username?: string | null;
  Bio?: string | null;
  Email?: string | null;
  Phone?: string | null;
  RecoveryEmail?: string | null;
  RecoveryEmailVerified?: boolean;
  Address?: string | null;
  Gender?: string | null;
  Birthday?: string | null;
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
  LinkUrl?: string | null;
  DiscountPercent?: number | null;
  ProductIDs?: string | number[] | null;
  IsActive?: boolean;
  StartDate?: string | null;
  EndDate?: string | null;
  CreatedAt?: string | null;
};

export type StoreCategory = { CategoryID: number; CategoryName: string; ImageUrl?: string | null };
export type Voucher = {
  VoucherID: number;
  Code: string;
  Name: string;
  ImageUrl?: string | null;
  DiscountPercentage?: number | string | null;
  MaxDiscountAmount?: number | string | null;
  ExpiryDate?: string | null;
  IsActive?: boolean;
};

export type UserAddressRecord = {
  AddressID: number;
  UserID: number;
  RecipientName: string;
  RecipientPhone: string;
  AddressLine: string;
  ProvinceCode?: string | null;
  ProvinceName?: string | null;
  WardCode?: string | null;
  WardName?: string | null;
  Latitude?: number | string | null;
  Longitude?: number | string | null;
  IsDefault: boolean;
};

export type UserAddressPayload = {
  RecipientName: string;
  RecipientPhone: string;
  AddressLine: string;
  ProvinceCode?: string | null;
  ProvinceName?: string | null;
  WardCode?: string | null;
  WardName?: string | null;
  Latitude?: number | null;
  Longitude?: number | null;
  IsDefault?: boolean;
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
  OrderID?: number;
  Rating: number | string;
  Comment?: string | null;
  ReviewDate?: string | null;
  AdminReply?: string | null;
  AdminReplyAt?: string | null;
  AdminReplyUserID?: number | null;
  User?: { FullName?: string | null; Avatar?: string | null } | null;
  Product?: { ProductID: number; ProductName: string; ImageUrl?: string | null } | null;
};

export type ProductReviewOrderEligibility = {
  OrderID: number;
  quantity: number;
  reviewedQuantity: number;
  remainingQuantity: number;
  reviews: ProductReview[];
};

export type ProductReviewEligibility = {
  canReview: boolean;
  purchasedQuantity: number;
  reviewedQuantity: number;
  remainingQuantity: number;
  orders: ProductReviewOrderEligibility[];
  reviews: ProductReview[];
  selectedOrder: ProductReviewOrderEligibility | null;
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
  CarrierName?: string | null;
  TrackingNumber?: string | null;
  EstimatedDelivery?: string | null;
  DiscountAmount?: number | string | null;
  VoucherCode?: string | null;
  VoucherID?: number | null;
  User?: { FullName?: string | null; Email?: string | null; Phone?: string | null } | null;
  OrderItems?: OrderItem[];
  RefundRequestAt?: string | null;
  RefundBankName?: string | null;
  RefundBankAccount?: string | null;
  RefundBankHolder?: string | null;
  RefundPhone?: string | null;
  RefundReason?: string | null;
  RefundStatus?: string | null;
  RefundApprovedAt?: string | null;
  Payments?: Array<{
    PaymentTransactionID: number;
    Status: string;
    Amount: number | string;
    CreatedAt?: string | null;
    PaidAt?: string | null;
    orderStatus?: string;
  }>;
};

export type OrderNotification = {
  NotificationID: number;
  UserID: number;
  OrderID?: number | null;
  Type: string;
  Title: string;
  Message: string;
  IsRead: boolean;
  CreatedAt: string;
};

export type SupportConversation = {
  ConversationID: number;
  UserID?: number | null;
  VisitorKey?: string | null;
  CustomerName: string;
  CustomerEmail?: string | null;
  Status: string;
  CreatedAt: string;
  LastMessageAt: string;
  LastMessage?: string;
  LastSenderRole?: string | null;
};

export type SupportMessage = {
  MessageID: number;
  ConversationID: number;
  SenderUserID?: number | null;
  SenderRole: 'Admin' | 'Customer' | 'AI';
  SenderName: string;
  Message: string;
  CreatedAt: string;
};

const AUTH_TOKEN_KEY = "auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string, persist = true) {
  if (typeof window === "undefined") return;
  try {
    if (persist) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
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

    const err = new Error(message);
    if (typeof data === "object" && data !== null) {
      Object.assign(err, data);
    }
    throw err;
  }

  return data as T;
}

export const api = {
  openSupportConversation: (payload: { userId?: number; visitorKey?: string; name?: string; email?: string }) =>
    request<{ conversation: SupportConversation }>('/support/conversations/open', { method: 'POST', body: JSON.stringify(payload) }),

  getSupportConversations: () =>
    request<SupportConversation[]>('/support/conversations?role=admin'),

  getSupportMessages: (conversationId: number, identity: { role?: 'Admin'; userId?: number; visitorKey?: string } = {}) => {
    const query = new URLSearchParams();
    if (identity.role) query.set('role', identity.role);
    if (identity.userId) query.set('userId', String(identity.userId));
    if (identity.visitorKey) query.set('visitorKey', identity.visitorKey);
    return request<{ conversation: SupportConversation; messages: SupportMessage[] }>(`/support/conversations/${conversationId}/messages?${query}`);
  },

  sendSupportMessage: (conversationId: number, payload: { message: string; role?: 'Admin'; userId?: number; visitorKey?: string; senderName?: string }) =>
    request<{ message: SupportMessage }>(`/support/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(payload) }),

  requestSupportAiReply: (conversationId: number, identity: { userId?: number; visitorKey?: string }) =>
    request<{ message: SupportMessage }>(`/support/conversations/${conversationId}/ai-reply`, { method: 'POST', body: JSON.stringify(identity) }),

  // =========================
  // PRODUCTS
  // =========================

  getProducts: async () => {
    const data = await request<Product[]>("/products");
    if (Array.isArray(data)) {
      setCachedProductsSync(data);
    }
    return data;
  },

  getCategories: async () => {
    const data = await request<StoreCategory[]>("/categories");
    if (Array.isArray(data)) {
      setCachedCategoriesSync(data);
    }
    return data;
  },

  createCategory: (payload: { CategoryName: string; ImageUrl?: string | null }) =>
    request<StoreCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: number, payload: { CategoryName: string; ImageUrl?: string | null }) =>
    request<{ message: string; category: StoreCategory }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: number) =>
    request<{ message: string }>(`/categories/${id}`, { method: "DELETE" }),

  getVouchers: () => request<Voucher[]>("/vouchers"),

  getVoucherById: (id: number) => request<Voucher>(`/vouchers/${id}`),

  getVoucherByCode: (code: string) => request<Voucher>(`/vouchers/code/${encodeURIComponent(code)}`),

  validateVoucher: (code: string, subtotal?: number) =>
    request<{ valid: boolean; message: string; voucher?: Voucher; discountAmount?: number }>("/vouchers/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    }),

  createVoucher: (payload: {
    Code: string;
    Name: string;
    ImageUrl?: string | null;
    DiscountPercentage: number | string;
    MaxDiscountAmount?: number | string | null;
    ExpiryDate?: string | null;
    IsActive?: boolean;
  }) =>
    request<Voucher>("/vouchers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateVoucher: (
    id: number,
    payload: Partial<{
      Code: string;
      Name: string;
      ImageUrl?: string | null;
      DiscountPercentage: number | string;
      MaxDiscountAmount?: number | string | null;
      ExpiryDate?: string | null;
      IsActive?: boolean;
    }>
  ) =>
    request<{ message: string; voucher?: Voucher }>(`/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteVoucher: (id: number) =>
    request<{ message: string }>(`/vouchers/${id}`, {
      method: "DELETE",
    }),

  getProductVariants: () =>
    request<ProductVariant[]>("/product-variants"),

  createProductVariant: (payload: Partial<ProductVariant>) =>
    request<ProductVariant>("/product-variants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProductVariant: (id: number, payload: Partial<ProductVariant>) =>
    request<{ message: string }>(`/product-variants/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProductVariant: (id: number) =>
    request<{ message: string }>(`/product-variants/${id}`, {
      method: "DELETE",
    }),

  getProductReviews: (productId: number) =>
    request<ProductReview[]>(`/reviews/product/${productId}`),

  getAdminReviews: () =>
    request<ProductReview[]>('/reviews/admin'),

  replyToReview: (reviewId: number, reply: string) =>
    request<{ message: string; review: ProductReview }>(`/reviews/${reviewId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply }),
    }),

  getProductReviewEligibility: (userId: number, productId: number, orderId?: number) =>
    request<ProductReviewEligibility>(`/reviews/check-eligibility?userId=${userId}&productId=${productId}${orderId ? `&orderId=${orderId}` : ""}`),

  checkOrderReview: (orderId: number, userId: number) =>
    request<{ reviewed: boolean; review?: ProductReview | null }>(`/reviews/check-order?orderId=${orderId}&userId=${userId}`),

  createOrderReview: (payload: { UserID: number; OrderID: number; ProductID: number; Rating: number; Comment?: string }) =>
    request<{ message: string; review: ProductReview }>("/reviews/order", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

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

  uploadProductImage: (file: File) => {
    const body = new FormData();
    body.set('image', file);
    return request<{ success: boolean; url?: string; message?: string }>("/products/upload", {
      method: "POST",
      body,
    });
  },

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

  getPromotionById: (id: number) =>
    request<{ promotion: Promotion; products: Product[] }>(`/promotions/${id}`),

  createPromotion: (payload: Partial<Promotion> & { productDiscounts?: Record<string | number, number | string | null> }) =>
    request<Promotion>("/promotions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePromotion: (id: number, payload: Partial<Promotion> & { productDiscounts?: Record<string | number, number | string | null> }) =>
    request<{ message: string; promotion?: Promotion }>(`/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deletePromotion: (id: number) =>
    request<{ message: string }>(`/promotions/${id}`, {
      method: "DELETE",
    }),

  // =========================
  // AUTHENTICATION
  // =========================

  sendRegistrationOtp: (phone: string) =>
    request<{ message: string; otp?: string }>("/auth/register/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyRegistrationOtp: (phone: string, otp: string) =>
    request<{ message: string }>("/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),

  register: (payload: { phone: string; otp: string; password: string }) =>
    request<{
      message: string;
      token?: string;
      user: User;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (phone: string, password: string) =>
    request<{
      message: string;
      token?: string;
      user: User;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        phone,
        password,
      }),
    }),

  sendPasswordResetOtp: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string }) =>
    request<{ message: string; otp?: string }>("/auth/forgot-password/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyPasswordResetOtp: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string; otp?: string }) =>
    request<{ message: string }>("/auth/forgot-password/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { channel: 'phone' | 'email'; phone?: string; email?: string; newPassword: string }) =>
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

  getCurrentUser: () =>
    request<{ user: User }>("/auth/me"),

  // =========================
  // USERS (ADMIN)
  // =========================

  getUsers: () =>
    request<User[]>("/users"),

  changePassword: (userId: number, currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    }),

  updateUserProfile: (
    userId: number,
    payload: {
      fullName: string;
      username?: string;
      bio?: string;
      gender?: string;
      birthday?: string;
      address?: string;
      avatar?: File | Blob;
    }
  ) => {
    const body = new FormData();
    body.set('fullName', payload.fullName);
    if (payload.username !== undefined) body.set('username', payload.username);
    if (payload.bio !== undefined) body.set('bio', payload.bio);
    if (payload.gender !== undefined) body.set('gender', payload.gender);
    if (payload.birthday !== undefined) body.set('birthday', payload.birthday);
    if (payload.address !== undefined) body.set('address', payload.address);
    if (payload.avatar) {
      if (payload.avatar instanceof File) {
        body.set('avatar', payload.avatar);
      } else {
        body.set('avatar', payload.avatar, 'avatar.png');
      }
    }
    return request<{ message: string; user: User }>(`/users/${userId}/profile`, {
      method: 'PUT',
      body,
    });
  },

  updateUserRole: (userId: number, role: string) =>
    request<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId: number) =>
    request(`/users/${userId}`, {
      method: "DELETE",
    }),

  getUserAddresses: (userId: number) =>
    request<UserAddressRecord[]>(`/addresses/user/${userId}`),

  importUserAddresses: (userId: number, addresses: Array<{
    recipientName: string; phone: string; address: string;
    provinceCode?: string; provinceName?: string; wardCode?: string; wardName?: string;
    latitude?: number; longitude?: number; isDefault?: boolean;
  }>) =>
    request<UserAddressRecord[]>(`/addresses/user/${userId}/import`, {
      method: "POST",
      body: JSON.stringify({ addresses }),
    }),

  createUserAddress: (userId: number, payload: UserAddressPayload) =>
    request<UserAddressRecord>(`/addresses/user/${userId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUserAddress: (userId: number, addressId: number, payload: Partial<UserAddressPayload>) =>
    request<UserAddressRecord>(`/addresses/user/${userId}/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  setDefaultUserAddress: (userId: number, addressId: number) =>
    request<UserAddressRecord>(`/addresses/user/${userId}/${addressId}/default`, {
      method: "PUT",
      body: JSON.stringify({}),
    }),

  deleteUserAddress: (userId: number, addressId: number) =>
    request<{ message: string }>(`/addresses/user/${userId}/${addressId}`, {
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
    request<StoreOrder[]>("/orders"),

  getOrderStatusHistory: (orderId: number) =>
    request<OrderStatusHistory[]>(`/orders/${orderId}/history`),

  updateOrderShipping: (orderId: number, payload: Pick<StoreOrder, 'CarrierName' | 'TrackingNumber' | 'EstimatedDelivery'>) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateOrderStatus: (orderId: number, status: string, note?: string) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ Status: status, ...(note ? { Note: note } : {}) }),
    }),

  cancelOrder: (orderId: number, userId: number) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ UserID: userId }),
    }),

  submitRefundRequest: (
    orderId: number,
    payload: { UserID: number; Phone: string; BankName: string; BankAccount: string; BankHolder: string; Reason?: string }
  ) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}/refund-request`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  approveRefundRequest: (orderId: number) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}/refund-approve`, {
      method: "POST",
    }),

  rejectRefundRequest: (orderId: number, note?: string) =>
    request<{ message: string; order: StoreOrder }>(`/orders/${orderId}/refund-reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  getRefundRequests: () =>
    request<StoreOrder[]>("/orders/refund-requests"),

  getOrdersByUser: (userId: number) =>
    request<StoreOrder[]>(`/orders/user/${userId}`),

  createPayOSPayment: (orderId: number, userId: number) =>
    request<{ orderId: number; paymentStatus: string; checkoutUrl: string; qrCode: string }>(`/orders/${orderId}/payos-payment`, {
      method: "POST",
      body: JSON.stringify({ UserID: userId }),
    }),

  getPaymentStatus: (orderId: number, userId: number) =>
    request<{ payment: NonNullable<StoreOrder["Payments"]>[number] | null; orderStatus?: string }>(`/orders/${orderId}/payment-status?userId=${userId}`),

  getNotifications: (userId: number) =>
    request<{ notifications: OrderNotification[]; unreadCount: number }>(`/notifications/user/${userId}`),

  setNotificationRead: (userId: number, notificationId: number, isRead: boolean) =>
    request<{ success: boolean }>(`/notifications/user/${userId}/${notificationId}/read`, {
      method: "PATCH",
      body: JSON.stringify({ IsRead: isRead }),
    }),

  markAllNotificationsRead: (userId: number) =>
    request<{ success: boolean }>(`/notifications/user/${userId}/read-all`, { method: "PATCH" }),
  
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
    VoucherCode?: string;
    VoucherID?: number;
    Items: Array<{ ProductID: number; Quantity: number; Price: number }>;
  }) =>
    request<{ message: string; order: StoreOrder }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export type OrderStatusHistory = {
  StatusHistoryID: number;
  OrderID: number;
  ActorUserID?: number | null;
  PreviousStatus?: string | null;
  NewStatus: string;
  Note?: string | null;
  ChangedAt: string;
  Actor?: { FullName?: string | null; Email?: string | null } | null;
};

export function resolveApiAssetUrl(value?: string | null): string {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const assetPath = value.startsWith('/') ? value : `/${value}`;
  try {
    const apiOrigin = new URL(API_URL, typeof window === 'undefined' ? 'http://localhost' : window.location.origin).origin;
    return new URL(assetPath, `${apiOrigin}/`).toString();
  } catch {
    return assetPath;
  }
}

export function getPrimaryProductImage(value?: string | null): string {
  const firstImage = value?.split(',').map((image) => image.trim()).find(Boolean);
  return resolveApiAssetUrl(firstImage);
}

// =========================
// GET USER FROM LOCAL STORAGE
// =========================

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const session = sessionStorage.getItem("user");
    if (session) return JSON.parse(session);
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

export function clearAllAuthSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("remembered_phone");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    sessionStorage.setItem("just_logged_out", "1");
  } catch {}
  clearStoredToken();
  window.dispatchEvent(new Event("user-updated"));
}

