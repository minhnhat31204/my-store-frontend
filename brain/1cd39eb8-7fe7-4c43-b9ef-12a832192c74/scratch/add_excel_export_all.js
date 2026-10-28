const fs = require('fs');

// ===============================================
// 1. APP/ADMIN/USERS/PAGE.TSX
// ===============================================
let users = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', 'utf8');
if (!users.includes('exportToExcel')) {
  users = users.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportUserFunc = `
  const handleExportExcel = () => {
    exportToExcel<User>({
      filename: 'Danh_Sach_Nguoi_Dung',
      sheetName: 'NguoiDung',
      data: filteredUsers,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã người dùng', key: 'UserID', width: 14 },
        { header: 'Tên đăng nhập', key: 'Username', width: 18 },
        { header: 'Họ và tên', key: 'FullName', width: 22 },
        { 
          header: 'Email liên hệ', 
          transform: (u) => {
            const isInternal = u.Email?.includes('@phone.');
            return (!isInternal && u.Email) ? u.Email : (u.RecoveryEmail || '');
          }, 
          width: 26 
        },
        { header: 'Số điện thoại', key: 'Phone', width: 16 },
        { header: 'Vai trò', transform: (u) => (u.Role || 'customer') === 'admin' ? 'Quản trị viên' : 'Khách hàng', width: 16 },
        { header: 'Ngày tạo', transform: (u) => u.CreatedAt ? new Date(u.CreatedAt).toLocaleString('vi-VN') : '', width: 20 },
      ],
    });
  };
`;

  users = users.replace(
    '  async function handleRoleChange',
    `${exportUserFunc}\n  async function handleRoleChange`
  );

  const exportBtnUsers = `
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => void reload(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-300 transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>
        </div>
`;

  users = users.replace(
    /        <button\r?\n          onClick=\{\(\) => void reload\(true\)\}[\s\S]*?<\/button>/,
    exportBtnUsers
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', users, 'utf8');
  console.log('1. Added Excel export to Users');
}

// ===============================================
// 2. APP/ADMIN/ORDERS/PAGE.TSX
// ===============================================
let orders = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', 'utf8');
if (!orders.includes('exportToExcel')) {
  orders = orders.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportOrderFunc = `
  const handleExportExcel = () => {
    exportToExcel<StoreOrder>({
      filename: 'Danh_Sach_Don_Hang',
      sheetName: 'DonHang',
      data: filteredOrders,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã đơn', transform: (o) => '#' + o.OrderID, width: 12 },
        { header: 'Ngày đặt', transform: (o) => dateTime(o.OrderDate), width: 18 },
        { header: 'Tài khoản đặt', transform: (o) => o.User?.FullName || o.User?.Email || '', width: 20 },
        { header: 'Người nhận hàng', key: 'RecipientName', width: 20 },
        { header: 'SĐT người nhận', key: 'RecipientPhone', width: 16 },
        { header: 'Địa chỉ giao hàng', key: 'ShippingAddress', width: 35 },
        { header: 'Phương thức thanh toán', key: 'PaymentMethod', width: 22 },
        { header: 'Trạng thái đơn hàng', transform: (o) => statusInfo(o.Status).label, width: 20 },
        { header: 'Mã voucher áp dụng', key: 'VoucherCode', width: 18 },
        { header: 'Tổng tiền hàng', transform: (o) => Number(o.TotalAmount || 0), width: 16 },
        { header: 'Mã vận đơn', key: 'TrackingNumber', width: 16 },
        { header: 'Đơn vị vận chuyển', key: 'CarrierName', width: 18 },
        { header: 'Sản phẩm đã mua', transform: (o) => (o.OrderItems || []).map(i => i.Product?.ProductName + ' (x' + i.Quantity + ')').join('; '), width: 40 },
      ],
    });
  };
`;

  orders = orders.replace(
    '  const countsByStatus = useMemo',
    `${exportOrderFunc}\n  const countsByStatus = useMemo`
  );

  // Add button to header
  const headerReplacement = `          <p className="text-sm text-slate-400 mt-1">
            Tổng cộng {orders.length} đơn hàng trong hệ thống cơ sở dữ liệu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel ({filteredOrders.length})</span>
          </button>
          <button
            onClick={() => void reload(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-300 transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>
        </div>`;

  orders = orders.replace(
    /          <p className="text-sm text-slate-400 mt-1">\r?\n            Tổng cộng \{orders\.length\} đơn hàng trong hệ thống cơ sở dữ liệu\.\r?\n          <\/p>\r?\n        <\/div>/,
    headerReplacement
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', orders, 'utf8');
  console.log('2. Added Excel export to Orders');
}

// ===============================================
// 3. APP/ADMIN/PRODUCTS/PAGE.TSX
// ===============================================
let products = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', 'utf8');
if (!products.includes('exportToExcel')) {
  products = products.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportProductFunc = `
  const handleExportExcel = () => {
    const catMap = new Map(categories.map(c => [c.CategoryID, c.CategoryName]));
    exportToExcel<Product>({
      filename: 'Kho_San_Pham',
      sheetName: 'SanPham',
      data: filteredProducts,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã SP', transform: (p) => '#SP' + p.ProductID, width: 12 },
        { header: 'Tên sản phẩm', key: 'ProductName', width: 32 },
        { header: 'Danh mục', transform: (p) => p.CategoryID ? (catMap.get(p.CategoryID) || 'Khác') : 'Chưa phân loại', width: 20 },
        { header: 'Giá gốc (₫)', transform: (p) => Number(p.Price || 0), width: 16 },
        { header: 'Giá khuyến mãi (₫)', transform: (p) => p.DiscountPrice ? Number(p.DiscountPrice) : '', width: 18 },
        { header: 'Tồn kho', transform: (p) => Number(p.StockQuantity || 0), width: 12 },
        { header: 'CPU', key: 'CPU', width: 18 },
        { header: 'RAM', key: 'RAM', width: 14 },
        { header: 'Ổ cứng', key: 'Storage', width: 16 },
        { header: 'Màn hình', key: 'Display', width: 18 },
        { header: 'Tần số quét', key: 'RefreshRate', width: 14 },
        { header: 'Dòng máy', key: 'Series', width: 18 },
      ],
    });
  };
`;

  products = products.replace(
    '  const stats = useMemo',
    `${exportProductFunc}\n  const stats = useMemo`
  );

  // Add Excel button to Products header alongside "Thêm sản phẩm mới"
  products = products.replace(
    `<button\r\n            type="button"\r\n            onClick={() => void reload(true)}`,
    `<button\r\n            type="button"\r\n            onClick={handleExportExcel}\r\n            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"\r\n          >\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">\r\n              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />\r\n            </svg>\r\n            <span>Xuất Excel ({filteredProducts.length})</span>\r\n          </button>\r\n          <button\r\n            type="button"\r\n            onClick={() => void reload(true)}`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', products, 'utf8');
  console.log('3. Added Excel export to Products');
}

// ===============================================
// 4. APP/ADMIN/CATEGORIES/PAGE.TSX
// ===============================================
let categories = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\categories\\page.tsx', 'utf8');
if (!categories.includes('exportToExcel')) {
  categories = categories.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportCatFunc = `
  const handleExportExcel = () => {
    exportToExcel<StoreCategory>({
      filename: 'Danh_Sach_Danh_Muc',
      sheetName: 'DanhMuc',
      data: filteredCategories,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã danh mục', transform: (c) => '#DM' + c.CategoryID, width: 14 },
        { header: 'Tên danh mục', key: 'CategoryName', width: 28 },
        { header: 'Số lượng sản phẩm', transform: (c) => productCounts.get(c.CategoryID) || 0, width: 20 },
        { header: 'Đường dẫn ảnh', key: 'ImageUrl', width: 35 },
      ],
    });
  };
`;

  categories = categories.replace(
    '  function openCreate()',
    `${exportCatFunc}\n  function openCreate()`
  );

  // Add Excel button in Categories top header
  categories = categories.replace(
    `<button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">＋ Thêm danh mục</button>`,
    `<div className="flex items-center gap-2">\r\n          <button type="button" onClick={handleExportExcel} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer">\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>\r\n            <span>Xuất Excel</span>\r\n          </button>\r\n          <button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">＋ Thêm danh mục</button>\r\n        </div>`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\categories\\page.tsx', categories, 'utf8');
  console.log('4. Added Excel export to Categories');
}

// ===============================================
// 5. APP/ADMIN/VOUCHERS/PAGE.TSX
// ===============================================
let vouchers = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');
if (!vouchers.includes('exportToExcel')) {
  vouchers = vouchers.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportVoucherFunc = `
  const handleExportExcel = () => {
    exportToExcel<Voucher>({
      filename: 'Danh_Sach_Voucher',
      sheetName: 'Vouchers',
      data: filteredVouchers,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã ID', key: 'VoucherID', width: 10 },
        { header: 'Mã Voucher (Code)', key: 'Code', width: 18 },
        { header: 'Tên chương trình', key: 'Name', width: 26 },
        { header: 'Tỷ lệ giảm (%)', transform: (v) => Number(v.DiscountPercentage) + '%', width: 16 },
        { header: 'Giảm tối đa (₫)', transform: (v) => v.MaxDiscountAmount ? Number(v.MaxDiscountAmount) : 'Không giới hạn', width: 20 },
        { header: 'Ngày hết hạn', transform: (v) => v.ExpiryDate ? new Date(v.ExpiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn', width: 18 },
        { header: 'Trạng thái', transform: (v) => v.IsActive === false ? 'Tạm ngưng' : 'Hoạt động', width: 16 },
      ],
    });
  };
`;

  vouchers = vouchers.replace(
    '  const handleOpenCreate',
    `${exportVoucherFunc}\n  const handleOpenCreate`
  );

  // Add Excel button to Vouchers header
  vouchers = vouchers.replace(
    `<button\r\n            onClick={() => void reload(true)}`,
    `<button\r\n            onClick={handleExportExcel}\r\n            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer"\r\n          >\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>\r\n            <span>Xuất Excel</span>\r\n          </button>\r\n          <button\r\n            onClick={() => void reload(true)}`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', vouchers, 'utf8');
  console.log('5. Added Excel export to Vouchers');
}

// ===============================================
// 6. APP/ADMIN/REFUNDS/PAGE.TSX
// ===============================================
let refunds = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', 'utf8');
if (!refunds.includes('exportToExcel')) {
  refunds = refunds.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportRefundFunc = `
  const handleExportExcel = () => {
    exportToExcel<StoreOrder>({
      filename: 'Yeu_Cau_Hoan_Tien',
      sheetName: 'HoanTien',
      data: filteredRequests,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã đơn hàng', transform: (r) => '#' + r.OrderID, width: 14 },
        { header: 'Khách hàng', transform: (r) => r.RecipientName || r.User?.FullName || '', width: 22 },
        { header: 'Số điện thoại', transform: (r) => r.RefundPhone || r.RecipientPhone || '', width: 16 },
        { header: 'Số tiền cần hoàn (₫)', transform: (r) => Number(r.TotalAmount || 0), width: 20 },
        { header: 'Ngân hàng thụ hưởng', key: 'RefundBankName', width: 24 },
        { header: 'Số tài khoản', key: 'RefundBankAccount', width: 20 },
        { header: 'Chủ tài khoản', key: 'RefundBankHolder', width: 22 },
        { header: 'Lý do yêu cầu hoàn tiền', key: 'RefundReason', width: 35 },
        { header: 'Thời gian đặt hàng', transform: (r) => dateTime(r.OrderDate), width: 18 },
      ],
    });
  };
`;

  refunds = refunds.replace(
    '  const handleApprove = async',
    `${exportRefundFunc}\n  const handleApprove = async`
  );

  // Add Excel button to Refunds header
  refunds = refunds.replace(
    `<button\r\n            onClick={() => void reload(true)}`,
    `<button\r\n            onClick={handleExportExcel}\r\n            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer"\r\n          >\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>\r\n            <span>Xuất Excel</span>\r\n          </button>\r\n          <button\r\n            onClick={() => void reload(true)}`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', refunds, 'utf8');
  console.log('6. Added Excel export to Refunds');
}

// ===============================================
// 7. APP/ADMIN/REVIEWS/PAGE.TSX
// ===============================================
let reviews = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\reviews\\page.tsx', 'utf8');
if (!reviews.includes('exportToExcel')) {
  reviews = reviews.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportReviewFunc = `
  const handleExportExcel = () => {
    exportToExcel<ProductReview>({
      filename: 'Danh_Gia_San_Pham',
      sheetName: 'DanhGia',
      data: reviews,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã đánh giá', key: 'ReviewID', width: 12 },
        { header: 'Mã sản phẩm', transform: (r) => '#SP' + r.ProductID, width: 14 },
        { header: 'Tên sản phẩm', transform: (r) => r.Product?.ProductName || '', width: 30 },
        { header: 'Khách hàng', transform: (r) => r.User?.FullName || '', width: 22 },
        { header: 'Email liên hệ', transform: (r) => r.User?.Email || '', width: 24 },
        { header: 'Số điện thoại', transform: (r) => r.User?.Phone || '', width: 16 },
        { header: 'Điểm số (Sao)', transform: (r) => r.Rating + ' ★', width: 14 },
        { header: 'Nội dung nhận xét', key: 'Comment', width: 40 },
        { header: 'Thời gian đánh giá', transform: (r) => dateTime(r.CreatedAt), width: 18 },
        { header: 'Phản hồi của Admin', key: 'AdminReply', width: 35 },
        { header: 'Thời gian admin phản hồi', transform: (r) => dateTime(r.AdminReplyAt), width: 18 },
      ],
    });
  };
`;

  reviews = reviews.replace(
    '  const saveReply = async',
    `${exportReviewFunc}\n  const saveReply = async`
  );

  // Add Excel button to Reviews header
  reviews = reviews.replace(
    `<button\r\n            type="button"\r\n            onClick={() => void reloadReviews(true)}`,
    `<button\r\n            type="button"\r\n            onClick={handleExportExcel}\r\n            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"\r\n          >\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>\r\n            <span>Xuất Excel</span>\r\n          </button>\r\n          <button\r\n            type="button"\r\n            onClick={() => void reloadReviews(true)}`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\reviews\\page.tsx', reviews, 'utf8');
  console.log('7. Added Excel export to Reviews');
}

// ===============================================
// 8. APP/ADMIN/BANNERS/PAGE.TSX
// ===============================================
let banners = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', 'utf8');
if (!banners.includes('exportToExcel')) {
  banners = banners.replace(
    "import { useAdminData } from '@/lib/useAdminData';",
    "import { useAdminData } from '@/lib/useAdminData';\nimport { exportToExcel } from '@/lib/exportExcel';"
  );

  const exportBannerFunc = `
  const handleExportExcel = () => {
    exportToExcel<Promotion>({
      filename: 'Danh_Sach_Banner_Khuyen_Mai',
      sheetName: 'Banner',
      data: filteredPromotions,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã banner', key: 'PromotionID', width: 12 },
        { header: 'Tiêu đề chiến dịch', key: 'Title', width: 30 },
        { header: 'Mô tả', key: 'Description', width: 40 },
        { header: 'Giảm giá (%)', transform: (b) => b.DiscountPercent ? b.DiscountPercent + '%' : '', width: 14 },
        { header: 'Link điều hướng', key: 'LinkUrl', width: 28 },
        { header: 'Đường dẫn ảnh banner', key: 'ImageUrl', width: 35 },
      ],
    });
  };
`;

  banners = banners.replace(
    '  const openCreateModal = () =>',
    `${exportBannerFunc}\n  const openCreateModal = () =>`
  );

  // Add Excel button to Banners header
  banners = banners.replace(
    `<button\r\n            onClick={openCreateModal}`,
    `<button\r\n            onClick={handleExportExcel}\r\n            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"\r\n          >\r\n            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>\r\n            <span>Xuất Excel</span>\r\n          </button>\r\n          <button\r\n            onClick={openCreateModal}`
  );

  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', banners, 'utf8');
  console.log('8. Added Excel export to Banners');
}

console.log('\nFinished configuring Excel export for all admin pages!');
