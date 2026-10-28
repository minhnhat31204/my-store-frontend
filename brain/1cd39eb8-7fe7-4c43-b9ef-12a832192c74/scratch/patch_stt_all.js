const fs = require('fs');

// ==========================================
// 1. PATCH USERS: app/admin/users/page.tsx
// ==========================================
let users = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', 'utf8');

// Replace Table header: add STT
users = users.replace(
  `                <tr>\r\n                  <th className="px-5 py-4">ID</th>`,
  `                <tr>\r\n                  <th className="px-5 py-4 w-16 text-center">STT</th>\r\n                  <th className="px-5 py-4">Mã tài khoản</th>`
);

// In map: add index to calculate STT
users = users.replace(
  `                {visibleUsers.map((user) => {`,
  `                {visibleUsers.map((user, index) => {\r\n                  const stt = (currentPage - 1) * 20 + index + 1;`
);

// In row: render STT cell and clear Code cell
users = users.replace(
  `                    <tr key={user.UserID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">\r\n                        #{user.UserID}\r\n                      </td>`,
  `                    <tr key={user.UserID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 font-mono font-bold text-purple-400 text-xs whitespace-nowrap">\r\n                        <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">#{user.UserID}</span>\r\n                      </td>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\users\\page.tsx', users, 'utf8');
console.log('1. Patched: Users');

// ==========================================
// 2. PATCH ORDERS: app/admin/orders/page.tsx
// ==========================================
let orders = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', 'utf8');

// Replace Table header: add STT
orders = orders.replace(
  `                <tr>\r\n                  <th className="px-5 py-4">Mã đơn</th>`,
  `                <tr>\r\n                  <th className="px-5 py-4 w-16 text-center">STT</th>\r\n                  <th className="px-5 py-4">Mã đơn</th>`
);

// In map: add index
orders = orders.replace(
  `                {visibleOrders.map((order) => {`,
  `                {visibleOrders.map((order, index) => {\r\n                  const stt = (currentPage - 1) * 20 + index + 1;`
);

// In row: render STT cell before OrderID cell
orders = orders.replace(
  `                    <tr key={order.OrderID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 font-mono font-bold text-blue-400 text-xs">`,
  `                    <tr key={order.OrderID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 font-mono font-bold text-blue-400 text-xs">`
);

// If pattern doesn't match, check what row contains
if (!orders.includes('text-center font-bold text-slate-400 text-xs')) {
  console.log('Orders row didn\'t match exact pattern, searching row start...');
  const rowTarget = '                    <tr key={order.OrderID}';
  const rowIdx = orders.indexOf(rowTarget);
  if (rowIdx !== -1) {
    const afterTr = orders.indexOf('>\r\n', rowIdx) + 3;
    const insertStt = `                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">\r\n                        {stt}\r\n                      </td>\r\n`;
    orders = orders.substring(0, afterTr) + insertStt + orders.substring(afterTr);
    console.log('Orders row patched via index insertion');
  }
}

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', orders, 'utf8');
console.log('2. Patched: Orders');

// ==========================================
// 3. PATCH PRODUCTS: app/admin/products/page.tsx
// ==========================================
let products = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', 'utf8');

// Replace Table header: add STT
products = products.replace(
  `                <tr>\r\n                  <th className="px-5 py-4">Mã SP</th>`,
  `                <tr>\r\n                  <th className="px-5 py-4 w-16 text-center">STT</th>\r\n                  <th className="px-5 py-4">Mã SP</th>`
);

// In map: add index
products = products.replace(
  `                {visibleProducts.map((item) => {`,
  `                {visibleProducts.map((item, index) => {\r\n                  const stt = (currentPage - 1) * 20 + index + 1;`
);

// In row: render STT cell before ProductID cell
products = products.replace(
  `                    <tr key={item.ProductID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 whitespace-nowrap">`,
  `                    <tr key={item.ProductID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 whitespace-nowrap">`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\products\\page.tsx', products, 'utf8');
console.log('3. Patched: Products');

// ==========================================
// 4. PATCH VOUCHERS: app/admin/vouchers/page.tsx
// ==========================================
let vouchers = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', 'utf8');

// Replace Table header: add STT
vouchers = vouchers.replace(
  `                <tr>\r\n                  <th className="px-5 py-4">Mã Voucher</th>`,
  `                <tr>\r\n                  <th className="px-5 py-4 w-16 text-center">STT</th>\r\n                  <th className="px-5 py-4">Mã Voucher</th>`
);

// In map: add index
vouchers = vouchers.replace(
  `                {visibleVouchers.map((v) => {`,
  `                {visibleVouchers.map((v, index) => {\r\n                  const stt = (currentPage - 1) * 20 + index + 1;`
);

// In row: render STT cell
vouchers = vouchers.replace(
  `                    <tr key={v.VoucherID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 font-mono font-bold text-xs text-white">`,
  `                    <tr key={v.VoucherID} className="hover:bg-slate-800/40 transition">\r\n                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">\r\n                        {stt}\r\n                      </td>\r\n                      <td className="px-5 py-4 font-mono font-bold text-xs text-white">`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\vouchers\\page.tsx', vouchers, 'utf8');
console.log('4. Patched: Vouchers');

// ==========================================
// 5. PATCH CATEGORIES: app/admin/categories/page.tsx
// ==========================================
let categories = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\categories\\page.tsx', 'utf8');

// Header grid: add STT
categories = categories.replace(
  `<div className="hidden grid-cols-[minmax(0,1fr)_160px_180px] gap-4 border-b border-slate-800 bg-slate-950/60 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 sm:grid"><span>Danh mục</span><span>Sản phẩm</span><span className="text-right">Thao tác</span></div>`,
  `<div className="hidden grid-cols-[60px_minmax(0,1fr)_160px_180px] gap-4 border-b border-slate-800 bg-slate-950/60 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 sm:grid"><span className="text-center">STT</span><span>Danh mục</span><span>Sản phẩm</span><span className="text-right">Thao tác</span></div>`
);

// In map: add index
categories = categories.replace(
  `            {visibleCategories.map((category) => {`,
  `            {visibleCategories.map((category, index) => {\r\n              const stt = (currentPage - 1) * 20 + index + 1;`
);

// In article: grid-cols with STT
categories = categories.replace(
  `<article key={category.CategoryID} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_160px_180px] sm:items-center sm:gap-4 sm:px-5">`,
  `<article key={category.CategoryID} className="grid gap-3 p-4 sm:grid-cols-[60px_minmax(0,1fr)_160px_180px] sm:items-center sm:gap-4 sm:px-5">\r\n                  <div className="hidden sm:block text-center font-bold text-slate-400 text-xs">{stt}</div>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\categories\\page.tsx', categories, 'utf8');
console.log('5. Patched: Categories');

// ==========================================
// 6. PATCH REVIEWS: app/admin/reviews/page.tsx
// ==========================================
let reviews = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\reviews\\page.tsx', 'utf8');

// In visibleGroups: add index for group STT
reviews = reviews.replace(
  `          {visibleGroups.map(([productId, group]) => (`,
  `          {visibleGroups.map(([productId, group], index) => {\r\n            const stt = (page - 1) * 20 + index + 1;\r\n            return (`
);

// In header: show STT badge
reviews = reviews.replace(
  `<h2 className="truncate text-base font-black text-white">{group.name}</h2>`,
  `<div className="flex items-center gap-2">\r\n                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">STT: {stt}</span>\r\n                    <h2 className="truncate text-base font-black text-white">{group.name}</h2>\r\n                  </div>`
);

// Close return
reviews = reviews.replace(
  `          ))}\r\n        </div>`,
  `          );}\r\n          )}\r\n        </div>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\reviews\\page.tsx', reviews, 'utf8');
console.log('6. Patched: Reviews');

// ==========================================
// 7. PATCH REFUNDS: app/admin/refunds/page.tsx
// ==========================================
let refunds = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', 'utf8');

// In map: add index
refunds = refunds.replace(
  `          {visibleRequests.map((order) => {`,
  `          {visibleRequests.map((order, index) => {\r\n            const stt = (currentPage - 1) * 20 + index + 1;`
);

// In header of refund card: show STT
refunds = refunds.replace(
  `<div className="flex items-center gap-3">\r\n                    <span className="text-lg font-black text-white">Đơn hàng #{order.OrderID}</span>`,
  `<div className="flex items-center gap-3">\r\n                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">STT: {stt}</span>\r\n                    <span className="text-lg font-black text-white">Đơn hàng #{order.OrderID}</span>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\refunds\\page.tsx', refunds, 'utf8');
console.log('7. Patched: Refunds');

// ==========================================
// 8. PATCH BANNERS: app/admin/banners/page.tsx
// ==========================================
let banners = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', 'utf8');

// In map: add index
banners = banners.replace(
  `          {visiblePromotions.map((p) => {`,
  `          {visiblePromotions.map((p, index) => {\r\n            const stt = (promoCurrentPage - 1) * 9 + index + 1;`
);

// In card: show STT at top left badge
banners = banners.replace(
  `                    <img src={img} alt={p.Title || ''} className="w-full h-full object-cover" />\r\n                    <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">\r\n                      #{p.PromotionID}\r\n                    </span>`,
  `                    <img src={img} alt={p.Title || ''} className="w-full h-full object-cover" />\r\n                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/90 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-xs">\r\n                      STT: {stt}\r\n                    </span>\r\n                    <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">\r\n                      Mã: #{p.PromotionID}\r\n                    </span>`
);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\banners\\page.tsx', banners, 'utf8');
console.log('8. Patched: Banners');

console.log('\nAll 8 admin sections successfully patched with STT!');
