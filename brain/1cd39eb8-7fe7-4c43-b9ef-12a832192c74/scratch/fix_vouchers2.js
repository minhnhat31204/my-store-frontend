const fs = require('fs');

// ====== FIX VOUCHERS ======
let vouchers = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');

// Fix handleToggleStatus - it has deletingVoucher.Code which is null reference
// Find and replace just the bad line
vouchers = vouchers.replace(
  "      setSuccessMsg(`Đã xóa mã giảm giá \"${deletingVoucher.Code}\".`);\r\n      setDeletingVoucher(null);",
  "      const statusLabel = newStatus ? 'kích hoạt' : 'tạm ngưng';\r\n      setSuccessMsg(`Đã ${statusLabel} mã \"${voucher.Code}\".\`);"
);

// Better approach: use a simpler string
vouchers = vouchers.split(
  "      setSuccessMsg(`Đã xóa mã giảm giá \"${deletingVoucher.Code}\".\`);\r\n      setDeletingVoucher(null);"
).join(
  "      setSuccessMsg(`Đã cập nhật trạng thái mã \"${voucher.Code}\".\`);"
);

// Also try the actual string in file (without template literal issues in JS)
const badLine = '      setSuccessMsg(`\u0110\u00e3 x\u00f3a m\u00e3 gi\u1ea3m gi\u00e1 \\\"${deletingVoucher.Code}\\\".\`);';
if (vouchers.includes('deletingVoucher.Code')) {
  // Replace the line containing deletingVoucher.Code in handleToggleStatus
  const lines = vouchers.split('\n');
  const fixed = lines.map((line, i) => {
    if (line.includes('deletingVoucher.Code') && lines.slice(Math.max(0,i-15), i).some(l => l.includes('handleToggleStatus'))) {
      return '      setSuccessMsg(`Đã cập nhật trạng thái mã "${voucher.Code}".`);';
    }
    return line;
  });
  vouchers = fixed.join('\n');
  
  // Also remove the setDeletingVoucher(null) line right after it if it's there
  const setDeleteLine = '      setDeletingVoucher(null);';
  // Only in context of handleToggleStatus
  const toggleIdx = vouchers.indexOf('async function handleToggleStatus');
  const nextFuncIdx = vouchers.indexOf('async function ', toggleIdx + 10);
  if (toggleIdx !== -1 && nextFuncIdx !== -1) {
    const toggleSection = vouchers.substring(toggleIdx, nextFuncIdx);
    const fixedToggle = toggleSection.split('      setDeletingVoucher(null);\r\n').join('');
    const fixedToggle2 = fixedToggle.split('      setDeletingVoucher(null);\n').join('');
    vouchers = vouchers.substring(0, toggleIdx) + fixedToggle2 + vouchers.substring(nextFuncIdx);
  }
}

