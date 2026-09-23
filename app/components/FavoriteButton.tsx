"use client";

import { useState, type MouseEvent } from "react";
import type { Product } from "@/lib/api";
import { useFavorites } from "./FavoritesProvider";

export default function FavoriteButton({ product, className = "" }: { product: Product; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [saving, setSaving] = useState(false);
  const active = isFavorite(product.ProductID);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      await toggleFavorite(product);
    } catch (error) {
      console.error("Không thể cập nhật sản phẩm yêu thích:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      aria-label={active ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
      aria-pressed={active}
      className={`favorite-button ${active ? "is-favorite" : ""} ${className}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
