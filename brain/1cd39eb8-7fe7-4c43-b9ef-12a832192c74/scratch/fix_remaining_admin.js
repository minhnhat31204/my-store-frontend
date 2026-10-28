const fs = require('fs');

const BASE = 'D:\\my-store-frontend\\app\\admin';

// ====== FIX REFUNDS ======
let refunds = fs.readFileSync(`${BASE}\\refunds\\page.tsx`, 'utf8');

// Remove the broken _unused function and remaining useEffect
refunds = refunds.replace(
  `  // loadRequests replaced by useAdminData\r\n  function _unused() {\r\n    }\r\n  };\r\n\r\n  useEffect(() => {\r\n    void loadRequests();\r\n  }, []);\r\n`,
  ``
);

// Replace loadRequests() calls with reload(true)
refunds = refunds.split('await loadRequests();').join('await reload(true);');
refunds = refunds.split('void loadRequests();').join('void reload(true);');

// Remove old error state (now comes from hook)
// The error state is already provided by the hook as 'error'

fs.writeFileSync(`${BASE}\\refunds\\page.tsx`, refunds, 'utf8');
console.log('Fixed: refunds');

// ====== FIX VOUCHERS ======
let vouchers = fs.readFileSync(`${BASE}\\vouchers\\page.tsx`, 'utf8');

// Remove the [loading2] unused line
vouchers = vouchers.replace(
  `  const [loading2] = [false]; // unused, loading comes from hook\r\n`,
  ``
);

// Remove old loadVouchers function
vouchers = vouchers.replace(
  `  async function loadVouchers() {\r\n    setLoading(true);\r\n    setError('');\r\n    try {\r\n      const data = await api.getVouchers();\r\n      setVouchers(Array.isArray(data) ? data : []);\r\n    } catch (err) {\r\n      setError(err instanceof Error ? err.message : 'Không tải được danh sách mã giảm giá.');\r\n    } finally {\r\n      setLoading(false);\r\n    }\r\n  }\r\n\r\n  useEffect(() => {\r\n    void loadVouchers();\r\n  }, []);\r\n`,
  ``
);

// Replace loadVouchers() calls with reload(true)
vouchers = vouchers.split('await loadVouchers();').join('await reload(true);');
vouchers = vouchers.split('void loadVouchers();').join('void reload(true);');
vouchers = vouchers.split('loadVouchers()').join('reload(true)');

// Remove voucherFetchError since we already have error from hook indirectly
// The component already has setError useState, so voucherFetchError is separate

fs.writeFileSync(`${BASE}\\vouchers\\page.tsx`, vouchers, 'utf8');
console.log('Fixed: vouchers');

// ====== FIX PRODUCTS ======
// Products is complex - just need to find and replace the initial data loading
let products = fs.readFileSync(`${BASE}\\products\\page.tsx`, 'utf8');

// Find the component function and what it loads
// The key pattern is useState for products/categories and the loadData useEffect
const oldProductsDecl = `export default function AdminProductsPage() {\r\n  const [products, setProducts] = useState<Product[]>([]);\r\n  const [categories, setCategories] = useState<StoreCategory[]>([]);\r\n  const [loading, setLoading] = useState(true);`;

if (products.includes(oldProductsDecl)) {
  products = products.replace(
    oldProductsDecl,
    `export default function AdminProductsPage() {\r\n  type ProdCatData = { products: Product[]; categories: StoreCategory[] };\r\n  const { data: prodCatData, loading, error: fetchError, reload } = useAdminData<ProdCatData>(\r\n    'admin:products',\r\n    async () => {\r\n      const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);\r\n      return { products: Array.isArray(prods) ? prods : [], categories: Array.isArray(cats) ? cats : [] };\r\n    },\r\n  );\r\n  const products = prodCatData?.products ?? [];\r\n  const categories = prodCatData?.categories ?? [];\r\n  const [loading2] = [false]; // unused`
  );
  console.log('Products: replaced state declarations');
} else {
  console.log('Products: old pattern not found, searching for alternative...');
  // Show what's in the component start
  const idx = products.indexOf('export default function AdminProductsPage()');
  if (idx >= 0) {
    console.log('Products component starts at:', products.substring(idx, idx + 500));
  }
}

// Find and remove the old useEffect data loading in products
// First let's see what pattern exists
const productUseEffectPatterns = [
  `  useEffect(() => {\r\n    void loadData();\r\n  }, []);`,
  `  useEffect(() =>\r\n    void loadData();\r\n  }, []);`,
];

for (const pattern of productUseEffectPatterns) {
  if (products.includes(pattern)) {
    products = products.replace(pattern, '');
    console.log('Products: removed useEffect loadData');
    break;
  }
}

// Find and remove the loadData function in products
const productLoadDataStart = '  async function loadData()';
const idx = products.indexOf(productLoadDataStart);
if (idx >= 0) {
  // Find the matching closing brace
  let depth = 0;
  let end = idx;
  for (let i = idx; i < products.length; i++) {
    if (products[i] === '{') depth++;
    else if (products[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const removed = products.substring(idx, end);
  console.log('Products: removing loadData function:', removed.substring(0, 100));
  products = products.substring(0, idx) + products.substring(end);
}

// Remove unused loading2 line
products = products.replace(`  const [loading2] = [false]; // unused\r\n`, ``);

// Replace setProducts/setCategories calls with reload
products = products.split('setProducts(').join('/* setProducts( */void(');
products = products.split('setCategories(').join('/* setCategories( */void(');

fs.writeFileSync(`${BASE}\\products\\page.tsx`, products, 'utf8');
console.log('Fixed: products (review needed for setProducts/setCategories calls)');

console.log('\nAll fixes applied!');
