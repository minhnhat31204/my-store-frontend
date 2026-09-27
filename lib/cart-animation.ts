"use client";

/**
 * Hiệu ứng thu nhỏ và bay vào icon giỏ hàng khi người dùng nhấn "Thêm vào giỏ hàng"
 */
export function animateFlyToCart(
  source: HTMLElement | React.MouseEvent | React.TouchEvent | null,
  imageUrl?: string
) {
  if (typeof window === "undefined" || !source) return;

  // Luôn kích hoạt hiện lại thanh nav nếu đang bị ẩn và giữ nguyên thanh nav
  window.dispatchEvent(new Event("show-nav"));

  let startRect: DOMRect | null = null;
  let flyImgSrc = imageUrl || "";

  let sourceEl: HTMLElement | null = null;
  if ("currentTarget" in source && (source as React.SyntheticEvent).currentTarget instanceof HTMLElement) {
    sourceEl = (source as React.SyntheticEvent).currentTarget as HTMLElement;
  } else if (source instanceof HTMLElement) {
    sourceEl = source;
  }

  if (sourceEl) {
    // Tìm ảnh trong thẻ sản phẩm gần nhất hoặc lấy chính element
    const container =
      sourceEl.closest(".product-card") ||
      sourceEl.closest("article") ||
      sourceEl.closest(".product-detail-container") ||
      sourceEl.closest("section") ||
      sourceEl;

    const imgEl = container?.querySelector("img");
    if (!flyImgSrc && imgEl && imgEl.src) {
      flyImgSrc = imgEl.src;
    }

    if (imgEl) {
      startRect = imgEl.getBoundingClientRect();
    } else {
      startRect = sourceEl.getBoundingClientRect();
    }
  }

  if (!startRect || startRect.width === 0 || startRect.height === 0) return;

  // Kiểm tra nếu ảnh sản phẩm bị cuộn che khuất bởi thanh navbar hoặc ngoài màn hình
  const header = document.querySelector(".store-header");
  const headerBottom = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 76;

  const isImageCovered =
    startRect.bottom <= headerBottom + 25 ||
    startRect.top < headerBottom - 20 ||
    startRect.top >= window.innerHeight;

  if (isImageCovered) {
    // Ảnh sản phẩm bị che khuất: không hiện hiệu ứng bay, chỉ nảy số giỏ hàng trực tiếp
    window.dispatchEvent(new CustomEvent("cart-bump"));
    return;
  }

  // Tìm vị trí icon giỏ hàng trên Header hoặc Bottom Nav
  const cartTarget =
    document.querySelector(".header-actions .cart-link") ||
    document.querySelector(".cart-link") ||
    document.querySelector(".mobile-cart-item");

  if (!cartTarget) return;

  const targetRect = cartTarget.getBoundingClientRect();

  // Tạo phần tử bay
  const flying = document.createElement("div");
  const initWidth = Math.min(Math.max(startRect.width, 60), 120);
  const initHeight = Math.min(Math.max(startRect.height, 60), 120);
  const initLeft = startRect.left + (startRect.width - initWidth) / 2;
  const initTop = startRect.top + (startRect.height - initHeight) / 2;

  flying.style.position = "fixed";
  flying.style.zIndex = "999999";
  flying.style.pointerEvents = "none";
  flying.style.left = `${initLeft}px`;
  flying.style.top = `${initTop}px`;
  flying.style.width = `${initWidth}px`;
  flying.style.height = `${initHeight}px`;
  flying.style.borderRadius = "16px";
  flying.style.overflow = "hidden";
  flying.style.backgroundColor = "#ffffff";
  flying.style.border = "2px solid #2454d8";
  flying.style.boxShadow = "0 14px 35px rgba(36, 84, 216, 0.4)";
  flying.style.transition = "all 3.8s cubic-bezier(0.2, 0.85, 0.25, 1)";
  flying.style.transform = "scale(1) rotate(0deg)";
  flying.style.opacity = "0.98";
  flying.style.display = "flex";
  flying.style.alignItems = "center";
  flying.style.justifyContent = "center";

  if (flyImgSrc) {
    const img = document.createElement("img");
    img.src = flyImgSrc;
    img.alt = "Fly to cart";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.padding = "6px";
    flying.appendChild(img);
  }

  document.body.appendChild(flying);

  // Kích hoạt animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Khi header hiện ra ở vị trí top: 0, nút giỏ hàng có top ~16px
      let destX = targetRect.left + targetRect.width / 2 - 14;
      let destY = targetRect.top + targetRect.height / 2 - 14;

      if (destY < 0) {
        destY = 38; // Tọa độ trung tâm chuẩn của giỏ hàng trên header
      }

      flying.style.left = `${destX}px`;
      flying.style.top = `${destY}px`;
      flying.style.width = "28px";
      flying.style.height = "28px";
      flying.style.borderRadius = "10px";
      flying.style.transform = "scale(0.35)";
      flying.style.opacity = "0.2";
    });
  });

  // Dọn dẹp DOM và kích hoạt hiệu ứng nảy badge giỏ hàng ngay khi tiếp đất
  window.setTimeout(() => {
    if (flying.parentNode) {
      flying.parentNode.removeChild(flying);
    }
    window.dispatchEvent(new CustomEvent("cart-bump"));
  }, 3800);
}
