"use client";

import { getStoredUser } from "@/lib/api";

/**
 * Hiệu ứng bay thẳng trực tiếp và thu nhỏ mượt mà vào icon giỏ hàng
 * Tương thích 100% với hệ thống CSS Zoom, màn hình thu nhỏ, và Web Animations API
 */
export function animateFlyToCart(
  source: HTMLElement | React.MouseEvent | React.TouchEvent | null,
  imageUrl?: string
) {
  if (typeof window === "undefined" || !source) return;
  if (!getStoredUser()) return;

  // Luôn kích hoạt hiện lại thanh nav nếu đang bị ẩn
  window.dispatchEvent(new Event("show-nav"));

  let startRect: DOMRect | null = null;
  let flyImgSrc = imageUrl || "";

  let sourceEl: HTMLElement | null = null;
  if ("currentTarget" in source && (source as React.SyntheticEvent).currentTarget instanceof HTMLElement) {
    sourceEl = (source as React.SyntheticEvent).currentTarget as HTMLElement;
  } else if ("target" in source && (source as React.SyntheticEvent).target instanceof HTMLElement) {
    sourceEl = (source as React.SyntheticEvent).target as HTMLElement;
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
      const r = imgEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        startRect = r;
      }
    }
    
    if (!startRect) {
      startRect = sourceEl.getBoundingClientRect();
    }
  }

  if (!startRect || startRect.width === 0 || startRect.height === 0) return;

  // Kiểm tra nếu ảnh sản phẩm bị cuộn che khuất hoàn toàn thì chuyển sang lấy vị trí nút bấm
  const header = document.querySelector(".store-header");
  const headerBottom = header ? Math.max(header.getBoundingClientRect().bottom, 0) : 76;

  const isImageCovered =
    startRect.bottom <= headerBottom + 15 ||
    startRect.top < headerBottom - 30 ||
    startRect.top >= window.innerHeight;

  if (isImageCovered && sourceEl) {
    startRect = sourceEl.getBoundingClientRect();
  }

  // Tìm vị trí icon giỏ hàng trên Header hoặc Mobile Nav
  const cartLink =
    document.querySelector(".header-actions .cart-link") ||
    document.querySelector(".cart-link") ||
    document.querySelector("a[href*='/cart']");

  if (!cartLink) return;

  const cartTarget = cartLink.querySelector(".cart-icon-wrap") || cartLink;
  const targetRect = cartTarget.getBoundingClientRect();

  // Lấy tỷ lệ zoom thực tế của trình duyệt (hỗ trợ CSS zoom trên html/body)
  let zoom = 1;
  try {
    const docZoom = (document.documentElement as unknown as { currentCSSZoom?: number }).currentCSSZoom;
    const bodyZoom = (document.body as unknown as { currentCSSZoom?: number }).currentCSSZoom;
    if (typeof docZoom === "number" && docZoom > 0) {
      zoom = docZoom;
    } else if (typeof bodyZoom === "number" && bodyZoom > 0) {
      zoom = bodyZoom;
    } else {
      const computedZoom = parseFloat(window.getComputedStyle(document.documentElement).zoom);
      if (!isNaN(computedZoom) && computedZoom > 0) {
        zoom = computedZoom;
      }
    }
  } catch {
    zoom = 1;
  }

  // Kích thước chuẩn ban đầu của avatar bay
  const size = 56;

  // Tọa độ tâm visual trong viewport
  const startCenterX = startRect.left + startRect.width / 2;
  const startCenterY = startRect.top + startRect.height / 2;

  const destCenterX = targetRect.left + targetRect.width / 2;
  let destCenterY = targetRect.top + targetRect.height / 2;
  if (destCenterY < 0) {
    destCenterY = 32;
  }

  // Chuyển đổi chính xác sang CSS Coordinate Space khi có CSS Zoom
  // Công thức chuẩn xác tuyệt đối: CSS = (VisualTarget / zoom) - (size / 2)
  const startX = (startCenterX / zoom) - (size / 2);
  const startY = (startCenterY / zoom) - (size / 2);
  const destX = (destCenterX / zoom) - (size / 2);
  const destY = (destCenterY / zoom) - (size / 2);

  // Điểm uốn cong nhẹ mềm mại hướng lên trên
  const midX = startX + (destX - startX) * 0.65;
  const midY = startY + (destY - startY) * 0.5 - 28;

  // Tạo phần tử bay
  const flying = document.createElement("div");
  flying.style.position = "fixed";
  flying.style.zIndex = "9999999";
  flying.style.pointerEvents = "none";
  flying.style.left = "0px";
  flying.style.top = "0px";
  flying.style.width = `${size}px`;
  flying.style.height = `${size}px`;
  flying.style.backgroundColor = "#ffffff";
  flying.style.border = "2px solid #2563eb";
  flying.style.borderRadius = "14px";
  flying.style.boxShadow = "0 10px 25px rgba(37, 99, 235, 0.35)";
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
    img.style.padding = "4px";
    img.style.borderRadius = "inherit";
    flying.appendChild(img);
  } else {
    flying.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
  }

  document.body.appendChild(flying);

  const duration = 520; // ms

  // Bay theo đường cong mượt mà thẳng chuẩn xác vào tâm giỏ hàng
  if (typeof flying.animate === "function") {
    const animation = flying.animate(
      [
        {
          transform: `translate3d(${startX}px, ${startY}px, 0) scale(1)`,
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate3d(${midX}px, ${midY}px, 0) scale(0.85)`,
          opacity: 0.95,
          offset: 0.6,
        },
        {
          transform: `translate3d(${destX}px, ${destY}px, 0) scale(0.18)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: duration,
        easing: "cubic-bezier(0.25, 0.9, 0.35, 1)",
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
    // Fallback cho trình duyệt cũ
    flying.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.9, 0.35, 1)`;
    flying.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flying.style.transform = `translate3d(${destX}px, ${destY}px, 0) scale(0.18)`;
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
