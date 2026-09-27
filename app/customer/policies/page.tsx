import Link from "next/link";

const policies = [
  ["Điều khoản sử dụng", "Bằng việc truy cập và mua hàng tại MANB Shop, quý khách đồng ý tuân thủ các quy định về thanh toán, đặt hàng và bảo mật của hệ thống. Nội dung điều khoản có thể được cập nhật để phù hợp với hoạt động và quy định hiện hành."],
  ["Chính sách bảo mật", "Thông tin cá nhân như họ tên, số điện thoại và địa chỉ được sử dụng để xử lý đơn hàng và hỗ trợ khách hàng. MANB Shop không sử dụng dữ liệu người dùng cho mục đích thương mại ngoài phạm vi dịch vụ."],
  ["Đổi trả và hoàn tiền", "Hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc hư hỏng do vận chuyển. Sản phẩm cần còn nguyên tem mác và chưa qua sử dụng. Vui lòng liên hệ hỗ trợ để được hướng dẫn."],
  ["Vận chuyển", "Thời gian giao hàng dự kiến từ 2–5 ngày làm việc tùy khu vực. Phí vận chuyển và thông tin giao nhận sẽ được hiển thị khi đặt hàng."],
];

export default function PoliciesPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-3xl">
    <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Thông tin hỗ trợ</p><h1 className="mt-1 text-3xl font-black">Chính sách & điều khoản</h1><div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">MANB Shop cam kết bảo vệ quyền lợi và thông tin người dùng trong quá trình mua sắm.</div>
    <div className="mt-5 space-y-4">{policies.map(([title, content], index) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{index + 1}. {title}</h2><p className="mt-3 leading-7 text-slate-600">{content}</p></section>)}</div>
    <p className="mt-4 text-xs text-slate-500">Nội dung chính sách cần được cửa hàng rà soát và xác nhận trước khi áp dụng chính thức.</p>
    <div className="mt-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
      >
        <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Quay lại</span>
      </Link>
    </div>
  </div></main>;
}
