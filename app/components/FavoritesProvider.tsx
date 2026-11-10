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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.UserID) {
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
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
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
