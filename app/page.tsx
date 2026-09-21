'use client';
import { useEffect, useState } from 'react';
import { api, Product } from '@/lib/api';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.getProducts().then(setProducts).catch(e => setError(e instanceof Error ? e.message : 'Không tải được sản phẩm')).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen p-8 text-slate-800"><h1 className="mb-4 text-2xl font-bold">Danh sách sản phẩm từ API</h1>{loading && <p>Đang tải...</p>}{error && <p className="rounded bg-red-100 p-3 text-red-700">{error}</p>}{!loading && !error && <pre className="overflow-auto rounded bg-slate-100 p-4">{JSON.stringify(products, null, 2)}</pre>}</main>;
}
