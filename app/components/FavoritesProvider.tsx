"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getStoredUser, type Product } from "@/lib/api";

type FavoritesContextValue = {
  products: Product[];
  loading: boolean;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const GUEST_FAVORITES_KEY = "guest_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.UserID) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
          if (raw) {
            setProducts(JSON.parse(raw));
            setLoading(false);
            return;
          }
        } catch {}
      }
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const records = await api.getFavorites(user.UserID);
      setProducts(records.flatMap((record) => record.Product ? [record.Product] : []));
    } catch (error) {
      console.error("Không thể tải danh sách yêu thích:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUserChange = () => { setLoading(true); void refresh(); };
    window.addEventListener("user-updated", onUserChange);
    window.addEventListener("storage", onUserChange);
    return () => {
      window.removeEventListener("user-updated", onUserChange);
      window.removeEventListener("storage", onUserChange);
    };
  }, [refresh]);

  const isFavorite = useCallback(
    (productId: number) => products.some((item) => item.ProductID === productId),
    [products],
  );

  const toggleFavorite = useCallback(async (product: Product) => {
    const user = getStoredUser();
    if (!user?.UserID) {
      // Cho phép khách yêu thích mà không yêu cầu đăng nhập
      setProducts((current) => {
        const exists = current.some((item) => item.ProductID === product.ProductID);
        const next = exists
          ? current.filter((item) => item.ProductID !== product.ProductID)
          : [...current, product];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
      return;
    }

    const result = await api.toggleFavorite(user.UserID, product.ProductID);
    setProducts((current) => result.isFavorite
      ? current.some((item) => item.ProductID === product.ProductID) ? current : [...current, product]
      : current.filter((item) => item.ProductID !== product.ProductID));
  }, []);

  const value = useMemo(() => ({ products, loading, isFavorite, toggleFavorite }), [products, loading, isFavorite, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
