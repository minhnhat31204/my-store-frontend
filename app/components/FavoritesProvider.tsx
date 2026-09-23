"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getStoredUser, type Product } from "@/lib/api";

const STORAGE_KEY = "manb-shop-favorites";

type FavoritesContextValue = {
  products: Product[];
  loading: boolean;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readGuestFavorites(): Product[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.UserID) {
      setProducts(readGuestFavorites());
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
    if (user?.UserID) {
      const result = await api.toggleFavorite(user.UserID, product.ProductID);
      setProducts((current) => result.isFavorite
        ? current.some((item) => item.ProductID === product.ProductID) ? current : [...current, product]
        : current.filter((item) => item.ProductID !== product.ProductID));
      return;
    }

    const current = readGuestFavorites();
    const next = current.some((item) => item.ProductID === product.ProductID)
      ? current.filter((item) => item.ProductID !== product.ProductID)
      : [...current, product];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProducts(next);
  }, []);

  const value = useMemo(() => ({ products, loading, isFavorite, toggleFavorite }), [products, loading, isFavorite, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
