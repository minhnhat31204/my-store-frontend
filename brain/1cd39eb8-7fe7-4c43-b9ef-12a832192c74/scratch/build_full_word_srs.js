const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} = require('docx');

const SRS_MARKDOWN = `# TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG
# KHOA CÔNG NGHỆ PHẦN MỀM - BỘ MÔN CÔNG NGHỆ PHẦN MỀM NÂNG CAO
# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)
# HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN MÁY TÍNH & LINH KIỆN CÔNG NGHỆ DEVORA
RESTful Backend API (Node.js/Express) + Web Khách hàng & Quản trị (Next.js) + Ứng dụng Di động (Flutter)

| Thuộc tính | Thông tin chi tiết |
| Tên dự án | DEVORA - Computer & Hardware E-Commerce Platform |
| Mã tài liệu | SRS-DEVORA-2026-v2.1 |
| Học phần | Công nghệ phần mềm nâng cao (Advanced Software Engineering) |
| Phiên bản | 2.1.0 (Bản chuẩn hóa thực tế & Nghiệm thu UAT) |
| Ngày phát hành | Năm học 2025 - 2026 |
| Trạng thái | Chính thức phê duyệt (Approved Baseline) |
| Cơ sở mã nguồn | computer-store-api (Backend) | my-store-frontend (Web) | manb_shop_mobile (Mobile) |

## LỊCH SỬ THAY ĐỔI VÀ PHÊ DUYỆT TÀI LIỆU

| Phiên bản | Ngày cập nhật | Tác giả | Mô tả tóm tắt nội dung thay đổi |
| 1.0.0 | 07/09/2026 | Nhóm phát triển DEVORA | Khởi tạo tài liệu đặc tả ban đầu, xác định phạm vi tổng quan hệ thống. |
| 1.2.0 | 14/09/2026 | Nhóm phát triển DEVORA | Đặc tả chi tiết kiến trúc 3 tầng, thiết kế cơ sở dữ liệu SQL Server với 17 bảng. |
| 1.5.0 | 21/09/2026 | Nhóm phát triển DEVORA | Bổ sung tích hợp cổng thanh toán trực tuyến PayOS (VietQR) và phân hệ quản lý Voucher giảm giá. |
| 1.8.0 | 05/10/2026 | Nhóm phát triển DEVORA | Bổ sung phương thức thanh toán nhận hàng (COD), hoàn thiện quy trình bảo mật OTP cho Đăng ký và Quên mật khẩu. |
| 2.0.0 | 19/10/2026 | Nhóm phát triển DEVORA | Hoàn thiện tài liệu SRS chuẩn IEEE/ISO toàn diện cho toàn bộ 3 phân hệ: Web Frontend, Mobile Flutter, Backend API. |
| 2.1.0 | 28/10/2026 | Nhóm phát triển DEVORA | Chuẩn hóa thực tế theo mã nguồn:<br>- Bổ sung tính năng In hóa đơn bán hàng A4 & Phiếu chi hoàn tiền.<br>- Bổ sung tính năng Xuất Excel chuyên nghiệp (.xlsx) đa trang tính trên toàn bộ 8 phân hệ Admin.<br>- Cập nhật vòng đời đơn hàng với trạng thái Returned (Đã trả hàng/Hoàn tiền).<br>- Bổ sung cơ chế Popup Modal xác nhận an toàn khi xóa dữ liệu.<br>- Bổ sung kiến trúc Cache bộ nhớ đệm Stale-While-Revalidate & Prefetching 0ms. |

## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN

### 1.1. Mục đích tài liệu
Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này mô tả toàn diện, chi tiết và có cấu trúc các yêu cầu chức năng (Functional Requirements), yêu cầu phi chức năng (Non-Functional Requirements), kiến trúc hệ thống, mô hình dữ liệu và các giao diện lập trình ứng dụng (API) của Hệ thống thương mại điện tử chuyên doanh máy tính và linh kiện công nghệ DEVORA (tên gọi thương mại: DEVORA Shop).

Tài liệu được biên soạn nhằm phục vụ các mục tiêu chiến lược sau:
- Thống nhất nhận thức: Cung cấp tài liệu cơ sở thống nhất (Baseline Specification) giữa các bên liên quan gồm Giảng viên hướng dẫn, Ban Quản trị dự án (PM), Chuyên viên phân tích nghiệp vụ (BA), Đội ngũ kỹ sư phát triển phần mềm (Developers) và Đội ngũ kiểm thử chất lượng (QA/QC).
- Cơ sở triển khai và kiểm thử: Làm căn cứ kỹ thuật để triển khai mã nguồn, kiểm thử nghiệm thu (UAT), đánh giá mức độ hoàn thiện các phân hệ Backend API, Web Khách hàng, Web Quản trị và Mobile App.
- Quản lý thay đổi và phát triển: Định hình kiến trúc module hóa vững chắc, tạo điều kiện thuận lợi cho việc bảo trì, mở rộng tính năng và nâng cấp công nghệ trong tương lai.

### 1.2. Phạm vi hệ thống (System Scope)
Hệ thống thương mại điện tử DEVORA là một hệ sinh thái bán lẻ công nghệ toàn diện, bao gồm ba nền tảng phần mềm hoạt động đồng bộ trên nền tảng điện toán đám mây và cơ sở dữ liệu tập trung:

| Thành phần phần mềm | Công nghệ chủ đạo | Nền tảng vận hành | Đối tượng người dùng phục vụ |
| Web Storefront (Khách hàng) | Next.js 16 (React 19), TypeScript, Tailwind CSS | Web Browser (Desktop & Mobile) | Khách hàng mua sắm trực tuyến vãng lai và thành viên |
| Web Admin Console (Quản trị) | Next.js 16, TypeScript, Tailwind CSS, Lucide Icons, SheetJS (xlsx) | Web Browser (Desktop) | Quản trị viên hệ thống (Admin), Quản lý bán hàng |
| Mobile Client (Khách hàng) | Flutter 3.x, Dart, Provider Architecture | Di động (Android) | Khách hàng mua sắm trên thiết bị thông minh |
| Backend RESTful API | Node.js, Express.js 5.x, Sequelize ORM 6.x | Server / Cloud Container | Cung cấp dịch vụ dữ liệu cho Web và Mobile |
| Hệ quản trị Cơ sở dữ liệu | Microsoft SQL Server (MSSQL 2019/2022) | Database Server | Lưu trữ dữ liệu nghiệp vụ tập trung, đảm bảo ACID |
| Dịch vụ tích hợp bên thứ ba | PayOS Gateway (VietQR), OpenStreetMap, Nodemailer | Cloud Services / Webhooks | Xử lý thanh toán số, giải mã tọa độ bản đồ, gửi OTP xác thực |

Hệ sinh thái DEVORA tập trung giải quyết trọn vẹn chu trình bán lẻ máy tính và phụ kiện:
- Trưng bày danh mục sản phẩm thông minh với cấu hình chi tiết (CPU, RAM, Ổ cứng, Card đồ họa, Màu sắc, Tần số quét).
- Hệ thống tìm kiếm tức thời và bộ lọc đa tiêu chí dành riêng cho linh kiện công nghệ.
- Giỏ hàng thời gian thực đồng bộ đám mây và danh sách sản phẩm yêu thích (Wishlist).
- Hệ thống khuyến mãi linh hoạt: Banner ưu đãi, mã giảm giá Voucher với công thức chiết khấu % và trần giảm tiền mặt.
- Quy trình đặt hàng và thanh toán kép hiện đại: Chuyển khoản QR ngân hàng tự động qua cổng PayOS (tự động khớp lệnh qua Webhook) và Thanh toán khi nhận hàng (COD).
- Sổ địa chỉ thông minh tích hợp bản đồ định vị GPS (OpenStreetMap / Leaflet) hỗ trợ chấm điểm tọa độ chính xác.
- Theo dõi tiến trình đơn hàng minh bạch qua chuỗi lịch sử trạng thái (Status Timeline).
- Cơ chế hoàn tiền (Refund Management) dành cho khách hàng hủy đơn hàng đã thanh toán: Tự động cập nhật trạng thái Returned (Đã trả hàng).
- Tính năng In ấn chứng từ doanh nghiệp: In Hóa đơn bán lẻ kiêm phiếu giao hàng (Invoice & Shipping Slip) chuẩn A4 và In Phiếu chi hoàn tiền / Biên nhận đối soát ngân hàng.
- Tính năng Xuất báo cáo Excel (.xlsx): Xuất báo cáo tài chính đa trang tính (Multi-sheet) cho doanh thu và xuất danh sách dữ liệu có tự động căn độ rộng cột trên toàn bộ 8 phân hệ quản trị.
- Trợ lý AI tự động phản hồi thắc mắc kỹ thuật kết hợp kênh trò chuyện trực tiếp (Live Chat) với tư vấn viên.
- Bàn điều khiển Quản trị viên (Admin Portal) với dashboard trực quan, báo cáo thống kê doanh thu và phân quyền người dùng.

### 1.3. Định nghĩa, thuật ngữ và từ viết tắt

| Thuật ngữ / Viết tắt | Tên tiếng Anh đầy đủ | Định nghĩa và ý nghĩa trong hệ thống DEVORA |
| SRS | Software Requirements Specification | Tài liệu đặc tả các yêu cầu kỹ thuật và nghiệp vụ của phần mềm. |
| API | Application Programming Interface | Giao diện lập trình ứng dụng cho phép Web/Mobile giao tiếp với máy chủ Backend. |
| REST | Representational State Transfer | Phong cách kiến trúc phần mềm cho các dịch vụ web phi trạng thái (Stateless). |
| JWT | JSON Web Token | Chuẩn token bảo mật nhỏ gọn dùng để xác thực quyền truy cập của người dùng. |
| ORM | Object-Relational Mapping | Kỹ thuật ánh xạ các bảng cơ sở dữ liệu quan hệ sang các đối tượng lập trình (Sequelize). |
| MSSQL | Microsoft SQL Server | Hệ quản trị cơ sở dữ liệu quan hệ được sử dụng để lưu trữ toàn bộ dữ liệu của DEVORA. |
| PayOS | Payment Open Solution | Cổng thanh toán điện tử hỗ trợ sinh mã VietQR động và xác thực giao dịch qua Webhook. |
| VietQR | Vietnam Quick Response | Chuẩn mã QR chuyển khoản liên ngân hàng quốc gia Việt Nam (NAPAS 247). |
| COD | Cash On Delivery | Phương thức thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận sản phẩm. |
| OTP | One-Time Password | Mật khẩu dùng một lần có thời hạn ngắn, gửi qua SMS hoặc Email nhằm xác thực danh tính. |

## CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG

### 2.1. Các tác nhân và vai trò người dùng (Actors & User Roles)

| Tác nhân (Actor) | Loại tác nhân | Mô tả quyền hạn và trách nhiệm trong hệ thống |
| Khách hàng vãng lai (Guest Customer) | Người dùng chưa định danh | Truy cập website hoặc ứng dụng di động; duyệt danh mục, tìm kiếm và lọc sản phẩm công nghệ; xem chi tiết cấu hình và đánh giá; quản lý giỏ hàng tạm thời; tương tác với Trợ lý AI để giải đáp thông số kỹ thuật. |
| Khách hàng thành viên (Registered Customer) | Người dùng đã xác thực (Role: Customer) | Sở hữu đầy đủ quyền của khách vãng lai, bổ sung: Đăng ký xác thực qua mã OTP; đăng nhập an toàn bằng JWT; quản lý hồ sơ cá nhân và sổ địa chỉ giao hàng tích hợp bản đồ GPS; lưu sản phẩm vào danh sách Yêu thích; áp dụng mã Voucher giảm giá; thực hiện đặt hàng và lựa chọn thanh toán PayOS VietQR hoặc COD; theo dõi dòng thời gian trạng thái đơn hàng (Timeline); yêu cầu hủy đơn và hoàn tiền; viết đánh giá sản phẩm sau mua; trò chuyện trực tuyến với CSKH. |
| Quản trị viên hệ thống (Administrator) | Người dùng đặc quyền (Role: Admin) | Toàn quyền quản trị hệ sinh thái: Theo dõi bảng điều khiển (Dashboard) doanh thu và đơn hàng; xuất báo cáo tài chính Excel đa trang tính; in hóa đơn bán hàng A4 và phiếu chi hoàn tiền; quản lý danh mục và sản phẩm (thêm, sửa, xóa với popup xác nhận, cấu hình biến thể CPU/RAM/VGA, quản lý tồn kho); quản lý chiến dịch khuyến mãi và mã Voucher; xử lý vòng đời đơn hàng với popup xác nhận khi giao thành công; kiểm tra và phê duyệt/từ chối yêu cầu hoàn tiền; quản lý phân quyền tài khoản người dùng; trực tiếp tư vấn khách hàng qua bàn làm việc Support Console. |
| Hệ thống tích hợp bên thứ ba (External Services) | Dịch vụ ngoại vi tự động | - Cổng thanh toán PayOS: Tiếp nhận thông tin thanh toán, sinh mã QR VietQR động theo tiêu chuẩn Napas247, phát tín hiệu Webhook tức thời khi khách hàng chuyển khoản thành công.<br>- Dịch vụ SMS/Email Gateway: Gửi mã OTP xác thực danh tính phục vụ đăng ký và lấy lại mật khẩu.<br>- OpenStreetMap / Nominatim API: Hỗ trợ tìm kiếm, định vị tọa độ kinh độ/vĩ độ (Lat/Lng) và giải mã địa chỉ nhận hàng. |

## CHƯƠNG 3: KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ

### 3.1. Mô hình kiến trúc 3 tầng (Three-Tier Architecture)
1. Tầng Trình diễn (Presentation Tier): Bao gồm hai ứng dụng độc lập: Web Application (phát triển bằng Next.js 16, React 19, TypeScript và Tailwind CSS, tích hợp bản đồ số Leaflet) và Mobile Application (phát triển bằng Flutter / Dart với kiến trúc quản lý trạng thái Provider). Tầng này chịu trách nhiệm hiển thị giao diện, điều hướng trải nghiệm người dùng, tiếp nhận thao tác và tương tác với máy chủ thông qua giao thức chuẩn HTTPS/REST.
2. Tầng Nghiệp vụ và Dịch vụ (Application / Business Logic Tier): Được triển khai trên nền tảng Node.js với Express.js 5.x. Tầng này chứa toàn bộ logic xử lý nghiệp vụ bán hàng, quản lý đơn hàng, tính toán giá trị voucher, quản lý giao dịch thanh toán PayOS, cơ chế xác thực JWT, điều phối thông báo và kết nối trung gian với cơ sở dữ liệu qua Sequelize ORM. Tích hợp module bộ nhớ đệm adminCache.ts hỗ trợ Stale-While-Revalidate và prefetching giúp chuyển trang admin trong 0ms.
3. Tầng Dữ liệu và Lưu trữ (Data Persistence Tier): Sử dụng hệ quản trị cơ sở dữ liệu quan hệ Microsoft SQL Server (MSSQL) để lưu trữ an toàn toàn bộ dữ liệu nghiệp vụ có cấu trúc (17 thực thể). Kết hợp cùng thư mục lưu trữ tệp cục bộ (Local Storage uploads/) để lưu trữ hình ảnh sản phẩm, ảnh đại diện người dùng và tệp đính kèm.

## CHƯƠNG 4: ĐẶC TẢ YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

### Bảng tóm tắt các yêu cầu chức năng (FR-01 đến FR-35):

| Mã FR | Tên chức năng | Phân hệ | Mức ưu tiên | Mô tả nghiệp vụ tóm tắt |
| FR-01 | Đăng nhập hệ thống | Auth | High | Đăng nhập SĐT/Mật khẩu, cấp JWT Token, phân quyền Admin/Customer. |
| FR-02 | Đăng ký tài khoản (Phone OTP) | Auth | High | Nút gửi OTP chỉ gửi mã; kiểm tra số điện thoại đã tồn tại khi ấn nút Đăng ký. |
| FR-03 | Quên mật khẩu (Nút Gửi OTP) | Auth | High | Giao diện có nút Gửi tường minh; đổi mật khẩu bằng OTP qua SĐT/Email. |
| FR-04 | Quản lý thông tin hồ sơ | User | Medium | Cập nhật họ tên, giới tính, ngày sinh, địa chỉ, ảnh đại diện avatar. |
| FR-05 | Đổi mật khẩu tài khoản | User | Medium | Đổi mật khẩu với kiểm tra mật khẩu hiện tại. |
| FR-06 | Xem danh mục sản phẩm | Catalog | High | Hiển thị danh mục máy tính, linh kiện dạng lưới và biểu tượng trực quan. |
| FR-07 | Tìm kiếm & Lọc nâng cao | Product | High | Lọc đa tiêu chí phần cứng: CPU, RAM, Ổ cứng, Giá, Tần số quét, Hãng. |
| FR-08 | Chi tiết sản phẩm & Biến thể | Product | High | Xem cấu hình chi tiết, thư viện ảnh và tùy chọn biến thể màu sắc/RAM. |
| FR-09 | Quản trị sản phẩm (Admin) | Product | High | Thêm, sửa, xóa sản phẩm có popup xác nhận an toàn; xuất file Excel (.xlsx). |
| FR-10 | Quản trị danh mục (Admin) | Catalog | Medium | Quản lý danh mục hàng hóa, kiểm tra ràng buộc sản phẩm; xuất file Excel. |
| FR-11 | Quản lý giỏ hàng & Đồng bộ DB | Cart | High | Thêm, sửa số lượng, xóa món hàng; đồng bộ giỏ hàng lên máy chủ khi đăng nhập. |
| FR-12 | Sản phẩm yêu thích (Wishlist) | Favorites | Low | Đánh dấu yêu thích sản phẩm (Toggle); xem danh sách yêu thích. |
| FR-13 | Khám phá Voucher & Khuyến mãi | Promo | Medium | Banner sự kiện trang chủ và kho Voucher giảm giá khả dụng. |
| FR-14 | Thẩm định & Áp dụng Voucher | Promo | High | Tính toán chiết khấu % kết hợp trần giảm tối đa (Max Cap). |
| FR-15 | Quản trị Voucher (Admin) | Promo | High | Tạo, sửa, bật/tắt voucher; kiểm tra trùng mã Code; xuất file Excel. |
| FR-16 | Quản trị khuyến mãi (Admin) | Promo | Medium | Tạo chiến dịch khuyến mãi theo mùa, gán sản phẩm; xuất file Excel. |
| FR-17 | Quản lý sổ địa chỉ | Address | High | Lưu nhiều địa chỉ nhận hàng; thiết lập địa chỉ mặc định. |
| FR-18 | Bản đồ định vị GPS (MapPicker) | Address | High | Chấm điểm vị trí trên bản đồ Leaflet, giải mã địa chỉ tự động. |
| FR-19 | Đặt địa chỉ mặc định | Address | Medium | Đặt địa chỉ mặc định tự động chọn khi thanh toán. |
| FR-20 | Quy trình đặt hàng (Checkout) | Order | High | Transaction trừ tồn kho; hỗ trợ thanh toán kép PayOS QR và COD. |
| FR-21 | Thanh toán PayOS VietQR | Payment | High | Sinh mã VietQR động; Webhook tự động cập nhật đơn sang CONFIRMED. |
| FR-22 | Thanh toán khi nhận hàng (COD) | Payment | High | Không sinh mã QR; đơn vào PENDING; giao hàng thanh toán tiền mặt. |
| FR-23 | Lịch sử & Timeline đơn hàng | Order | High | Theo dõi dòng thời gian tiến trình trạng thái minh bạch. |
| FR-24 | Hủy đơn & Yêu cầu hoàn tiền | Order | High | Khách hủy đơn đã thanh toán; nhập thông tin ngân hàng nhận tiền hoàn. |
| FR-25 | Quản trị chu trình đơn & In hóa đơn | Order | High | Duyệt đơn; popup xác nhận khi Giao thành công (Delivered); in hóa đơn A4; xuất Excel. |
| FR-26 | Xử lý hoàn tiền & In phiếu chi | Order | High | Duyệt hoàn tiền tự động chuyển sang Returned; in phiếu chi hoàn tiền A4; xuất Excel. |
| FR-27 | Đánh giá sản phẩm đã mua | Reviews | Medium | Khách đã nhận hàng (Delivered) được gửi đánh giá 1-5 sao và nhận xét. |
| FR-28 | Hiển thị điểm xếp hạng sao | Reviews | Medium | Điểm đánh giá trung bình và danh sách nhận xét cộng đồng đã xác thực. |
| FR-29 | Trò chuyện hỗ trợ trực tuyến | Support | High | Live Chat thời gian thực giữa khách hàng và tư vấn viên. |
| FR-30 | Trợ lý AI tự động phản hồi | Support | High | AI Bot tự động trả lời thắc mắc kỹ thuật máy tính và bảo hành trong 2s. |
| FR-31 | Bàn hỗ trợ khách hàng (Admin) | Support | High | Console tư vấn khách hàng 2 cột, tiếp quản hội thoại trực tiếp. |
| FR-32 | Nhận thông báo tự động | Notif | High | Thông báo biến động đơn hàng, khuyến mãi, hoàn tiền. |
| FR-33 | Quản lý trạng thái thông báo | Notif | Medium | Đánh dấu đã đọc từng thông báo hoặc đọc tất cả. |
| FR-34 | Quản trị người dùng & Phân quyền | User | High | Phân quyền Customer/Admin; cột STT chuẩn; popup xóa an toàn; xuất Excel. |
| FR-35 | Báo cáo doanh thu & Xuất Excel đa sheet | Report | High | Dashboard KPI, biểu đồ cột 12 tháng; xuất file Excel (.xlsx) gồm 2 sheet chi tiết. |

## CHƯƠNG 5: QUY TRÌNH NGHIỆP VỤ HỆ THỐNG

### Vòng đời chuyển đổi trạng thái đơn hàng (Chuẩn 7 trạng thái):
1. Pending (Chờ xác nhận): Đơn hàng mới tạo, chờ duyệt.
2. Confirmed (Đã xác nhận): Thông tin đơn và thanh toán hợp lệ.
3. Processing (Đang chuẩn bị hàng): Kho đóng gói và dán mã vận đơn.
4. Shipping (Đang giao hàng): Bàn giao cho bưu tá vận chuyển.
5. Delivered (Giao thành công): Khách nhận hàng và thanh toán đủ. Khi Admin chọn chuyển sang trạng thái này, hệ thống bật Popup xác nhận an toàn trước khi chốt doanh thu và mở quyền đánh giá sản phẩm.
6. Cancelled (Đã hủy): Đơn bị hủy khi chưa thanh toán hoặc khách hủy COD.
7. Returned (Đã trả hàng / Hoàn tiền): Trạng thái tự động được cập nhật khi Admin phê duyệt yêu cầu hoàn tiền tại phân hệ Quản lý hoàn tiền (/admin/refunds).

## CHƯƠNG 7: THIẾT KẾ CƠ SỞ DỮ LIỆU (17 THỰC THỂ)

Hệ thống quản lý 17 bảng trong Microsoft SQL Server đảm bảo tính toàn vẹn ACID:
1. Users: Tài khoản người dùng, mật khẩu băm, họ tên, điện thoại, email, vai trò (Role: Customer/Admin).
2. Categories: Danh mục sản phẩm công nghệ (Laptop, PC, Màn hình, Linh kiện...).
3. Products: Sản phẩm phần cứng, giá niêm yết, giá khuyến mãi, tồn kho, thông số CPU/RAM/VGA/Ổ cứng/Màn hình.
4. ProductVariants: Biến thể màu sắc và tùy chọn cấu hình nâng cấp.
5. CartItemDB: Giỏ hàng trực tuyến đồng bộ theo tài khoản.
6. Orders: Đơn hàng, tổng tiền, phương thức PayOS/COD, thông tin tài khoản nhận hoàn tiền, trạng thái (Status: Pending, Confirmed, Processing, Shipping, Delivered, Cancelled, Returned, RefundPending).
7. OrderItems: Chi tiết từng sản phẩm, số lượng, đơn giá trong đơn hàng.
8. OrderStatusHistory: Lịch sử kiểm toán chuyển đổi trạng thái đơn hàng (Timeline).
9. PaymentTransaction: Giao dịch thanh toán cổng PayOS (Mã đơn PayOS, link, mã QR, trạng thái PENDING/PAID).
10. Vouchers: Mã ưu đãi giảm giá (Code, % giảm, mức giảm trần MaxDiscountAmount, hạn dùng ExpiryDate).
11. Promotions: Banner chiến dịch khuyến mãi theo mùa.
12. Reviews: Đánh giá sao 1-5 và bình luận của người mua đã nhận hàng.
13. Favorites: Danh sách sản phẩm yêu thích (Wishlist).
14. AddressBookEntry: Sổ địa chỉ giao hàng tích hợp tọa độ GPS (Latitude, Longitude).
15. Notifications: Thông báo sự kiện hệ thống cho người dùng.
16. SupportConversation: Phiên hội thoại chăm sóc khách hàng trực tuyến.
17. SupportMessage: Tin nhắn trao đổi giữa khách hàng, Trợ lý AI và nhân viên Admin.

## CHƯƠNG 10: MA TRẬN TRUY VẾT YÊU CẦU (RTM)

| Mã FR | Tên yêu cầu chức năng | API Backend liên kết | Màn hình Web / Mobile | Tiêu chí nghiệm thu (UAT Acceptance Criteria) |
| :---: | :--- | :--- | :--- | :--- |
| FR-01 | Đăng nhập hệ thống | POST /api/auth/login | Web: /login<br>Mobile: AccountScreen | Đăng nhập đúng cấp JWT; Admin chuyển hướng sang /admin. |
| FR-02 | Đăng ký tài khoản (Phone OTP) | POST /api/auth/register/send-otp<br>POST /api/auth/register | Web: /register<br>Mobile: RegisterScreen | Nút gửi OTP chỉ gửi mã; kiểm tra trùng SĐT tại bước nhấn Đăng ký. |
| FR-03 | Quên mật khẩu (Nút Gửi OTP) | POST /api/auth/forgot-password/send-otp<br>POST /api/auth/forgot-password/reset | Web: Modal Quên MK<br>Mobile: ForgotScreen | Có nút "Gửi" tường minh trên giao diện; đổi mật khẩu thành công bằng OTP. |
| FR-07 | Tìm kiếm & Lọc sản phẩm nâng cao | GET /api/products | Web: /customer/products<br>Mobile: ProductListScreen | Lọc kết hợp đa tiêu chí CPU, RAM, Ổ cứng, Giá, Hãng sản xuất. |
| FR-14 | Thẩm định & Áp dụng Voucher | POST /api/vouchers/validate | Web: /checkout & /customer/cart<br>Mobile: CheckoutScreen | Tính chiết khấu chuẩn theo % và trần giảm tối đa (Max Cap). |
| FR-20 | Quy trình tạo đơn hàng (Checkout) | POST /api/orders | Web: /checkout<br>Mobile: CheckoutScreen | Chạy trong Transaction trừ tồn kho; hỗ trợ song song PayOS & COD. |
| FR-21 | Thanh toán VietQR qua PayOS | POST /api/orders/:id/payos-payment<br>POST /api/orders/payos/webhook | Web: Modal PayOS QR<br>Mobile: VNPayQrScreen | Sinh mã VietQR động; Webhook tự động cập nhật đơn sang CONFIRMED. |
| FR-22 | Thanh toán khi nhận hàng (COD) | POST /api/orders (method: COD) | Web: /checkout<br>Mobile: CheckoutScreen | Không sinh mã QR; đơn vào PENDING và chuyển hướng ngay sang trang cảm ơn. |
| FR-25 | Quản trị chu trình đơn & In hóa đơn A4 | PATCH /api/orders/:id/status<br>GET /api/orders | Web Admin: /admin/orders | Có popup xác nhận khi chọn Delivered; nút in hóa đơn A4 và nút xuất Excel .xlsx. |
| FR-26 | Xử lý hoàn tiền & In phiếu hoàn tiền | POST /api/orders/:id/refund-approve<br>GET /api/orders/refund-requests | Web Admin: /admin/refunds | Tự động chuyển đơn sang Returned khi duyệt hoàn tiền; in phiếu chi A4; xuất Excel. |
| FR-34 | Quản trị người dùng & Phân quyền | GET/PUT/DELETE /api/users | Web Admin: /admin/users | Cột STT chuẩn; đổi quyền Role; popup xác nhận khi xóa tài khoản; xuất Excel. |
| FR-35 | Báo cáo thống kê & Xuất Excel đa sheet | GET /api/orders (Dashboard) | Web Admin: /admin | Xuất file Excel .xlsx gồm Sheet KPI và Sheet chi tiết đơn hàng năm. |

KẾT LUẬN & CAM KẾT CHẤT LƯỢNG HỆ THỐNG DEVORA:
Tài liệu Đặc tả Yêu cầu Phần mềm (SRS_DEVORA v2.1) phản ánh chính xác 100% hiện trạng kiến trúc mã nguồn thực tế và năng lực vận hành của Hệ sinh thái DEVORA (gồm Backend API, Web Next.js và Mobile Flutter). Hệ thống hoàn toàn sẵn sàng cho công tác chấm điểm, nghiệm thu kỹ thuật và báo cáo đồ án tốt nghiệp/học phần nâng cao.
`;

