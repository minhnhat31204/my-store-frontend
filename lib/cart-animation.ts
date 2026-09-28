"use client";

/**
 * Hiệu ứng bay thẳng trực tiếp và thu nhỏ mượt mà vào icon giỏ hàng
 */
export function animateFlyToCart(
  source: HTMLElement | React.MouseEvent | React.TouchEvent | null,
  imageUrl?: string
) {
  if (typeof window === "undefined" || !source) return;

  // Luôn kích hoạt hiện lại thanh nav nếu đang bị ẩn
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

  // Kiểm tra nếu ảnh sản phẩm bị cuộn che khuất hoàn toàn
  const header = document.querySelector(".store-header");
  const headerBottom = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 76;

  const isImageCovered =
    startRect.bottom <= headerBottom + 15 ||
    startRect.top < headerBottom - 30 ||
    startRect.top >= window.innerHeight;

  if (isImageCovered) {
    window.dispatchEvent(new CustomEvent("cart-bump"));
    return;
  }

  // Tìm vị trí icon giỏ hàng trên Header hoặc Mobile Bottom Nav
  const cartTarget =
    document.querySelector(".header-actions .cart-link") ||
    document.querySelector(".cart-link") ||
    document.querySelector(".mobile-cart-item");

  if (!cartTarget) return;

  const targetRect = cartTarget.getBoundingClientRect();

  // Kích thước chuẩn ban đầu của avatar bay
  const size = 68;

  // Tọa độ tâm xuất phát và tâm đích
  const startCenterX = startRect.left + startRect.width / 2;
  const startCenterY = startRect.top + startRect.height / 2;

  const destCenterX = targetRect.left + targetRect.width / 2;
  let destCenterY = targetRect.top + targetRect.height / 2;
  if (destCenterY < 0) {
    destCenterY = 38; // Tọa độ trung tâm chuẩn của nút giỏ hàng trên header
  }

  const startX = startCenterX - size / 2;
  const startY = startCenterY - size / 2;
  const destX = destCenterX - size / 2;
  const destY = destCenterY - size / 2;

  // Tạo phần tử bay
  const flying = document.createElement("div");
  flying.style.position = "fixed";
  flying.style.zIndex = "999999";
  flying.style.pointerEvents = "none";
  flying.style.left = "0px";
  flying.style.top = "0px";
  flying.style.width = `${size}px`;
  flying.style.height = `${size}px`;
  flying.style.backgroundColor = "#ffffff";
  flying.style.border = "2px solid #3b82f6";
  flying.style.borderRadius = "16px";
  flying.style.boxShadow = "0 10px 25px rgba(37, 99, 235, 0.4)";
  flying.style.display = "flex";
  flying.style.alignItems = "center";
  flying.style.justifyContent = "center";
  flying.style.willChange = "transform, opacity";
  flying.style.transformOrigin = "center center";

  if (flyImgSrc) {
    const img = document.createElement("img");
    img.src = flyImgSrc;
    img.alt = "Fly to cart";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.padding = "5px";
    img.style.borderRadius = "inherit";
    flying.appendChild(img);
  }

  document.body.appendChild(flying);

  const duration = 480; // ms (rất nhanh và mượt mà)

  // Bay đường thẳng trực tiếp (Linear trajectory with smooth easing)
  if (typeof flying.animate === "function") {
    const animation = flying.animate(
      [
        {
          transform: `translate3d(${startX}px, ${startY}px, 0) scale(1)`,
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate3d(${startX + (destX - startX) * 0.72}px, ${startY + (destY - startY) * 0.72}px, 0) scale(0.82)`,
          opacity: 0.92,
          offset: 0.72,
        },
        {
          transform: `translate3d(${destX}px, ${destY}px, 0) scale(0.6)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: duration,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );

    animation.onfinish = () => {
      if (flying.parentNode) {
        flying.parentNode.removeChild(flying);
      }
      window.dispatchEvent(new CustomEvent("cart-bump"));
    };
  } else {
    // Fallback
    flying.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    flying.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flying.style.transform = `translate3d(${destX}px, ${destY}px, 0) scale(0.6)`;
        flying.style.opacity = "0";
      });
    });

    window.setTimeout(() => {
      if (flying.parentNode) {
        flying.parentNode.removeChild(flying);
      }
      window.dispatchEvent(new CustomEvent("cart-bump"));
    }, duration);
  }
}
