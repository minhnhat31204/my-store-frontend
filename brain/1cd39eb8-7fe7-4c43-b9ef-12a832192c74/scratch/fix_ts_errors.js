const fs = require('fs');

const BASE = 'D:\\my-store-frontend\\app\\admin';

// ============================
// FIX ORDERS
// ============================
let orders = fs.readFileSync(`${BASE}\\orders\\page.tsx`, 'utf8');

// Replace setOrders(current => ...) with void reload(true)
// Line 131 and 152 pattern
orders = orders.replace(
  /setOrders\(\(current\)[\s\S]*?\)\);\r?\n/g,
  'void reload(true);\r\n'
);
// Also replace setOrders(...) with void reload(true)
orders = orders.replace(/setOrders\([^)]+\);\r?\n/g, 'void reload(true);\r\n');

fs.writeFileSync(`${BASE}\\orders\\page.tsx`, orders, 'utf8');
console.log('Fixed: orders');

// ============================
// FIX BANNERS
// ============================
let banners = fs.readFileSync(`${BASE}\\banners\\page.tsx`, 'utf8');

// Fix setProducts( calls -> void reload(true)
banners = banners.replace(
  /setProducts\([^;]+;/g,
  'void reload(true);'
);

// Fix loadData() references -> reload(true)
banners = banners.split('loadData()').join('reload(true)');
banners = banners.split('void loadData();').join('void reload(true);');
banners = banners.split('await loadData();').join('await reload(true);');

fs.writeFileSync(`${BASE}\\banners\\page.tsx`, banners, 'utf8');
console.log('Fixed: banners');

// ============================
// FIX CATEGORIES
// ============================
let cats = fs.readFileSync(`${BASE}\\categories\\page.tsx`, 'utf8');

// Remove duplicate loading declaration (the old one introduced by the patch)
// The hook provides loading; the old const [loading, setLoading] = useState(false) is duplicate
cats = cats.replace(
  `  const [loading, setLoading] = useState(false);\n`,
  ``
);
cats = cats.replace(
  `  const [loading, setLoading] = useState(false);\r\n`,
  ``
);

// Fix setCategories( calls -> void reload(true)
cats = cats.replace(
  /setCategories\([\s\S]*?\)\);\r?\n/g,
  'void reload(true);\r\n'
);
cats = cats.replace(/setCategories\([^;]+;\r?\n/g, 'void reload(true);\r\n');

// Fix loadData() references
cats = cats.split('loadData()').join('reloadCat(true)');
cats = cats.split('void loadData();').join('void reloadCat(true);');
cats = cats.split('await loadData();').join('await reloadCat(true);');
cats = cats.split('loadData(false)').join('reloadCat(false)');

// Remove the old error state (keep only one)
cats = cats.replace(
  `  const [error, setError] = useState(catError || '');\n`,
  `  const [error, setError] = useState('');\n`
);
cats = cats.replace(
  `  const [error, setError] = useState(catError || '');\r\n`,
  `  const [error, setError] = useState('');\r\n`
);

fs.writeFileSync(`${BASE}\\categories\\page.tsx`, cats, 'utf8');
console.log('Fixed: categories');

// ============================
// FIX REVIEWS
// ============================
let reviews = fs.readFileSync(`${BASE}\\reviews\\page.tsx`, 'utf8');

// Fix the useRef import from require('react')
reviews = reviews.replace(
  `const prevReviewsRef = require('react').useRef<ProductReview[]>([]);`,
  `// auto-sync replies when reviews data changes`
);

// Fix the pattern that sets replies when reviews arrive
// The issue is we used require('react').useRef - replace with a simpler useEffect
// First remove the broken if block that sets replies
reviews = reviews.replace(
  `  // auto-sync replies when reviews data changes\n  if (prevReviewsRef.current !== reviews && reviews.length > 0) {\n    prevReviewsRef.current = reviews;\n    setReplies(Object.fromEntries(reviews.map((review) => [review.ReviewID, review.AdminReply || ''])));\n  }`,
  ``
);

// Add useMemo import if needed
if (!reviews.includes('useEffect')) {
  reviews = reviews.replace(
    `import { useMemo, useState } from 'react';`,
    `import { useEffect, useMemo, useState } from 'react';`
  );
}

// Add a useEffect to sync replies when reviews loads
const reviewsCompStart = `export default function AdminReviewsPage() {`;
const syncEffect = `
  // Sync replies state when reviews data changes (from cache or fetch)
  useEffect(() => {
    if (reviews.length > 0) {
      setReplies(Object.fromEntries(reviews.map((review) => [review.ReviewID, review.AdminReply || ''])));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewsData]);

`;

// Insert the useEffect after the state declarations
// Find the location after replies useState
reviews = reviews.replace(
  `  const [savingId, setSavingId] = useState<number | null>(null);\n  const [feedback, setFeedback] = useState<Record<number, string>>({});`,
  `  const [savingId, setSavingId] = useState<number | null>(null);\n  const [feedback, setFeedback] = useState<Record<number, string>>({});\n${syncEffect}`
);

// Fix setReviews calls -> void reloadReviews(true)
reviews = reviews.replace(
  /setReviews\([\s\S]*?\)\);\r?\n/g,
  'void reloadReviews(true);\r\n'
);
reviews = reviews.replace(/setReviews\([^;]+;\r?\n/g, 'void reloadReviews(true);\r\n');

// Fix loadReviews references
reviews = reviews.split('loadReviews()').join('reloadReviews(true)');
reviews = reviews.split('void loadReviews();').join('void reloadReviews(true);');
reviews = reviews.split('await loadReviews();').join('await reloadReviews(true);');

fs.writeFileSync(`${BASE}\\reviews\\page.tsx`, reviews, 'utf8');
console.log('Fixed: reviews');

// ============================
// FIX REFUNDS
// ============================
let refunds = fs.readFileSync(`${BASE}\\refunds\\page.tsx`, 'utf8');

// Fix any remaining loadRequests references
refunds = refunds.split('loadRequests()').join('reload(true)');
refunds = refunds.split('void loadRequests();').join('void reload(true);');
refunds = refunds.split('await loadRequests();').join('await reload(true);');

fs.writeFileSync(`${BASE}\\refunds\\page.tsx`, refunds, 'utf8');
console.log('Fixed: refunds');

// ============================
// FIX VOUCHERS
// ============================
let vouchers = fs.readFileSync(`${BASE}\\vouchers\\page.tsx`, 'utf8');

// Fix setVouchers calls -> void reload(true)
vouchers = vouchers.replace(
  /setVouchers\([\s\S]*?\)\);\r?\n/g,
  'void reload(true);\r\n'
);
vouchers = vouchers.replace(/setVouchers\([^;]+;\r?\n/g, 'void reload(true);\r\n');
// Multi-line setVouchers with prev =>
vouchers = vouchers.replace(
  /setVouchers\(\(prev\) => \{[\s\S]*?\}\);\r?\n/g,
  'void reload(true);\r\n'
);

// Fix loadVouchers references
vouchers = vouchers.split('loadVouchers()').join('reload(true)');
vouchers = vouchers.split('void loadVouchers();').join('void reload(true);');
vouchers = vouchers.split('await loadVouchers();').join('await reload(true);');

// Remove old setLoading / setError in loadVouchers context (already removed the function)
// Fix voucherFetchError - use it to initialize error state
vouchers = vouchers.replace(
  `  const [error, setError] = useState('');`,
  `  const [error, setError] = useState(voucherFetchError || '');`
);

fs.writeFileSync(`${BASE}\\vouchers\\page.tsx`, vouchers, 'utf8');
console.log('Fixed: vouchers');

// ============================
// FIX PRODUCTS
// ============================
let products = fs.readFileSync(`${BASE}\\products\\page.tsx`, 'utf8');

// Fix remaining void reload(true); // was: setProducts(...) lines
// The current // was: setProducts(... lines may span multiple lines
// Replace the pattern "void reload(true); // was: setProducts(..." with just "void reload(true);"
products = products.replace(/void reload\(true\); \/\/ was: setProducts\([^\n]*/g, 'void reload(true);');
products = products.replace(/void reload\(true\); \/\/ was: setCategories\([^\n]*/g, 'void reload(true);');

// Fix the (current) implicit any issue in products
// Line 492: setCategories((current) => [...current, item]) - already replaced to reload
// Check if there are remaining setProducts calls
const remainingSetProducts = (products.match(/setProducts\(/g) || []).length;
const remainingSetCategories = (products.match(/setCategories\(/g) || []).length;
console.log(`Products remaining setProducts: ${remainingSetProducts}, setCategories: ${remainingSetCategories}`);

fs.writeFileSync(`${BASE}\\products\\page.tsx`, products, 'utf8');
console.log('Fixed: products cleanup');

console.log('\nAll fixes done! Running TSC next...');