// Now add handleSubmitForm and handleConfirmDelete if missing
if (!vouchers.includes('handleSubmitForm')) {
  const returnIdx = vouchers.lastIndexOf('\r\n  return (');
  if (returnIdx === -1) {
    const returnIdx2 = vouchers.lastIndexOf('\n  return (');
    if (returnIdx2 !== -1) {
      const newFunctions = [
        '',
        '  async function handleSubmitForm(event) {',
        '    event.preventDefault();',
        '    const Code = form.Code.trim().toUpperCase();',
        '    const Name = form.Name.trim();',
        '    const DiscountPercentage = Number(form.DiscountPercentage);',
        '    const MaxDiscountAmount = form.MaxDiscountAmount ? Number(form.MaxDiscountAmount) : undefined;',
        '    const ExpiryDate = form.ExpiryDate || undefined;',
        '    if (!Code) { setFormError("Vui lòng nhập mã voucher."); return; }',
        '    if (!DiscountPercentage || DiscountPercentage <= 0 || DiscountPercentage > 100) {',
        '      setFormError("Tỷ lệ giảm phải từ 1 đến 100%.");',
        '      return;',
        '    }',
        '    setSaving(true);',
        '    setFormError("");',
        '    try {',
        '      if (editingId) {',
        '        await api.updateVoucher(editingId, { Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });',
        '        setSuccessMsg(`Đã cập nhật voucher "${Code}".`);',
        '      } else {',
        '        await api.createVoucher({ Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });',
        '        setSuccessMsg(`Đã tạo voucher "${Code}".`);',
        '      }',
        '      void reload(true);',
        '      setOpenModal(false);',
        '      setTimeout(() => setSuccessMsg(""), 4000);',
        '    } catch (err) {',
        '      setFormError(err instanceof Error ? err.message : "Không thể lưu voucher.");',
        '    } finally {',
        '      setSaving(false);',
        '    }',
        '  }',
        '',
        '  async function handleConfirmDelete() {',
        '    if (!deletingVoucher) return;',
        '    setDeleting(true);',
        '    try {',
        '      await api.deleteVoucher(deletingVoucher.VoucherID);',
        '      void reload(true);',
        '      setSuccessMsg(`Đã xóa mã giảm giá "${deletingVoucher.Code}".`);',
        '      setDeletingVoucher(null);',
        '      setTimeout(() => setSuccessMsg(""), 4000);',
        '    } catch (err) {',
        '      setError(err instanceof Error ? err.message : "Không thể xóa mã giảm giá.");',
        '      setTimeout(() => setError(""), 4000);',
        '    } finally {',
        '      setDeleting(false);',
        '    }',
        '  }',
        '',
      ].join('\n');
      vouchers = vouchers.substring(0, returnIdx2) + newFunctions + vouchers.substring(returnIdx2);
      console.log('Vouchers: added functions (LF)');
    }
  } else {
    const newFunctions = '\r\n  async function handleSubmitForm(event) {\r\n    event.preventDefault();\r\n    const Code = form.Code.trim().toUpperCase();\r\n    const Name = form.Name.trim();\r\n    const DiscountPercentage = Number(form.DiscountPercentage);\r\n    const MaxDiscountAmount = form.MaxDiscountAmount ? Number(form.MaxDiscountAmount) : undefined;\r\n    const ExpiryDate = form.ExpiryDate || undefined;\r\n    if (!Code) { setFormError(\'Vui lòng nhập mã voucher.\'); return; }\r\n    if (!DiscountPercentage || DiscountPercentage <= 0 || DiscountPercentage > 100) {\r\n      setFormError(\'Tỷ lệ giảm phải từ 1 đến 100%.\');\r\n      return;\r\n    }\r\n    setSaving(true);\r\n    setFormError(\'\');\r\n    try {\r\n      if (editingId) {\r\n        await api.updateVoucher(editingId, { Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n      } else {\r\n        await api.createVoucher({ Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n      }\r\n      void reload(true);\r\n      setOpenModal(false);\r\n    } catch (err) {\r\n      setFormError(err instanceof Error ? err.message : \'Không thể lưu voucher.\');\r\n    } finally {\r\n      setSaving(false);\r\n    }\r\n  }\r\n\r\n  async function handleConfirmDelete() {\r\n    if (!deletingVoucher) return;\r\n    setDeleting(true);\r\n    try {\r\n      await api.deleteVoucher(deletingVoucher.VoucherID);\r\n      void reload(true);\r\n      setDeletingVoucher(null);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : \'Không thể xóa mã giảm giá.\');\r\n      setTimeout(() => setError(\'\'), 4000);\r\n    } finally {\r\n      setDeleting(false);\r\n    }\r\n  }\r\n';
    vouchers = vouchers.substring(0, returnIdx) + newFunctions + vouchers.substring(returnIdx);
    console.log('Vouchers: added functions (CRLF)');
  }
} else {
  console.log('Vouchers: handleSubmitForm already exists');
}

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', vouchers, 'utf8');
console.log('Vouchers: saved');

// Verify
const v2 = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');
console.log('Has handleSubmitForm:', v2.includes('handleSubmitForm'));
console.log('Has handleConfirmDelete:', v2.includes('handleConfirmDelete'));
console.log('Has deletingVoucher.Code in toggle:', v2.includes('deletingVoucher.Code') && v2.includes('handleToggleStatus'));
