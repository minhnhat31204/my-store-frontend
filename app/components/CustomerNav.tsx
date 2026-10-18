"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, getCachedProductsSync, getPrimaryProductImage, getStoredUser, resolveApiAssetUrl, type Product, type User } from "@/lib/api";
import { getCart } from "@/lib/cart";
import { usePathname, useRouter } from "next/navigation";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-icon">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  );
}

function UserMenuIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PackageMenuIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function MapPinMenuIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartMenuIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function BellMenuIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function ShieldMenuIcon() {
  return (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <circle cx="12" cy="11" r="3" />
    </svg>
  );
}

function LogoutMenuIcon() {
  return (
    <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function MobileHomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function MobileCategoryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1.5"/>
      <rect width="7" height="7" x="14" y="3" rx="1.5"/>
      <rect width="7" height="7" x="14" y="14" rx="1.5"/>
      <rect width="7" height="7" x="3" y="14" rx="1.5"/>
    </svg>
  );
}

function MobileHeartIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}

function MobileBellIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

function MobileUserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "1" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

type CustomerNavProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function CustomerNav({
  searchValue = "",
  onSearchChange,
}: CustomerNavProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  // Keep the server render and the first client render identical. Cart data
  // comes from browser storage/API after mount in the effect below.
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const isAdmin = String(user?.Role || (user as (User & { role?: string }) | null)?.role || '').toLowerCase() === 'admin';
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDelta = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchProductsRequestRef = useRef<Promise<Product[]> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = (onSearchChange ? searchValue : localSearch).trim();
  const normalizedQuery = normalizeSearchText(currentSearch);
  const searchSuggestions = normalizedQuery
    ? searchProducts.filter((product) => normalizeSearchText([
        product.ProductName,
        product.CPU,
        product.RAM,
        product.Storage,
        product.Display,
        product.Series,
      ].filter(Boolean).join(" ")).includes(normalizedQuery))
    : [];

  const loadSearchProducts = () => {
    const cachedProducts = getCachedProductsSync();
    if (cachedProducts?.length) setSearchProducts(cachedProducts);
    if (!searchProductsRequestRef.current) {
      searchProductsRequestRef.current = api.getProducts()
        .then((items) => {
          setSearchProducts(items);
          return items;
        })
        .catch(() => cachedProducts || []);
    }
  };

  const updateSearchValue = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setLocalSearch(value);
  };

  const saveSearchHistory = (value: string) => {
    const term = value.trim();
    if (!term) return;
    setSearchHistory((current) => {
      const next = [term, ...current.filter((item) => normalizeSearchText(item) !== normalizeSearchText(term))].slice(0, 5);
      try { localStorage.setItem("store_search_history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const removeSearchHistory = (value: string) => {
    setSearchHistory((current) => {
      const next = current.filter((item) => normalizeSearchText(item) !== normalizeSearchText(value));
      try { localStorage.setItem("store_search_history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const closeSearchOnOutsideClick = (event: PointerEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node)) setSearchDropdownOpen(false);
    };
    document.addEventListener("pointerdown", closeSearchOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeSearchOnOutsideClick);
  }, []);

  // Keep server HTML and the first client render identical. The route and
  // sessionStorage based active tab are applied in the effect below.
  const [activeNav, setActiveNav] = useState<string>("");

  useEffect(() => {
    if (pathname === "/") {
      setActiveNav("home");
      try { sessionStorage.setItem("active_nav_origin", "home"); } catch {}
    } else if (pathname === "/customer/products") {
      setActiveNav("products");
      try { sessionStorage.setItem("active_nav_origin", "products"); } catch {}
    } else if (pathname?.startsWith("/customer/notifications")) {
      setActiveNav("notifications");
      try { sessionStorage.setItem("active_nav_origin", "notifications"); } catch {}
    } else if (
      pathname?.startsWith("/customer/account") ||
      pathname?.startsWith("/customer/orders") ||
      pathname?.startsWith("/customer/addresses") ||
      pathname?.startsWith("/customer/favorites")
    ) {
      setActiveNav("account");
      try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
    } else if (pathname === "/login") {
      setActiveNav("login");
      try { sessionStorage.setItem("active_nav_origin", "login"); } catch {}
    } else if (pathname?.startsWith("/customer/products/")) {
      const match = pathname.match(/\/customer\/products\/(\d+)/);
      let origin = "home";
      if (match && match[1]) {
        try {
          const specific = sessionStorage.getItem(`product_origin_${match[1]}`);
          if (specific) origin = specific;
          else {
            origin = sessionStorage.getItem("active_nav_origin") || "home";
          }
        } catch {
          origin = "home";
        }
      } else {
        try {
          origin = sessionStorage.getItem("active_nav_origin") || "home";
        } catch {
          origin = "home";
        }
      }
      setActiveNav(origin === "products" ? "products" : origin === "account" ? "account" : "home");
    }
  }, [pathname]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (currentY < 80) {
        scrollDelta.current = 0;
        scrollDirection.current = null;
        setNavVisible(true);
        return;
      }

      if (Math.abs(delta) < 1) return;
      const direction = delta > 0 ? "down" : "up";
      if (direction !== scrollDirection.current) {
        scrollDirection.current = direction;
        scrollDelta.current = 0;
      }
      scrollDelta.current += Math.abs(delta);

      if (direction === "down" && scrollDelta.current >= 12) {
        setNavVisible(false);
      } else if (direction === "up" && scrollDelta.current >= 3) {
        setNavVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleShowNav = () => {
      setNavVisible(true);
      scrollDelta.current = 0;
      scrollDirection.current = null;
      lastScrollY.current = window.scrollY;
    };

    window.addEventListener("show-nav", handleShowNav);
    return () => window.removeEventListener("show-nav", handleShowNav);
  }, []);

  useEffect(() => {
    const refreshUser = () => {
      setUser(getStoredUser());
      setAuthLoaded(true);
    };

    refreshUser();

    window.addEventListener("user-updated", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("user-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const storedUser = getStoredUser();
        if (storedUser && storedUser.UserID) {
          const cartData = await api.getCart(storedUser.UserID);
          const total = Array.isArray(cartData)
            ? cartData.reduce((sum, item) => sum + Number(item.Quantity || 1), 0)
            : 0;
          setCartCount(total);
        } else {
          const localCart = getCart();
          const total = localCart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
          setCartCount(total);
        }
      } catch (err) {
        console.error("Lỗi lấy giỏ hàng cho Navbar:", err);
        const localCart = getCart();
        setCartCount(localCart.reduce((sum, item) => sum + Number(item.quantity || 1), 0));
      }
    };

    fetchCartCount();

    const triggerBump = () => {
      fetchCartCount();
      setCartBump(true);
      window.setTimeout(() => setCartBump(false), 500);
    };

    // Chỉ cập nhật số lượng khi dữ liệu giỏ hàng thay đổi (không nảy)
    window.addEventListener("cart-updated", fetchCartCount);
    // Chỉ nảy icon giỏ hàng khi vật thể bay tiếp đất vào giỏ hàng
    window.addEventListener("cart-bump", triggerBump);
    window.addEventListener("user-updated", fetchCartCount);
    window.addEventListener("storage", fetchCartCount);

    return () => {
      window.removeEventListener("cart-updated", fetchCartCount);
      window.removeEventListener("cart-bump", triggerBump);
      window.removeEventListener("user-updated", fetchCartCount);
      window.removeEventListener("storage", fetchCartCount);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUnreadNotifications = async () => {
      const storedUser = getStoredUser();
      if (!storedUser?.UserID) {
        if (active) setUnreadNotifications(0);
        return;
      }
      try {
        const result = await api.getNotifications(storedUser.UserID);
        if (active) setUnreadNotifications(result.unreadCount);
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };

    void fetchUnreadNotifications();
    const timer = window.setInterval(fetchUnreadNotifications, 30_000);
    window.addEventListener("user-updated", fetchUnreadNotifications);
    window.addEventListener("notifications-updated", fetchUnreadNotifications);
    window.addEventListener("storage", fetchUnreadNotifications);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("user-updated", fetchUnreadNotifications);
      window.removeEventListener("notifications-updated", fetchUnreadNotifications);
      window.removeEventListener("storage", fetchUnreadNotifications);
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const performLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("auth_token");
    setUser(null);
    setAccountMenuOpen(false);
    setShowLogoutConfirm(false);
    window.dispatchEvent(new Event("user-updated"));
    window.location.href = "/login";
  };

  const handleLogoutClick = () => {
    setAccountMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  // Xử lý khi người dùng nhập tìm kiếm hoặc nhấn Enter / bấm icon mũi tên
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    updateSearchValue(val);
    setSearchDropdownOpen(true);
  };

  const triggerSearch = (overrideValue?: string) => {
    const value = overrideValue ?? (onSearchChange ? searchValue : localSearch);
    const query = value.trim();
    if (!query) return;
    saveSearchHistory(value);
    setSearchDropdownOpen(false);
    // Chỉ áp dụng bộ lọc khi người dùng chủ động gửi tìm kiếm (Enter/nút mũi tên).
    window.dispatchEvent(new CustomEvent("store-search", { detail: query }));
    router.push(`/customer/products?search=${encodeURIComponent(query)}`);
  };

  const handleSearchFocus = () => {
    setSearchDropdownOpen(true);
    loadSearchProducts();
    try {
      const stored = JSON.parse(localStorage.getItem("store_search_history") || "[]");
      if (Array.isArray(stored)) setSearchHistory(stored.filter((item): item is string => typeof item === "string").slice(0, 5));
    } catch {
      setSearchHistory([]);
    }
  };

  const openSuggestedProduct = (product: Product) => {
    saveSearchHistory(currentSearch);
    setSearchDropdownOpen(false);
    router.push(`/customer/products/${product.ProductID}`);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      triggerSearch();
    } else if (event.key === "Escape") {
      setSearchDropdownOpen(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className={`store-header${navVisible ? "" : " nav-hidden"}`}>
        <div className="header-inner">
          <Link href="/" className="brand flex items-center gap-2.5">
            <img src="/devora-icon.png" alt="DEVORA" className="h-9 w-9 object-cover rounded-xl shadow-md border border-white/20 shrink-0" />
            <span className="tracking-tight">DEVORA<span>.VN</span></span>
          </Link>

          <div className="header-search" ref={searchBoxRef}>
            <SearchIcon />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm sản phẩm..."
              value={onSearchChange ? searchValue : localSearch}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={handleSearchFocus}
              aria-expanded={searchDropdownOpen}
              aria-controls="header-search-dropdown"
              aria-autocomplete="list"
            />
            <button
              type="button"
              onClick={() => triggerSearch()}
              className="search-submit-btn"
              title="Tìm kiếm"
              aria-label="Thực hiện tìm kiếm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            {searchDropdownOpen && (
              <div id="header-search-dropdown" className="search-dropdown" role="dialog" aria-label={normalizedQuery ? "Gợi ý tìm kiếm sản phẩm" : "Lịch sử tìm kiếm"}>
                {normalizedQuery ? (
                  <>
                    <div className="search-dropdown-heading">Gợi ý sản phẩm <span>{searchSuggestions.length} kết quả</span></div>
                    {searchSuggestions.length > 0 ? (
                      <div className="search-dropdown-results" role="listbox" aria-label="Sản phẩm phù hợp">
                        {searchSuggestions.map((product) => (
                          <button key={product.ProductID} type="button" role="option" aria-selected="false" className="search-suggestion-item" onClick={() => openSuggestedProduct(product)}>
                            <img src={getPrimaryProductImage(product.ImageUrl) || "/placeholder.png"} alt="" />
                            <span className="search-suggestion-copy"><strong>{product.ProductName}</strong><small>{Number(product.DiscountPrice || product.Price || 0).toLocaleString("vi-VN")} ₫</small></span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="search-dropdown-empty">Chưa tìm thấy sản phẩm phù hợp.</p>
                    )}
                    {searchSuggestions.length > 5 && <p className="search-dropdown-hint">Cuộn xuống để xem thêm sản phẩm</p>}
                  </>
                ) : searchHistory.length > 0 ? (
                  <>
                    <div className="search-dropdown-heading">Tìm kiếm gần đây</div>
                    <div className="search-history-list">
                      {searchHistory.map((term, index) => (
                        <div key={`${term}-${index}`} className="search-history-row">
                          <button type="button" className="search-history-item" onClick={() => { updateSearchValue(term); triggerSearch(term); }}>
                            <span aria-hidden="true">↻</span><span>{term}</span>
                          </button>
                          <button type="button" className="search-history-remove" aria-label={`Xóa lịch sử tìm kiếm ${term}`} title="Xóa lịch sử tìm kiếm" onClick={() => removeSearchHistory(term)}>×</button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="search-dropdown-empty">Lịch sử tìm kiếm sẽ xuất hiện tại đây.</p>
                )}
              </div>
            )}
          </div>

          <nav className="desktop-links">
            <Link
              href="/"
              onClick={() => {
                try { sessionStorage.setItem("active_nav_origin", "home"); } catch {}
                setActiveNav("home");
              }}
              className={`nav-bubble-link ${activeNav === "home" ? "active" : ""}`}
            >
              <span>Trang chủ</span>
            </Link>
            <Link
              href="/customer/products"
              onClick={() => {
                try { sessionStorage.setItem("active_nav_origin", "products"); } catch {}
                setActiveNav("products");
              }}
              className={`nav-bubble-link ${activeNav === "products" ? "active" : ""}`}
            >
              <span>Sản phẩm</span>
            </Link>
            <Link
              href="/customer/notifications"
              onClick={() => {
                try { sessionStorage.setItem("active_nav_origin", "notifications"); } catch {}
                setActiveNav("notifications");
              }}
              className={`nav-bubble-link ${activeNav === "notifications" ? "active" : ""}`}
            >
              <span>Thông báo</span>
              {unreadNotifications > 0 && (
                <span className="nav-bubble-badge">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
          </nav>

          <div className="header-actions">
            <Link
              href="/customer/cart"
              className={`cart-link ${cartBump ? "cart-link-bump" : ""}`}
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
            >
              <span className="cart-icon-wrap">
                <CartIcon />
                {cartCount > 0 && (
                  <b className={`cart-badge ${cartBump ? "cart-badge-bump" : ""}`}>
                    {cartCount}
                  </b>
                )}
              </span>
            </Link>

            {!authLoaded ? (
              <div className="h-11 w-11 rounded-full opacity-0 pointer-events-none" />
            ) : user ? (
              <div className="relative flex items-center" ref={accountMenuRef}>
                <button
                  ref={accountButtonRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  aria-label={`Menu tài khoản${user.FullName ? ` của ${user.FullName}` : ""}`}
                  title={user.FullName || user.Email || user.Phone || ''}
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className={`account-avatar-btn group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${accountMenuOpen ? "is-open" : ""}`}
                >
                  <div className="account-avatar-inner">
                    {user.Avatar ? (
                      <img
                        src={resolveApiAssetUrl(user.Avatar)}
                        alt=""
                        className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div aria-hidden="true" className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-sm font-black uppercase text-white">
                        {(user.FullName || user.Email || "U").charAt(0)}
                      </div>
                    )}
                  </div>
                </button>
                {accountMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Chức năng tài khoản"
                    className="account-dropdown-menu absolute right-0 top-full z-[100] mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-800 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl"
                  >
                    {/* Header Profile Card */}
                    <div className="relative mb-2 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-slate-50 p-3.5 border border-blue-100/60">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {user.Avatar ? (
                            <img
                              src={resolveApiAssetUrl(user.Avatar)}
                              alt=""
                              className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-sm">
                              {(user.FullName || user.Phone || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="Đang hoạt động" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900 leading-tight">
                            {user.FullName || "Tài khoản của tôi"}
                          </p>
                          {(() => {
                            const isInternalEmail = user.Email?.includes("@phone.devora.local") || user.Email?.includes("@phone.manb.local") || user.Email?.includes("@phone.local");
                            const contact = user.Email && !isInternalEmail ? user.Email : (user.RecoveryEmail || (user.Phone ? `SĐT: ${user.Phone}` : ''));
                            return contact ? (
                              <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{contact}</p>
                            ) : null;
                          })()}
                          <div className="mt-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {isAdmin ? "Quản trị viên" : "Thành viên"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-0.5">
                      <Link
                        role="menuitem"
                        href="/customer/account"
                        onClick={() => {
                          try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
                          setActiveNav("account");
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><UserMenuIcon /></span>
                        <span>Thông tin tài khoản</span>
                      </Link>

                      <Link
                        role="menuitem"
                        href="/customer/orders"
                        onClick={() => {
                          try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
                          setActiveNav("account");
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><PackageMenuIcon /></span>
                        <span>Đơn hàng &amp; trạng thái</span>
                      </Link>

                      <Link
                        role="menuitem"
                        href="/customer/addresses"
                        onClick={() => {
                          try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
                          setActiveNav("account");
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><MapPinMenuIcon /></span>
                        <span>Sổ địa chỉ</span>
                      </Link>

                      <Link
                        role="menuitem"
                        href="/customer/favorites"
                        onClick={() => {
                          try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
                          setActiveNav("account");
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><HeartMenuIcon /></span>
                        <span>Sản phẩm yêu thích</span>
                      </Link>

                      <Link
                        role="menuitem"
                        href="/customer/notifications"
                        onClick={() => {
                          try { sessionStorage.setItem("active_nav_origin", "notifications"); } catch {}
                          setActiveNav("notifications");
                          setAccountMenuOpen(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><BellMenuIcon /></span>
                          <span>Thông báo</span>
                        </div>
                        {unreadNotifications > 0 && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="my-1.5 border-t border-slate-100" />

                    {/* Admin Banner (If Admin) */}
                    {isAdmin && (
                      <Link
                        role="menuitem"
                        href="/admin"
                        onClick={() => setAccountMenuOpen(false)}
                        className="mb-1.5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 px-3 py-2.5 text-white shadow-md transition hover:scale-[0.99] active:scale-95 cursor-pointer"
                      >
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15"><ShieldMenuIcon /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">BẢNG QUẢN TRỊ</span>
                            <span className="rounded bg-indigo-500/40 px-1 py-0.2 text-[9px] font-black text-indigo-200">ADMIN</span>
                          </div>
                          <span className="block text-[10px] text-blue-200">Sản phẩm · đơn hàng · users</span>
                        </div>
                      </Link>
                    )}

                    {/* Logout Button */}
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 active:scale-95 cursor-pointer"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50"><LogoutMenuIcon /></span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="login-button">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav">
        <Link
          href="/"
          onClick={() => {
            try { sessionStorage.setItem("active_nav_origin", "home"); } catch {}
            setActiveNav("home");
          }}
          className={`mobile-nav-item ${activeNav === "home" ? "active" : ""}`}
        >
          <MobileHomeIcon active={activeNav === "home"} />
          <small>Trang chủ</small>
        </Link>

        <Link
          href="/customer/products"
          onClick={() => {
            try { sessionStorage.setItem("active_nav_origin", "products"); } catch {}
            setActiveNav("products");
          }}
          className={`mobile-nav-item ${activeNav === "products" ? "active" : ""}`}
        >
          <MobileCategoryIcon active={activeNav === "products"} />
          <small>Sản phẩm</small>
        </Link>

        <Link
          href="/customer/notifications"
          onClick={() => {
            try { sessionStorage.setItem("active_nav_origin", "notifications"); } catch {}
            setActiveNav("notifications");
          }}
          className={`mobile-nav-item ${activeNav === "notifications" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon-wrap">
            <MobileBellIcon active={activeNav === "notifications"} />
            {unreadNotifications > 0 && (
              <b className="mobile-cart-badge">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </b>
            )}
          </span>
          <small>Thông báo</small>
        </Link>

        {authLoaded && (
          user ? (
            <Link
              href="/customer/account"
              onClick={() => {
                try { sessionStorage.setItem("active_nav_origin", "account"); } catch {}
                setActiveNav("account");
              }}
              className={`mobile-nav-item ${activeNav === "account" ? "active" : ""}`}
            >
              {user.Avatar ? (
                <img src={resolveApiAssetUrl(user.Avatar)} alt="" className="w-5 h-5 rounded-full object-cover border border-blue-400" />
              ) : (
                <MobileUserIcon active={activeNav === "account"} />
              )}
              <small>Tài khoản</small>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => {
                try { sessionStorage.setItem("active_nav_origin", "login"); } catch {}
                setActiveNav("login");
              }}
              className={`mobile-nav-item ${activeNav === "login" ? "active" : ""}`}
            >
              <MobileUserIcon active={activeNav === "login"} />
              <small>Đăng nhập</small>
            </Link>
          )
        )}
      </nav>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Xác nhận đăng xuất?</h3>
              <p className="mt-1.5 text-xs text-slate-500">
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình không?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={performLogout}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer shadow-xs"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
