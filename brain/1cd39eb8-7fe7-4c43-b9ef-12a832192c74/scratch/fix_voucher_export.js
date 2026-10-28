const fs = require('fs');

let c = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');

const target = '  function handleOpenCreate() {\r\n    setEditingId(null);\r\n    setForm(emptyForm);\r\n    setFormError(\'\');\r\n    setOpenModal(true);\r\n  }';

const replacement = `  function handleOpenCreate() {\r\n    setEditingId(null);\r\n    setForm(emptyForm);\r\n    setFormError(\'\');\r\n    setOpenModal(true);\r\n  }\r\n\r\n  const handleExportExcel = () => {\r\n    exportToExcel<Voucher>({\r\n      filename: 'Danh_Sach_Voucher',\r\n      sheetName: 'Vouchers',\r\n      data: filteredVouchers,\r\n      columns: [\r\n        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },\r\n        { header: 'Mã ID', key: 'VoucherID', width: 10 },\r\n        { header: 'Mã Voucher (Code)', key: 'Code', width: 18 },\r\n        { header: 'Tên chương trình', key: 'Name', width: 26 },\r\n        { header: 'Tỷ lệ giảm (%)', transform: (v) => Number(v.DiscountPercentage) + '%', width: 16 },\r\n        { header: 'Giảm tối đa (₫)', transform: (v) => v.MaxDiscountAmount ? Number(v.MaxDiscountAmount) : 'Không giới hạn', width: 20 },\r\n        { header: 'Ngày hết hạn', transform: (v) => v.ExpiryDate ? new Date(v.ExpiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn', width: 18 },\r\n        { header: 'Trạng thái', transform: (v) => v.IsActive === false ? 'Tạm ngưng' : 'Hoạt động', width: 16 },\r\n      ],\r\n    });\r\n  };`;

c = c.replace(target, replacement);
fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', c, 'utf8');
console.log('Fixed handleExportExcel in vouchers');