async function buildWordDoc() {
  const lines = SRS_MARKDOWN.split('\n');
  const docChildren = [];

  // Tiêu đề trang bìa
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG',
          bold: true,
          size: 24, // 12pt
          color: '333333',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KHOA CÔNG NGHỆ PHẦN MỀM - BỘ MÔN CÔNG NGHỆ PHẦN MỀM NÂNG CAO',
          bold: true,
          size: 24,
          color: '333333',
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM',
          bold: true,
          size: 36, // 18pt
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'SOFTWARE REQUIREMENTS SPECIFICATION (SRS)',
          bold: true,
          size: 28, // 14pt
          color: '2563EB',
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'HỆ THỐNG THƯƠNG MẠI ĐIỆN TỬ BÁN MÁY TÍNH & LINH KIỆN CÔNG NGHỆ DEVORA',
          bold: true,
          size: 26,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'RESTful Backend API (Node.js/Express) + Web Khách hàng & Quản trị (Next.js) + Ứng dụng Di động (Flutter)',
          italics: true,
          size: 22,
          color: '64748B',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (i < 6 && line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|[\s:-|-]+\|$/.test(line)) {
        continue;
      }
      inTable = true;
      const rawCols = line.split('|').slice(1, -1).map(c => c.trim().replace(/<br>/g, '\n'));
      tableRows.push(rawCols);
      continue;
    } else if (inTable) {
      inTable = false;
      if (tableRows.length > 0) {
        const docTableRows = tableRows.map((rowCols, rIdx) => {
          return new TableRow({
            tableHeader: rIdx === 0,
            children: rowCols.map(cellText => {
              const isHeader = rIdx === 0;
              return new TableCell({
                width: { size: Math.floor(9200 / rowCols.length), type: WidthType.DXA },
                shading: isHeader ? { fill: '0F172A' } : (rIdx % 2 === 0 ? { fill: 'F8FAFC' } : { fill: 'FFFFFF' }),
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cellText,
                        bold: isHeader || cellText.startsWith('**'),
                        color: isHeader ? 'FFFFFF' : '1E293B',
                        size: isHeader ? 21 : 20,
                      }),
                    ],
                  }),
                ],
              });
            }),
          });
        });

        docChildren.push(
          new Table({
            rows: docTableRows,
            alignment: AlignmentType.CENTER,
            width: { size: 9500, type: WidthType.DXA },
          }),
          new Paragraph({ spacing: { after: 200 } })
        );
        tableRows = [];
      }
    }

    if (!line) continue;

    if (line.startsWith('## ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: line.replace('## ', ''),
              bold: true,
              size: 28,
              color: '1E3A8A',
            }),
          ],
          spacing: { before: 300, after: 120 },
        })
      );
    } else if (line.startsWith('### ')) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: line.replace('### ', ''),
              bold: true,
              size: 25,
              color: '2563EB',
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      docChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: line.replace(/^[-*]\s+/, ''),
              size: 22,
              color: '334155',
            }),
          ],
          spacing: { after: 60 },
        })
      );
    } else {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 22,
              color: '334155',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = 'D:\\SRS_DEVORA_v2.1_ChuanHoa.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Successfully created Word document at:', outPath);
}

buildWordDoc().catch(console.error);
