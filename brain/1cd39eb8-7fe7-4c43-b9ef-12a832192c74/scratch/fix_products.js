const fs = require('fs');

const filePath = 'D:\\my-store-frontend\\app\\admin\\products\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the useState declarations
content = content.replace(
  `export default function AdminProducts() {\r\n  const [products, setProducts] = useState<Product[]>([]);\r\n  const [categories, setCategories] = useState<StoreCategory[]>([]);\r\n  const [form, setForm] = useState(emptyForm);\r\n  const [specsList, setSpecsList] = useState<SpecItem[]>([]);\r\n  const [variantsList, setVariantsList] = useState<VariantItem[]>([]);\r\n  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);\r\n  const [editingId, setEditingId] = useState<number | null>(null);\r\n  const [open, setOpen] = useState(false);\r\n  const [loading, setLoading] = useState(true);`,
  `export default function AdminProducts() {\r\n  type ProdCatData = { products: Product[]; categories: StoreCategory[] };\r\n  const { data: prodCatData, loading, error: fetchError, reload } = useAdminData<ProdCatData>(\r\n    'admin:products',\r\n    async () => {\r\n      const [prods, cats] = await Promise.all([api.getProducts(), api.getCategories()]);\r\n      return { products: Array.isArray(prods) ? prods : [], categories: Array.isArray(cats) ? cats : [] };\r\n    },\r\n  );\r\n  const products = prodCatData?.products ?? [];\r\n  const categories = prodCatData?.categories ?? [];\r\n  const [form, setForm] = useState(emptyForm);\r\n  const [specsList, setSpecsList] = useState<SpecItem[]>([]);\r\n  const [variantsList, setVariantsList] = useState<VariantItem[]>([]);\r\n  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);\r\n  const [editingId, setEditingId] = useState<number | null>(null);\r\n  const [open, setOpen] = useState(false);`
);

// 2. Remove old load() function + useEffect
content = content.replace(
  `  async function load() {\r\n    setLoading(true);\r\n    setError('');\r\n    try {\r\n      const data = await api.getProducts();\r\n      /* setProducts( */void(Array.isArray(data) ? data : []);\r\n    } catch (e) {\r\n      setError(e instanceof Error ? e.message : 'Không tải được danh sách sản phẩm');\r\n    } finally {\r\n      setLoading(false);\r\n    }\r\n  }\r\n\r\n  useEffect(() => {\r\n    void load();\r\n    api.getCategories().then((data) => /* setCategories( */void(Array.isArray(data) ? data : [])).catch(() => /* setCategories( */void([]));\r\n  }, []);\r\n`,
  ``
);

// 3. Now fix places where setProducts/setCategories are called (for mutations after save/delete)
// These need to call reload(true) instead
// First restore any broken setProducts calls (from the /* setProducts( */void( replacement)
content = content.split('/* setProducts( */void(').join('_unused_(');
content = content.split('/* setCategories( */void(').join('_unused2_(');

// 4. Find all setProducts( calls and replace with reload
// Common patterns after create/edit/delete:
const setProductsPatterns = [
  [`setProducts((prev) => [...prev, data]);`, `void reload(true);`],
  [`setProducts((prev) => prev.filter((p) => p.ProductID !== id));`, `void reload(true);`],
  [`setProducts((prev) => prev.map((p) => (p.ProductID === data.ProductID ? data : p)));`, `void reload(true);`],
  [`setProducts((prev) => [...prev, newProduct]);`, `void reload(true);`],
  [`setProducts((prev) => prev.filter((p) => p.ProductID !== deletingId));`, `void reload(true);`],
];

// More general approach: find all setProducts and setCategories standalone calls
// and replace with void reload(true)
// Let's use a regex-like replacement
let lines = content.split('\n');
lines = lines.map(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('setProducts(') && !trimmed.includes('useState')) {
    const indent = line.match(/^(\s*)/)[1];
    return `${indent}void reload(true); // was: ${trimmed}`;
  }
  if (trimmed.startsWith('setCategories(') && !trimmed.includes('useState')) {
    const indent = line.match(/^(\s*)/)[1];
    return `${indent}void reload(true); // was: ${trimmed}`;
  }
  return line;
});
content = lines.join('\n');

// 5. Clean up any _unused_ placeholders
content = content.split('_unused_(').join('void(');
content = content.split('_unused2_(').join('void(');

// 6. Replace any remaining 'load()' call references  
content = content.split('void load();').join('void reload(true);');
content = content.split('await load();').join('await reload(true);');

// 7. Fix the error state - products page has setError useState separately
// Keep setError for form errors etc but fetchError covers load errors

fs.writeFileSync(filePath, content, 'utf8');
console.log('Products: fully patched');

// Verify
const result = fs.readFileSync(filePath, 'utf8');
console.log('Has useAdminData:', result.includes('useAdminData'));
console.log('Has old useState products:', result.includes("const [products, setProducts] = useState<Product[]>"));
console.log('Has old useEffect load:', result.includes('void load();'));
console.log('Has async function load():', result.includes('async function load()'));
