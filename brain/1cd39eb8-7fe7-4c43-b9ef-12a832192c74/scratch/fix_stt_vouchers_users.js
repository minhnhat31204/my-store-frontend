const fs = require('fs');

// ============================================
// 1. FIX VOUCHERS: add STT cell in table body
// ============================================
let v = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');

const oldVoucherRow = `<tr key={v.VoucherID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4">`;

const newVoucherRow = `<tr key={v.VoucherID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs w-16">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4">`;

if (v.includes(oldVoucherRow)) {
  v = v.replace(oldVoucherRow, newVoucherRow);
  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', v, 'utf8');
  console.log('Fixed Vouchers table body with STT cell!');
} else {
  console.log('Voucher row not matched exactly, checking pattern...');
  const idx = v.indexOf('{visibleVouchers.map');
  const trIdx = v.indexOf('<tr key={v.VoucherID}', idx);
  const tdIdx = v.indexOf('<td className="px-5 py-4">', trIdx);
  if (trIdx !== -1 && tdIdx !== -1) {
    const insert = `                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs w-16">\r\n                        {stt}\r\n                      </td>\r\n`;
    v = v.substring(0, tdIdx) + insert + v.substring(tdIdx);
    fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', v, 'utf8');
    console.log('Fixed Vouchers via index insertion!');
  }
}

// ============================================
// 2. FIX USERS: add STT header & STT cell
// ============================================
let u = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', 'utf8');

// Replace table header
const oldUsersHeader = `<tr>\r\n                  <th className="px-5 py-4">ID</th>`;
const newUsersHeader = `<tr>\r\n                  <th className="px-5 py-4 w-16 text-center">STT</th>\r\n                  <th className="px-5 py-4">Mã tài khoản</th>`;

if (u.includes(oldUsersHeader)) {
  u = u.replace(oldUsersHeader, newUsersHeader);
}

// Replace table row
const oldUsersRow = `<tr key={user.UserID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">\r\n                        #{user.UserID}\r\n                      </td>`;

const newUsersRow = `<tr key={user.UserID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs w-16">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 font-mono font-bold text-purple-400 text-xs whitespace-nowrap">\r\n                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">#{user.UserID}</span>\r\n                      </td>`;

if (u.includes(oldUsersRow)) {
  u = u.replace(oldUsersRow, newUsersRow);
  fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', u, 'utf8');
  console.log('Fixed Users table header and body with STT!');
} else {
  console.log('Users row not matched exactly, checking pattern...');
  const trIdx = u.indexOf('<tr key={user.UserID}');
  const tdIdx = u.indexOf('<td className="px-5 py-4 font-mono', trIdx);
  if (trIdx !== -1 && tdIdx !== -1) {
    const tdEnd = u.indexOf('</td>', tdIdx) + 5;
    u = u.substring(0, tdIdx) + `<td className="px-5 py-4 text-center font-bold text-slate-400 text-xs w-16">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 font-mono font-bold text-purple-400 text-xs whitespace-nowrap">\r\n                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">#{user.UserID}</span>\r\n                      </td>` + u.substring(tdEnd);
    fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', u, 'utf8');
    console.log('Fixed Users via index replacement!');
  }
}
