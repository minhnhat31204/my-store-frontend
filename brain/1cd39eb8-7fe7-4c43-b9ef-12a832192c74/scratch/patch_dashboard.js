const fs = require('fs');

const path = 'D:\\my-store-frontend\\app\\admin\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useAdminData import
content = content.replace(
  "import { api, type Product, type StoreOrder } from '@/lib/api';",
  "import { api, type Product, type StoreOrder, type User } from '@/lib/api';\nimport { useAdminData } from '@/lib/useAdminData';"
);

// 2. Replace state and useEffect loading
const oldBlock = `  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.getProducts().then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setProductCount(rows.length);
        setProducts(rows);
      }),
      api.getOrders().then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      }),
      api.getUsers().then((data) => {
        setUserCount(Array.isArray(data) ? data.length : 0);
      }),
    ]).finally(() => setLoading(false));
  }, []);`;

const newBlock = `  type DashboardData = { products: Product[]; orders: StoreOrder[]; users: User[] };
  const { data: dashboardData, loading, reload } = useAdminData<DashboardData>(
    'admin:dashboard',
    async () => {
      const [prods, ords, usrs] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getOrders().catch(() => []),
        api.getUsers().catch(() => []),
      ]);
      return {
        products: Array.isArray(prods) ? prods : [],
        orders: Array.isArray(ords) ? ords : [],
        users: Array.isArray(usrs) ? usrs : [],
      };
    }
  );

  const products = dashboardData?.products ?? [];
  const orders = dashboardData?.orders ?? [];
  const productCount = products.length;
  const userCount = dashboardData?.users?.length ?? 0;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);`;

content = content.replace(oldBlock.replace(/\r\n/g, '\n'), newBlock);
content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));

fs.writeFileSync(path, content, 'utf8');
console.log('Admin Dashboard patched with useAdminData!');
