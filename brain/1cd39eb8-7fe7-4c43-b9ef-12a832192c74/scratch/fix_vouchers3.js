const fs = require('fs');
const filePath = 'D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Insert handleSubmitForm and handleConfirmDelete right before "  return ("
const returnTarget = '\r\n  return (\r\n';
const returnIdx = content.indexOf(returnTarget);
if (returnIdx === -1) {
  console.error('Could not find return (');
  process.exit(1);
}

const newFuncs = `\r\n  async function handleSubmitForm(event: React.FormEvent<HTMLFormElement>) {\r\n    event.preventDefault();\r\n    const Code = form.Code.trim().toUpperCase();\r\n    const Name = form.Name.trim();\r\n    const DiscountPercentage = Number(form.DiscountPercentage);\r\n    const MaxDiscountAmount = form.MaxDiscountAmount ? Number(form.MaxDiscountAmount) : undefined;\r\n    const ExpiryDate = form.ExpiryDate || undefined;\r\n    if (!Code) { setFormError('Vui lòng nhập mã voucher.'); return; }\r\n    if (!DiscountPercentage || DiscountPercentage <= 0 || DiscountPercentage > 100) {\r\n      setFormError('Tỷ lệ giảm phải từ 1 đến 100%.');\r\n      return;\r\n    }\r\n    setSaving(true);\r\n    setFormError('');\r\n    try {\r\n      if (editingId) {\r\n        await api.updateVoucher(editingId, { Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n        setSuccessMsg('Đã cập nhật voucher "' + Code + '".');\r\n      } else {\r\n        await api.createVoucher({ Code, Name, DiscountPercentage, MaxDiscountAmount, ExpiryDate, IsActive: form.IsActive });\r\n        setSuccessMsg('Đã tạo voucher "' + Code + '".');\r\n      }\r\n      void reload(true);\r\n      setOpenModal(false);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setFormError(err instanceof Error ? err.message : 'Không thể lưu voucher.');\r\n    } finally {\r\n      setSaving(false);\r\n    }\r\n  }\r\n\r\n  async function handleConfirmDelete() {\r\n    if (!deletingVoucher) return;\r\n    setDeleting(true);\r\n    try {\r\n      await api.deleteVoucher(deletingVoucher.VoucherID);\r\n      void reload(true);\r\n      setDeletingVoucher(null);\r\n      setTimeout(() => setSuccessMsg(''), 4000);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không thể xóa mã giảm giá.');\r\n      setTimeout(() => setError(''), 4000);\r\n    } finally {\r\n      setDeleting(false);\r\n    }\r\n  }\r\n`;

content = content.substring(0, returnIdx) + newFuncs + content.substring(returnIdx);
fs.writeFileSync(filePath, content, 'utf8');

// Verify
const c2 = fs.readFileSync(filePath, 'utf8');
const matches = [...c2.matchAll(/async function handle/g)];
console.log('Function definitions found:');
matches.forEach(m => {
  const line = c2.substring(0, m.index).split('\n').length;
  console.log(`  Line ${line}: ${c2.substring(m.index, m.index+45)}`);
});

// Add React import if missing
if (!c2.includes('import React') && c2.includes('React.FormEvent')) {
  let c3 = c2.replace(
    `import React, { FormEvent, useMemo, useState } from 'react';`,
    `import React, { FormEvent, useMemo, useState } from 'react';`
  );
  // Already may have React import
  c3 = c2.replace(
    `import { FormEvent, useMemo, useState } from 'react';`,
    `import React, { FormEvent, useMemo, useState } from 'react';`
  );
  fs.writeFileSync(filePath, c3, 'utf8');
}

const final = fs.readFileSync(filePath, 'utf8');
if (!final.includes('import React')) {
  const fixed = final.replace(
    `import { FormEvent, useMemo, useState } from 'react';\r\n`,
    `import React, { FormEvent, useMemo, useState } from 'react';\r\n`
  );
  fs.writeFileSync(filePath, fixed, 'utf8');
}

console.log('Done. Has React:', fs.readFileSync(filePath, 'utf8').includes('import React'));
