const fs = require('fs');
const filePath = 'D:\\my-store-frontend\\app\\admin\\layout.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add prefetch import
content = content.replace(
  `import { useAdminGuard } from '@/lib/useAdminGuard';\r\n`,
  `import { useAdminGuard } from '@/lib/useAdminGuard';\r\nimport { prefetch } from '@/lib/adminCache';\r\n`
);

// 2. Add a prefetch helper map after NAV_GROUPS definition
const prefetchHelperCode = `
// Map route -> cache key + fetcher (for prefetch on hover)
const PREFETCH_MAP: Record<string, { key: string; fetcher: () => Promise<unknown> }> = {
  '/admin/users': { key: 'admin:users', fetcher: () => api.getUsers() },
  '/admin/orders': { key: 'admin:orders', fetcher: () => api.getOrders() },
  '/admin/refunds': { key: 'admin:refunds', fetcher: () => api.getRefundRequests() },
  '/admin/products': {
    key: 'admin:products',
    fetcher: async () => {
      const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);
      return { products: Array.isArray(prods) ? prods : [], categories: Array.isArray(cats) ? cats : [] };
    },
  },
  '/admin/reviews': { key: 'admin:reviews', fetcher: () => api.getAdminReviews() },
  '/admin/banners': {
    key: 'admin:banners',
    fetcher: async () => {
      const [promos, prods] = await Promise.all([api.getPromotions(), api.getProducts().catch(() => [])]);
      return { promotions: promos, products: prods };
    },
  },
  '/admin/categories': {
    key: 'admin:categories',
    fetcher: async () => {
      const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts()]);
      return { categories: Array.isArray(cats) ? cats : [], products: Array.isArray(prods) ? prods : [] };
    },
  },
  '/admin/vouchers': { key: 'admin:vouchers', fetcher: () => api.getVouchers() },
};

`;

// Insert after NAV_GROUPS closing
content = content.replace(
  `];\r\n\r\nexport default function AdminLayout`,
  `];\r\n${prefetchHelperCode}\r\nexport default function AdminLayout`
);

// 3. Add onMouseEnter to the Link in desktop sidebar
content = content.replace(
  `                  \u003cLink\r\n                    key={item.href}\r\n                    href={item.href}\r\n                    className={`,
  `                  \u003cLink\r\n                    key={item.href}\r\n                    href={item.href}\r\n                    onMouseEnter={() => { const p = PREFETCH_MAP[item.href]; if (p) prefetch(p.key, p.fetcher); }}\r\n                    className={`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Layout patched with prefetch');
console.log('Has prefetch import:', content.includes("import { prefetch } from '@/lib/adminCache'"));
console.log('Has PREFETCH_MAP:', content.includes('PREFETCH_MAP'));
console.log('Has onMouseEnter:', content.includes('onMouseEnter'));
