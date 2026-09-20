'use client';
import { useEffect, useState } from 'react';

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products') //
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Sản Phẩm Nổi Bật</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((item: any) => (
          <div key={item.ProductID} className="border p-4 rounded-xl shadow-sm hover:shadow-md transition">
            <img src={item.ImageUrl} alt={item.ProductName} className="w-full h-48 object-cover rounded-lg mb-3" />
            <h2 className="font-bold text-lg">{item.ProductName}</h2>
            <p className="text-red-600 font-semibold">{item.Price?.toLocaleString()} VNĐ</p>
            <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Thêm vào giỏ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}