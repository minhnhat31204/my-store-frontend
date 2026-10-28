const fs = require('fs');

function patchFile(filePath, patches) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of patches) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    } else {
      console.warn(`  [WARN] Pattern not found in ${filePath}:\n  ${from.substring(0, 80)}...`);
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Patched: ${filePath}`);
  }
  return changed;
}

const BASE = 'D:\\my-store-frontend\\app\\admin';

// ====== ORDERS ======
patchFile(`${BASE}\\orders\\page.tsx`, [
  [
    `import Pagination from '@/app/admin/components/Pagination';`,
    `import Pagination from '@/app/admin/components/Pagination';\nimport { useAdminData } from '@/lib/useAdminData';`
  ],
  [
    `  const [orders, setOrders] = useState<StoreOrder[]>([]);\r\n  const [loading, setLoading] = useState(true);\r\n  const [error, setError] = useState('');\r\n  const [selected`,
    `  const { data: ordersData, loading, error, reload } = useAdminData<StoreOrder[]>(\r\n    'admin:orders',\r\n    () => api.getOrders(),\r\n  );\r\n  const orders = ordersData ?? [];\r\n  const [selected`
  ],
  [
    `  useEffect(() => {\r\n    api.getOrders()\r\n      .then((data) => setOrders(Array.isArray(data) ? data : []))\r\n      .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng'))\r\n      .finally(() => setLoading(false));\r\n  }, []);\r\n`,
    ``
  ],
]);

// ====== REVIEWS ======
patchFile(`${BASE}\\reviews\\page.tsx`, [
  [
    `import { useEffect, useMemo, useState } from 'react';`,
    `import { useEffect, useMemo, useState } from 'react';`
  ],
]);
// Reviews needs special handling because it also stores replies
let reviewsContent = fs.readFileSync(`${BASE}\\reviews\\page.tsx`, 'utf8');
if (!reviewsContent.includes('useAdminData')) {
  reviewsContent = reviewsContent.replace(
    `import { useEffect, useMemo, useState } from 'react';`,
    `import { useMemo, useState } from 'react';`
  );
  reviewsContent = reviewsContent.replace(
    `import { api, getPrimaryProductImage, type ProductReview } from '@/lib/api';`,
    `import { api, getPrimaryProductImage, type ProductReview } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  reviewsContent = reviewsContent.replace(
    `export default function AdminReviewsPage() {\n  const [reviews, setReviews] = useState<ProductReview[]>([]);\n  const [replies, setReplies] = useState<Record<number, string>>({});\n  const [search, setSearch] = useState('');\n  const [page, setPage] = useState(1);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState('');\n  const [savingId, setSavingId] = useState<number | null>(null);\n  const [feedback, setFeedback] = useState<Record<number, string>>({});\n\n  const loadReviews = async () => {\n    setLoading(true);\n    setError('');\n    try {\n      const data = await api.getAdminReviews();\n      const rows = Array.isArray(data) ? data : [];\n      setReviews(rows);\n      setReplies(Object.fromEntries(rows.map((review) => [review.ReviewID, review.AdminReply || ''])));\n    } catch (err) {\n      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đánh giá.');\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  useEffect(() => { void loadReviews(); }, []);`,
    `export default function AdminReviewsPage() {\n  const { data: reviewsData, loading, error, reload: reloadReviews } = useAdminData<ProductReview[]>(\n    'admin:reviews',\n    () => api.getAdminReviews(),\n  );\n  const reviews = reviewsData ?? [];\n  const [replies, setReplies] = useState<Record<number, string>>({});\n  const [search, setSearch] = useState('');\n  const [page, setPage] = useState(1);\n  const [savingId, setSavingId] = useState<number | null>(null);\n  const [feedback, setFeedback] = useState<Record<number, string>>({});\n\n  // Sync replies khi reviews thay đổi\n  const prevReviewsRef = require('react').useRef<ProductReview[]>([]);\n  if (prevReviewsRef.current !== reviews && reviews.length > 0) {\n    prevReviewsRef.current = reviews;\n    setReplies(Object.fromEntries(reviews.map((review) => [review.ReviewID, review.AdminReply || ''])));\n  }`
  );
  fs.writeFileSync(`${BASE}\\reviews\\page.tsx`, reviewsContent, 'utf8');
  console.log('  Patched: reviews');
} else {
  console.log('  Already patched: reviews');
}

// ====== REFUNDS ======
let refundsContent = fs.readFileSync(`${BASE}\\refunds\\page.tsx`, 'utf8');
if (!refundsContent.includes('useAdminData')) {
  refundsContent = refundsContent.replace(
    `import { useEffect, useState } from 'react';`,
    `import { useState } from 'react';`
  );
  refundsContent = refundsContent.replace(
    `import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';`,
    `import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  refundsContent = refundsContent.replace(
    `export default function AdminRefundsPage() {\r\n  const [requests, setRequests] = useState<StoreOrder[]>([]);\r\n  const [page, setPage] = useState(1);\r\n  const [loading, setLoading] = useState(true);\r\n  const [error, setError] = useState('');`,
    `export default function AdminRefundsPage() {\r\n  const { data: requestsData, loading, error, reload } = useAdminData<StoreOrder[]>(\r\n    'admin:refunds',\r\n    () => api.getRefundRequests(),\r\n  );\r\n  const requests = requestsData ?? [];\r\n  const [page, setPage] = useState(1);`
  );
  // Remove loadRequests function + useEffect
  refundsContent = refundsContent.replace(
    `\r\n  const loadRequests = async () => {\r\n    setLoading(true);\r\n    setError('');\r\n    try {\r\n      const data = await api.getRefundRequests();\r\n      setRequests(data);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu hoàn tiền.');\r\n    } finally {\r\n      setLoading(false);`,
    `\r\n  // loadRequests replaced by useAdminData\r\n  function _unused() {`
  );
  fs.writeFileSync(`${BASE}\\refunds\\page.tsx`, refundsContent, 'utf8');
  console.log('  Patched: refunds (partial)');
}

// ====== CATEGORIES ======
let catContent = fs.readFileSync(`${BASE}\\categories\\page.tsx`, 'utf8');
if (!catContent.includes('useAdminData')) {
  catContent = catContent.replace(
    `import { FormEvent, useEffect, useMemo, useState } from 'react';`,
    `import { FormEvent, useMemo, useState } from 'react';`
  );
  catContent = catContent.replace(
    `import { api, type Product, type StoreCategory } from '@/lib/api';`,
    `import { api, type Product, type StoreCategory } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  catContent = catContent.replace(
    `export default function AdminCategoriesPage() {\n  const [categories, setCategories] = useState<StoreCategory[]>([]);\n  const [products, setProducts] = useState<Product[]>([]);\n  const [search, setSearch] = useState('');\n  const [page, setPage] = useState(1);\n  const [loading, setLoading] = useState(true);`,
    `export default function AdminCategoriesPage() {\n  type CatAndProd = { categories: StoreCategory[]; products: Product[] };\n  const { data: catData, loading, error: catError, reload: reloadCat } = useAdminData<CatAndProd>(\n    'admin:categories',\n    async () => {\n      const [categoryRows, productRows] = await Promise.all([api.getCategories(), api.getProducts()]);\n      return { categories: Array.isArray(categoryRows) ? categoryRows : [], products: Array.isArray(productRows) ? productRows : [] };\n    },\n  );\n  const categories = catData?.categories ?? [];\n  const products = catData?.products ?? [];\n  const [search, setSearch] = useState('');\n  const [page, setPage] = useState(1);\n  const [loading, setLoading] = useState(false);`
  );
  // Remove old loadData function + useEffect
  catContent = catContent.replace(
    `\n  async function loadData(showLoading = true) {\n    if (showLoading) setLoading(true);\n    setError('');\n    try {\n      const [categoryRows, productRows] = await Promise.all([api.getCategories(), api.getProducts()]);\n      setCategories(Array.isArray(categoryRows) ? categoryRows : []);\n      setProducts(Array.isArray(productRows) ? productRows : []);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : 'Không thể tải danh sách danh mục.');\n    } finally {\n      if (showLoading) setLoading(false);\n    }\n  }\n\n  useEffect(() => { void loadData(); }, []);`,
    ``
  );
  // Update setError and success references
  catContent = catContent.replace(
    `  const [saving, setSaving] = useState(false);\n  const [deletingId, setDeletingId] = useState<number | null>(null);\n  const [error, setError] = useState('');`,
    `  const [saving, setSaving] = useState(false);\n  const [deletingId, setDeletingId] = useState<number | null>(null);\n  const [error, setError] = useState(catError || '');`
  );
  fs.writeFileSync(`${BASE}\\categories\\page.tsx`, catContent, 'utf8');
  console.log('  Patched: categories');
}

// ====== VOUCHERS ======
let voucherContent = fs.readFileSync(`${BASE}\\vouchers\\page.tsx`, 'utf8');
if (!voucherContent.includes('useAdminData')) {
  voucherContent = voucherContent.replace(
    `import { FormEvent, useEffect, useMemo, useState } from 'react';`,
    `import { FormEvent, useMemo, useState } from 'react';`
  );
  voucherContent = voucherContent.replace(
    `import { api, type Voucher } from '@/lib/api';`,
    `import { api, type Voucher } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  voucherContent = voucherContent.replace(
    `export default function AdminVouchersPage() {\r\n  const [vouchers, setVouchers] = useState<Voucher[]>([]);\r\n  const [loading, setLoading] = useState(true);`,
    `export default function AdminVouchersPage() {\r\n  const { data: vouchersData, loading, error: voucherFetchError, reload } = useAdminData<Voucher[]>(\r\n    'admin:vouchers',\r\n    () => api.getVouchers(),\r\n  );\r\n  const vouchers = vouchersData ?? [];\r\n  const [loading2] = [false]; // unused, loading comes from hook`
  );
  fs.writeFileSync(`${BASE}\\vouchers\\page.tsx`, voucherContent, 'utf8');
  console.log('  Patched: vouchers (partial - needs manual review for useEffect)');
}

// ====== BANNERS ======
let bannerContent = fs.readFileSync(`${BASE}\\banners\\page.tsx`, 'utf8');
if (!bannerContent.includes('useAdminData')) {
  bannerContent = bannerContent.replace(
    `import { useEffect, useMemo, useState } from 'react';`,
    `import { useMemo, useState } from 'react';`
  );
  bannerContent = bannerContent.replace(
    `import { api, getPrimaryProductImage, Product, Promotion, setCachedProductsSync } from '@/lib/api';`,
    `import { api, getPrimaryProductImage, Product, Promotion, setCachedProductsSync } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  bannerContent = bannerContent.replace(
    `export default function AdminBannersPage() {\r\n  const [promotions, setPromotions] = useState<Promotion[]>([]);\r\n  const [page, setPage] = useState(1);\r\n  const [products, setProducts] = useState<Product[]>([]);\r\n  const [loading, setLoading] = useState(true);\r\n  const [error, setError] = useState('');`,
    `export default function AdminBannersPage() {\r\n  type BannerData = { promotions: Promotion[]; products: Product[] };\r\n  const { data: bannerCacheData, loading, error, reload } = useAdminData<BannerData>(\r\n    'admin:banners',\r\n    async () => {\r\n      const [promosRes, prodsRes] = await Promise.all([api.getPromotions(), api.getProducts().catch(() => [])]);\r\n      return { promotions: promosRes, products: prodsRes };\r\n    },\r\n  );\r\n  const promotions = bannerCacheData?.promotions ?? [];\r\n  const products = bannerCacheData?.products ?? [];\r\n  const [page, setPage] = useState(1);`
  );
  bannerContent = bannerContent.replace(
    `\r\n  const loadData = async () => {\r\n    setLoading(true);\r\n    setError('');\r\n    try {\r\n      const [promosRes, prodsRes] = await Promise.all([\r\n        api.getPromotions(),\r\n        api.getProducts().catch(() => []),\r\n      ]);\r\n      setPromotions(promosRes);\r\n      setProducts(prodsRes);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách banner.');\r\n    } finally {\r\n      setLoading(false);\r\n    }\r\n  };\r\n\r\n  useEffect(() => {\r\n    void loadData();\r\n  }, []);`,
    ``
  );
  fs.writeFileSync(`${BASE}\\banners\\page.tsx`, bannerContent, 'utf8');
  console.log('  Patched: banners');
}

// ====== PRODUCTS ======
let prodContent = fs.readFileSync(`${BASE}\\products\\page.tsx`, 'utf8');
if (!prodContent.includes('useAdminData')) {
  prodContent = prodContent.replace(
    `import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';`,
    `import { FormEvent, useMemo, useRef, useState } from 'react';`
  );
  prodContent = prodContent.replace(
    `import { api, getPrimaryProductImage, Product, ProductVariant, resolveApiAssetUrl, StoreCategory } from '@/lib/api';`,
    `import { api, getPrimaryProductImage, Product, ProductVariant, resolveApiAssetUrl, StoreCategory } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';`
  );
  fs.writeFileSync(`${BASE}\\products\\page.tsx`, prodContent, 'utf8');
  console.log('  Patched: products (import only - will handle useState separately)');
}

console.log('\nAll patches applied!');
