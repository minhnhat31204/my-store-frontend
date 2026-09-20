'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Gọi API từ Backend Node.js đang chạy ở port 5000
    fetch('http://localhost:5000/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Lỗi gọi API:', err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Danh sách sản phẩm từ API</h1>
      <pre className="bg-slate-100 p-4 rounded text-black">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  );
}