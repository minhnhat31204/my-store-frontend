const fs = require('fs');

// ====== FIX PRODUCTS: remove the broken void((current) => ...) ======
let products = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', 'utf8');
products = products.replace(
  `      void((current) => current.filter((item) => item.ProductID !== id));\r\n`,
  `      void reload(true);\r\n`
);
fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', products, 'utf8');
console.log('Products fixed');

// ====== FIX VOUCHERS: restore missing handleSubmitForm and handleConfirmDelete ======
let vouchers = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');

// Fix the bad line 151 (deletingVoucher.Code inside handleToggleStatus)
// This is wrong - handleToggleStatus shouldn't reference deletingVoucher
// Let's see what the original toggle was doing
// Replace the entire handleToggleStatus function
const oldToggle = `  async function handleToggleStatus(voucher: Voucher) {\r\n    try {\r\n      const newStatus = !voucher.IsActive;\r\n      await api.updateVoucher(voucher.VoucherID, { IsActive: newStatus });\r\n      void reload(true);\r\n      setSuccessMsg(\`Đã xóa mã giảm giá \"${deletingVoucher.Code}\".\`);\r\n      setDeletingVoucher(null);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không thể xóa mã giảm giá.');\r\n      setTimeout(() => setError(''), 4000);\r\n    } finally {\r\n      setDeleting(false);\r\n    }\r\n  }`;

// Check what's actually there around line 146-160
const toggleIdx = vouchers.indexOf('  async function handleToggleStatus(voucher: Voucher)');
if (toggleIdx !== -1) {
  // Find end of function
  let depth = 0;
  let inFunc = false;
  let end = toggleIdx;
  for (let i = toggleIdx; i < vouchers.length; i++) {
    if (vouchers[i] === '{') { depth++; inFunc = true; }
    else if (vouchers[i] === '}') {
      depth--;
      if (inFunc && depth === 0) { end = i + 1; break; }
    }
  }
  const oldFuncText = vouchers.substring(toggleIdx, end);
  
  const newToggle = `  async function handleToggleStatus(voucher: Voucher) {\r\n    try {\r\n      const newStatus = !voucher.IsActive;\r\n      await api.updateVoucher(voucher.VoucherID, { IsActive: newStatus });\r\n      void reload(true);\r\n      const statusLabel = newStatus ? 'kích hoạt' : 'tạm ngưng';\r\n      setSuccessMsg(\`Đã \${statusLabel} mã "\${voucher.Code}".\`);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.');\r\n      setTimeout(() => setError(''), 4000);\r\n    }\r\n  }`;
  
  vouchers = vouchers.substring(0, toggleIdx) + newToggle + vouchers.substring(end);
  console.log('Vouchers: fixed handleToggleStatus');
}

// Now add handleSubmitForm and handleConfirmDelete before "return ("
const returnIdx = vouchers.indexOf('\r\n  return (\r\n');
if (returnIdx === -1) {
  console.error('return not found in vouchers!');
  process.exit(1);
}

// Check if handleSubmitForm already exists
if (!vouchers.includes('handleSubmitForm')) {
  const newFunctions = `\r\n  async function handleSubmitForm(event: React.FormEvent<HTMLFormElement>) {\r\n    event.preventDefault();\r\n    const Code = form.Code.trim().toUpperCase();\r\n    const Name = form.Name.trim();\r\n    const DiscountPercentage = Number(form.DiscountPercentage);\r\n    const MaxDiscountAmount = form.MaxDiscountAmount ? Number(form.MaxDiscountAmount) : undefined;\r\n    const ExpiryDate = form.ExpiryDate || undefined;\r\n    if (!Code) { setFormError('Vui lòng nhập mã voucher.'); return; }\r\n    if (!DiscountPercentage || DiscountPercentage <= 0 || DiscountPercentage > 100) {\r\n      setFormError('Tỷ lệ giảm phải từ 1 đến 100%.');\r\n      return;\r\n    }\r\n    setSaving(true);\r\n    setFormError('');\r\n    try {\r\n      if (editingId) {\r\n        await api.updateVoucher(editingId, { Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n        setSuccessMsg(\`Đã cập nhật voucher "\${Code}".\`);\r\n      } else {\r\n        await api.createVoucher({ Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n        setSuccessMsg(\`Đã tạo voucher "\${Code}".\`);\r\n      }\r\n      void reload(true);\r\n      setOpenModal(false);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setFormError(err instanceof Error ? err.message : 'Không thể lưu voucher.');\r\n    } finally {\r\n      setSaving(false);\r\n    }\r\n  }\r\n\r\n  async function handleConfirmDelete() {\r\n    if (!deletingVoucher) return;\r\n    setDeleting(true);\r\n    try {\r\n      await api.deleteVoucher(deletingVoucher.VoucherID);\r\n      void reload(true);\r\n      setSuccessMsg(\`Đã xóa mã giảm giá "\${deletingVoucher.Code}".\`);\r\n      setDeletingVoucher(null);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không thể xóa mã giảm giá.');\r\n      setTimeout(() => setError(''), 4000);\r\n    } finally {\r\n      setDeleting(false);\r\n    }\r\n  }\r\n`;

  vouchers = vouchers.substring(0, returnIdx) + newFunctions + vouchers.substring(returnIdx);
  console.log('Vouchers: added handleSubmitForm and handleConfirmDelete');
} else {
  console.log('Vouchers: handleSubmitForm already exists');
}

// Add React import for FormEvent
if (!vouchers.includes('import React') && !vouchers.includes('React.FormEvent')) {
  vouchers = vouchers.replace(
    `import { FormEvent, useMemo, useState } from 'react';`,
    `import React, { FormEvent, useMemo, useState } from 'react';`
  );
}

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', vouchers, 'utf8');
console.log('Vouchers: all fixes applied');
