const fs = require('fs');

// Orders page
let content = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', 'utf8');

// Add import
content = content.replace(
  `import Pagination from '@/app/admin/components/Pagination';`,
  `import Pagination from '@/app/admin/components/Pagination';\nimport { useAdminData } from '@/lib/useAdminData';`
);

// Replace the useState for orders and the useEffect fetch
const oldOrdersFetch = `export default function AdminOrders() {\r\n  const [orders, setOrders] = useState<StoreOrder[]>([]);\r\n  const [loading, setLoading] = useState(true);\r\n  const [error, setError] = useState('');\r\n  const [selected, setSelected] = useState<StoreOrder | null>(null);\r\n  const [draftStatus, setDraftStatus] = useState('Pending');\r\n  const [cancellationReason, setCancellationReason] = useState('');\r\n  const [saving, setSaving] = useState(false);\r\n  const [feedback, setFeedback] = useState('');\r\n  const [search, setSearch] = useState('');\r\n  const [page, setPage] = useState(1);\r\n  const [statusFilter, setStatusFilter] = useState('all');\r\n  const [monthFilter, setMonthFilter] = useState('');\r\n  const [statusHistory, setStatusHistory] = useState<Awaited<ReturnType<typeof api.getOrderStatusHistory>>>([]);\r\n  const [carrierName, setCarrierName] = useState('');\r\n  const [trackingNumber, setTrackingNumber] = useState('');\r\n  const [estimatedDelivery, setEstimatedDelivery] = useState('');\r\n\r\n  useEffect(() => {\r\n    api.getOrders()\r\n      .then((data) => setOrders(Array.isArray(data) ? data : []))\r\n      .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng'))\r\n      .finally(() => setLoading(false));\r\n  }, []);`;

const newOrdersFetch = `export default function AdminOrders() {\r\n  const { data: ordersData, loading, error, reload } = useAdminData<StoreOrder[]>(\r\n    'admin:orders',\r\n    () => api.getOrders(),\r\n  );\r\n  const orders = ordersData ?? [];\r\n  const [selected, setSelected] = useState<StoreOrder | null>(null);\r\n  const [draftStatus, setDraftStatus] = useState('Pending');\r\n  const [cancellationReason, setCancellationReason] = useState('');\r\n  const [saving, setSaving] = useState(false);\r\n  const [feedback, setFeedback] = useState('');\r\n  const [search, setSearch] = useState('');\r\n  const [page, setPage] = useState(1);\r\n  const [statusFilter, setStatusFilter] = useState('all');\r\n  const [monthFilter, setMonthFilter] = useState('');\r\n  const [statusHistory, setStatusHistory] = useState<Awaited<ReturnType<typeof api.getOrderStatusHistory>>>([]);\r\n  const [carrierName, setCarrierName] = useState('');\r\n  const [trackingNumber, setTrackingNumber] = useState('');\r\n  const [estimatedDelivery, setEstimatedDelivery] = useState('');`;

if (content.includes(oldOrdersFetch)) {
  content = content.replace(oldOrdersFetch, newOrdersFetch);
  console.log('Orders: replaced useState/useEffect fetch');
} else {
  console.log('Orders: pattern not found, trying partial match...');
  // Try to just remove the useEffect block
  const oldUseEffect = `  useEffect(() => {\r\n    api.getOrders()\r\n      .then((data) => setOrders(Array.isArray(data) ? data : []))\r\n      .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng'))\r\n      .finally(() => setLoading(false));\r\n  }, []);`;
  if (content.includes(oldUseEffect)) {
    content = content.replace(oldUseEffect, '');
    // Replace useState declarations
    content = content.replace(
      `  const [orders, setOrders] = useState<StoreOrder[]>([]);\r\n  const [loading, setLoading] = useState(true);\r\n  const [error, setError] = useState('');`,
      `  const { data: ordersData, loading, error, reload } = useAdminData<StoreOrder[]>(\r\n    'admin:orders',\r\n    () => api.getOrders(),\r\n  );\r\n  const orders = ordersData ?? [];`
    );
    console.log('Orders: replaced with partial match');
  } else {
    console.log('Orders: could not find pattern');
  }
}

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', content, 'utf8');
console.log('Orders: done');
