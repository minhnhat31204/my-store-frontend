import Link from "next/link";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">MANB<span>.VN</span></div>
          <p>Thế giới công nghệ trong tầm tay bạn.</p>
        </div>
        <div>
          <h3>Hỗ trợ khách hàng</h3>
          <p><Link href="/customer/policies">Chính sách & điều khoản</Link></p>
          <p><Link href="/customer/showrooms">Hệ thống showroom</Link></p>
          <p><Link href="/customer/addresses">Sổ địa chỉ</Link></p>
          <p><Link href="/customer/vouchers">Mã giảm giá</Link></p>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <p>Email: support@manb.vn</p>
          <p>Hotline: 0909 680 426</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} MANB.VN. All rights reserved.</div>
    </footer>
  );
}
