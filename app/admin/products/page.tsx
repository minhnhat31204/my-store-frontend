'use client';
import { useEffect, useState } from 'react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products') //
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
    setProducts(products.filter((item: any) => item.ProductID !== id));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Quản Lý Sản Phẩm (Admin)</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium">
          + Thêm sản phẩm
        </button>
      </div>

      <table className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <thead className="bg-slate-100 text-left text-sm font-semibold text-slate-600">
          <tr>
            <th className="p-3">ID</th>
            <th className="p-3">Tên sản phẩm</th>
            <th className="p-3">Giá</th>
            <th className="p-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {products.map((item: any) => (
            <tr key={item.ProductID}>
              <td className="p-3">{item.ProductID}</td>
              <td className="p-3 font-medium">{item.ProductName}</td>
              <td className="p-3">{item.Price?.toLocaleString()} VNĐ</td>
              <td className="p-3 text-right space-x-2">
                <button className="text-blue-600 hover:underline">Sửa</button>
                <button onClick={() => handleDelete(item.ProductID)} className="text-red-600 hover:underline">Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}