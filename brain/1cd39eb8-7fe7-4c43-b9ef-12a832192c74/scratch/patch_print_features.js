const fs = require('fs');

// ============================================
// 1. PATCH ORDERS: app/admin/orders/page.tsx
// ============================================
let orders = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', 'utf8');

// Add import
orders = orders.replace(
  "import { exportToExcel } from '@/lib/exportExcel';",
  "import { exportToExcel } from '@/lib/exportExcel';\nimport { printOrderInvoice } from '@/lib/printUtils';"
);

// Add Print button in Modal Header next to Close button
const modalHeaderTarget = `<h2 className="text-xl font-black text-white mt-0.5">\r\n                  Đơn Hàng #{selected.OrderID}\r\n                </h2>`;

const modalHeaderReplacement = `<div className="flex items-center gap-3 mt-0.5">\r\n                  <h2 className="text-xl font-black text-white">\r\n                    Đơn Hàng #{selected.OrderID}\r\n                  </h2>\r\n                  <button\r\n                    type="button"\r\n                    onClick={() => printOrderInvoice(selected)}\r\n                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"\r\n                    title="In hóa đơn bán hàng chuẩn A4"\r\n                  >\r\n                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">\r\n                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />\r\n                    </svg>\r\n                    <span>In Hóa Đơn</span>\r\n                  </button>\r\n                </div>`;

orders = orders.replace(modalHeaderTarget, modalHeaderReplacement);

// Also add quick print button in the table row under "Xem chi tiết"
const tableRowTarget = `<button\r\n                          onClick={() => openOrder(order)}\r\n                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 active:scale-95"\r\n                        >\r\n                          Xem chi tiết\r\n                        </button>`;

const tableRowReplacement = `<div className="flex items-center justify-end gap-2">\r\n                          <button\r\n                            type="button"\r\n                            onClick={() => printOrderInvoice(order)}\r\n                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 border border-slate-700 transition cursor-pointer active:scale-95"\r\n                            title="In hóa đơn"\r\n                          >\r\n                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">\r\n                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />\r\n                            </svg>\r\n                          </button>\r\n                          <button\r\n                            onClick={() => openOrder(order)}\r\n                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"\r\n                          >\r\n                            Xem chi tiết\r\n                          </button>\r\n                        </div>`;

orders = orders.replace(tableRowTarget, tableRowReplacement);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', orders, 'utf8');
console.log('1. Added Print Order Invoice to Orders page!');

// ============================================
// 2. PATCH REFUNDS: app/admin/refunds/page.tsx
// ============================================
let refunds = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', 'utf8');

// Add import
refunds = refunds.replace(
  "import { exportToExcel } from '@/lib/exportExcel';",
  "import { exportToExcel } from '@/lib/exportExcel';\nimport { printRefundReceipt } from '@/lib/printUtils';"
);

// Add "In Phiếu Hoàn Tiền" button in actions area
const refundActionsTarget = `<div className="flex flex-wrap items-center justify-end gap-3 pt-2">\r\n                  <button\r\n                    type="button"\r\n                    disabled={isProcessing}\r\n                    onClick={() => handleOpenReject(order)}`;

const refundActionsReplacement = `<div className="flex flex-wrap items-center justify-end gap-3 pt-2">\r\n                  <button\r\n                    type="button"\r\n                    onClick={() => printRefundReceipt(order)}\r\n                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer shadow-sm active:scale-95"\r\n                    title="In phiếu chi hoàn tiền / biên bản hoàn tất"\r\n                  >\r\n                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">\r\n                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />\r\n                    </svg>\r\n                    <span>In Phiếu Hoàn Tiền</span>\r\n                  </button>\r\n                  <button\r\n                    type="button"\r\n                    disabled={isProcessing}\r\n                    onClick={() => handleOpenReject(order)}`;

refunds = refunds.replace(refundActionsTarget, refundActionsReplacement);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', refunds, 'utf8');
console.log('2. Added Print Refund Receipt to Refunds page!');
