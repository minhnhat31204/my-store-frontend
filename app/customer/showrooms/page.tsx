import Link from "next/link";

const showrooms = [
  { name: "Showroom TP. Hồ Chí Minh", address: "Số 1 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh", phone: "1900 1234", region: "TP. Hồ Chí Minh" },
  { name: "Showroom Hà Nội", address: "Số 10 Lý Thái Tổ, Hoàn Kiếm, Hà Nội", phone: "1900 5678", region: "Hà Nội" },
  { name: "Showroom Đà Nẵng", address: "230 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng", phone: "1900 9012", region: "Đà Nẵng" },
  { name: "Showroom Cần Thơ", address: "Số 50 Đường 30 Tháng 4, Ninh Kiều, Cần Thơ", phone: "1900 3456", region: "Cần Thơ" },
];

export default function ShowroomsPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-5xl">
    <p className="text-sm font-bold uppercase tracking-wide text-blue-700">MANB Shop</p><h1 className="mt-1 text-3xl font-black">Hệ thống showroom</h1><p className="mt-2 text-slate-600">Tìm showroom và mở chỉ đường trên Google Maps.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{showrooms.map((item) => <article key={item.region} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{item.region}</span><h2 className="mt-4 text-xl font-black">{item.name}</h2><p className="mt-3 text-sm text-slate-600">{item.address}</p><a className="mt-2 inline-block text-sm font-semibold text-blue-700" href={`tel:${item.phone.replace(/\s/g, "")}`}>Hotline: {item.phone}</a><a className="mt-5 block rounded-xl bg-blue-700 px-4 py-3 text-center font-bold text-white" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}>Mở bản đồ ↗</a></article>)}</div>
    <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Thông tin showroom hiện dùng cùng danh sách mẫu trong ứng dụng; vui lòng xác nhận địa chỉ và hotline trước khi công khai.</p><Link href="/" className="mt-5 inline-block font-semibold text-blue-700">← Về trang chủ</Link>
  </div></main>;
}
