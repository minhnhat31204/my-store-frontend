/**
 * printUtils.ts
 * Tiện ích in ấn chuyên nghiệp cho:
 * 1. Hóa đơn bán lẻ kiêm phiếu giao hàng (Invoice & Shipping Slip)
 * 2. Phiếu chi hoàn tiền / Biên lai chuyển khoản (Refund Payment Voucher)
 * 
 * Thiết kế chuẩn khổ giấy A4, font chữ tiếng Việt sắc nét, có logo, barcode mô phỏng,
 * đường kẻ bảng rõ ràng và phần ký tên kế toán/người nhận.
 */

import { StoreOrder } from './api';

function formatVND(amount?: number | string | null) {
  return `${Number(amount || 0).toLocaleString('vi-VN')} ₫`;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openPrintWindow(title: string, contentHtml: string) {
  const win = window.open('', '_blank', 'width=880,height=960');
  if (!win) {
    alert('Trình duyệt đã chặn cửa sổ in (Pop-up). Vui lòng cho phép mở pop-up để in chứng từ!');
    return;
  }

  const fullDoc = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 13px;
      color: #1e293b;
      line-height: 1.5;
      background: #fff;
      padding: 20px;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 20px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
    }
    .barcode {
      display: inline-block;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 4px;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 4px;
      margin-top: 6px;
      border: 1px dashed #cbd5e1;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .meta-box h3 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .meta-box p {
      font-size: 12px;
      margin-bottom: 4px;
    }
    .meta-box p strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 9px 12px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
      text-align: left;
      text-transform: uppercase;
      font-size: 11px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .total-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .total-table {
      width: 320px;
      border-collapse: collapse;
    }
    .total-table td {
      border: none;
      padding: 6px 8px;
    }
    .grand-total {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      border-top: 2px solid #0f172a !important;
      padding-top: 8px !important;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      text-align: center;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signatures h4 {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .signatures span {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
    }
    .sign-space {
      height: 70px;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 40px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${contentHtml}
  </div>
  <script>
    window.addEventListener('load', () => {
      window.focus();
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>
  `;

  win.document.open();
  win.document.write(fullDoc);
  win.document.close();
}

/**
 * 1. IN HÓA ĐƠN BÁN HÀNG & PHIẾU GIAO (Order Invoice)
 */
export function printOrderInvoice(order: StoreOrder) {
  const items = order.OrderItems || [];
  const discount = Number(order.DiscountAmount || 0);
  const total = Number(order.TotalAmount || 0);
  const subTotal = discount > 0 ? total + discount : total;

  const rowsHtml = items.map((item, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>
        <strong>${item.Product?.ProductName || `Sản phẩm #${item.ProductID}`}</strong>
        <div style="font-size: 10px; color: #64748b;">Mã SP: #SP${item.ProductID}</div>
      </td>
      <td class="text-center">${item.Quantity}</td>
      <td class="text-right">${formatVND(item.UnitPrice)}</td>
      <td class="text-right"><strong>${formatVND(Number(item.UnitPrice) * Number(item.Quantity))}</strong></td>
    </tr>
  `).join('');

  const html = `
    <div class="header">
      <div>
        <div class="brand-title">DEVORA COMPUTER</div>
        <div class="brand-sub">Hệ Thống Phân Phối Máy Tính & Linh Kiện Chính Hãng</div>
        <div class="brand-sub">Website: <strong>devora.id.vn</strong> | Hotline: 1900 8888</div>
        <div class="brand-sub">Địa chỉ: TP. Hồ Chí Minh, Việt Nam</div>
      </div>
      <div class="invoice-title">
        <h1>HÓA ĐƠN BÁN HÀNG</h1>
        <div style="font-size: 11px; color: #64748b;">Kiêm phiếu xuất kho & giao nhận</div>
        <div class="barcode">*DH${String(order.OrderID).padStart(6, '0')}*</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Thông tin người mua & Nhận hàng</h3>
        <p>Người nhận: <strong>${order.RecipientName || order.User?.FullName || 'Khách hàng'}</strong></p>
        <p>Số điện thoại: <strong>${order.RecipientPhone || order.User?.Phone || '—'}</strong></p>
        <p>Địa chỉ giao: <strong>${order.ShippingAddress || 'Nhận tại cửa hàng'}</strong></p>
        <p>Email: ${order.User?.Email || '—'}</p>
      </div>

      <div class="meta-box">
        <h3>Chi tiết đơn hàng</h3>
        <p>Mã đơn hàng: <strong>#DH${order.OrderID}</strong></p>
        <p>Ngày đặt: <strong>${formatDate(order.OrderDate)}</strong></p>
        <p>Phương thức: <strong>${order.PaymentMethod || 'Thanh toán khi nhận hàng (COD)'}</strong></p>
        <p>Đơn vị vận chuyển: <strong>${order.CarrierName || 'Giao hàng tiêu chuẩn'}</strong> ${order.TrackingNumber ? `(Mã VĐ: ${order.TrackingNumber})` : ''}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 40px;">STT</th>
          <th>Tên sản phẩm & Cấu hình</th>
          <th class="text-center" style="width: 70px;">SL</th>
          <th class="text-right" style="width: 120px;">Đơn giá</th>
          <th class="text-right" style="width: 130px;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5" class="text-center">Không có sản phẩm</td></tr>'}
      </tbody>
    </table>

    <div class="total-section">
      <table class="total-table">
        <tbody>
          <tr>
            <td class="text-right">Tổng tiền hàng:</td>
            <td class="text-right"><strong>${formatVND(subTotal)}</strong></td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td class="text-right" style="color: #16a34a;">Voucher giảm giá ${order.VoucherCode ? `(${order.VoucherCode})` : ''}:</td>
            <td class="text-right" style="color: #16a34a;"><strong>-${formatVND(discount)}</strong></td>
          </tr>
          ` : ''}
          <tr>
            <td class="text-right">Phí vận chuyển:</td>
            <td class="text-right"><strong>0 ₫ (Miễn phí)</strong></td>
          </tr>
          <tr>
            <td class="text-right grand-total">TỔNG CỘNG:</td>
            <td class="text-right grand-total" style="color: #2563eb;">${formatVND(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div>
        <h4>Người Lập Hóa Đơn</h4>
        <span>(Ký, ghi rõ họ tên)</span>
        <div class="sign-space"></div>
        <p><strong>Admin Portal</strong></p>
      </div>
      <div>
        <h4>Nhân Viên Giao Hàng</h4>
        <span>(Ký, ghi rõ họ tên)</span>
        <div class="sign-space"></div>
      </div>
      <div>
        <h4>Người Nhận Hàng</h4>
        <span>(Ký, xác nhận đủ hàng & nguyên vẹn)</span>
        <div class="sign-space"></div>
      </div>
    </div>

    <div class="footer-note">
      <p>Cảm ơn quý khách đã tin tưởng mua sắm tại <strong>DEVORA</strong>!</p>
      <p>Quý khách vui lòng kiểm tra kỹ hàng hóa trước khi nhận. Đổi trả miễn phí trong vòng 7 ngày nếu phát sinh lỗi phần cứng từ nhà sản xuất.</p>
    </div>
  `;

  openPrintWindow(`Hoa_Don_DH${order.OrderID}`, html);
}

/**
 * 2. IN BIÊN BẢN / PHIẾU XÁC NHẬN HOÀN TIỀN (Refund Receipt)
 */
export function printRefundReceipt(order: StoreOrder) {
  const items = order.OrderItems || [];
  const itemsSummary = items.map((i, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${i.Product?.ProductName || `Sản phẩm #${i.ProductID}`}</strong></td>
      <td class="text-center">${i.Quantity}</td>
      <td class="text-right">${formatVND(i.UnitPrice)}</td>
      <td class="text-right"><strong>${formatVND(Number(i.UnitPrice) * Number(i.Quantity))}</strong></td>
    </tr>
  `).join('');

  const html = `
    <div class="header">
      <div>
        <div class="brand-title">DEVORA COMPUTER</div>
        <div class="brand-sub">Phòng Kế Toán & Dịch Vụ Khách Hàng</div>
        <div class="brand-sub">Website: <strong>devora.id.vn</strong> | Hotline: 1900 8888</div>
      </div>
      <div class="invoice-title">
        <h1 style="color: #e11d48;">PHIẾU CHI HOÀN TIỀN</h1>
        <div style="font-size: 11px; color: #64748b;">Biên lai xác nhận giao dịch bồi hoàn đơn hàng</div>
        <div class="barcode">*REF${String(order.OrderID).padStart(6, '0')}*</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Thông tin đơn hàng hoàn tiền</h3>
        <p>Mã đơn hàng: <strong>#DH${order.OrderID}</strong></p>
        <p>Khách hàng: <strong>${order.User?.FullName || order.RecipientName || 'Khách lẻ'}</strong></p>
        <p>Số điện thoại liên hệ: <strong>${order.RefundPhone || order.RecipientPhone || '—'}</strong></p>
        <p>Thời gian yêu cầu hoàn: <strong>${formatDate(order.RefundRequestAt || order.OrderDate)}</strong></p>
      </div>

      <div class="meta-box" style="background: #fff1f2; border-color: #fecdd3;">
        <h3 style="color: #be123c; border-color: #fecdd3;">Tài khoản nhận hoàn tiền (Thụ hưởng)</h3>
        <p>Số tài khoản: <strong style="font-size: 14px; color: #9f1239;">${order.RefundBankAccount || '—'}</strong></p>
        <p>Chủ tài khoản: <strong>${order.RefundBankHolder || '—'}</strong></p>
        <p>Ngân hàng thụ hưởng: <strong>${order.RefundBankName || '—'}</strong></p>
        <p>Hình thức hoàn: <strong>Chuyển khoản trực tuyến 24/7</strong></p>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;">
      <h3 style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
        Lý do yêu cầu hủy đơn & Hoàn tiền:
      </h3>
      <p style="font-style: italic; color: #334155;">"${order.RefundReason || 'Khách hàng yêu cầu hủy đơn đã chuyển khoản trước đó.'}"</p>
    </div>

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 40px;">STT</th>
          <th>Sản phẩm trong đơn hủy</th>
          <th class="text-center" style="width: 70px;">SL</th>
          <th class="text-right" style="width: 120px;">Đơn giá</th>
          <th class="text-right" style="width: 130px;">Tổng tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsSummary || '<tr><td colspan="5" class="text-center">Chi tiết đơn hàng</td></tr>'}
      </tbody>
    </table>

    <div class="total-section">
      <table class="total-table">
        <tbody>
          <tr>
            <td class="text-right grand-total" style="color: #be123c;">SỐ TIỀN HOÀN TRẢ:</td>
            <td class="text-right grand-total" style="color: #be123c;">${formatVND(order.TotalAmount)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div>
        <h4>Người Lập Phiếu</h4>
        <span>(Nhân viên CSKH/Admin)</span>
        <div class="sign-space"></div>
        <p><strong>Admin Portal</strong></p>
      </div>
      <div>
        <h4>Kế Toán Trưởng</h4>
        <span>(Xác nhận đã chuyển khoản)</span>
        <div class="sign-space"></div>
      </div>
      <div>
        <h4>Thủ Trưởng Đơn Vị</h4>
        <span>(Duyệt chi bồi hoàn)</span>
        <div class="sign-space"></div>
      </div>
    </div>

    <div class="footer-note">
      <p>Chứng từ nội bộ được xuất từ hệ thống quản trị <strong>DEVORA Enterprise</strong>.</p>
      <p>Ngày in phiếu: ${new Date().toLocaleString('vi-VN')} - Vui lòng lưu trữ cẩn thận phục vụ quyết toán định kỳ.</p>
    </div>
  `;

  openPrintWindow(`Phieu_Hoan_Tien_DH${order.OrderID}`, html);
}
