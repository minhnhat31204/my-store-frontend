import * as XLSX from 'xlsx';
import { Product, StoreOrder } from './api';

function formatMoneyNum(val?: number | string | null): number {
  return Number(val || 0);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN');
}

export function exportDashboardRevenueReport({
  year,
  selectedMonth,
  deliveredOrders,
  allOrders,
  products,
  userCount,
}: {
  year: number;
  selectedMonth: string;
  deliveredOrders: StoreOrder[];
  allOrders: StoreOrder[];
  products: Product[];
  userCount: number;
}) {
  const workbook = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: BÁO CÁO TỔNG QUAN (KPIs & Doanh thu 12 tháng)
  // ==========================================
  const totalLifetimeRevenue = deliveredOrders.reduce((sum, o) => sum + formatMoneyNum(o.TotalAmount), 0);
  const totalDeliveredCount = deliveredOrders.length;
  const avgOrderValue = totalDeliveredCount ? Math.round(totalLifetimeRevenue / totalDeliveredCount) : 0;

  // Lọc đơn hàng trong tháng đã chọn
  const monthOrders = deliveredOrders.filter((o) => {
    if (!o.OrderDate) return false;
    const d = new Date(o.OrderDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });
  const monthRevenue = monthOrders.reduce((sum, o) => sum + formatMoneyNum(o.TotalAmount), 0);

  // Đếm đơn theo trạng thái
  const pendingCount = allOrders.filter(o => (o.Status || '').toLowerCase() === 'pending').length;
  const deliveringCount = allOrders.filter(o => ['shipping', 'shipped', 'processing', 'confirmed'].includes((o.Status || '').toLowerCase())).length;
  const cancelledCount = allOrders.filter(o => ['cancelled', 'canceled'].includes((o.Status || '').toLowerCase())).length;

  const kpiData = [
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'TỔNG QUAN HỆ THỐNG DEVORA', 'GIÁ TRỊ': '', 'ĐƠN VỊ TÍNH': '' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Tổng doanh thu lũy kế (Tất cả đơn giao thành công)', 'GIÁ TRỊ': totalLifetimeRevenue, 'ĐƠN VỊ TÍNH': 'VNĐ' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': `Doanh thu tháng đang chọn (${selectedMonth})`, 'GIÁ TRỊ': monthRevenue, 'ĐƠN VỊ TÍNH': 'VNĐ' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Giá trị trung bình mỗi đơn hàng (AOV)', 'GIÁ TRỊ': avgOrderValue, 'ĐƠN VỊ TÍNH': 'VNĐ / đơn' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Tổng số đơn hàng giao thành công', 'GIÁ TRỊ': totalDeliveredCount, 'ĐƠN VỊ TÍNH': 'Đơn hàng' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Số đơn chờ duyệt / chuẩn bị hàng', 'GIÁ TRỊ': pendingCount, 'ĐƠN VỊ TÍNH': 'Đơn hàng' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Số đơn đang vận chuyển', 'GIÁ TRỊ': deliveringCount, 'ĐƠN VỊ TÍNH': 'Đơn hàng' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Số đơn đã hủy', 'GIÁ TRỊ': cancelledCount, 'ĐƠN VỊ TÍNH': 'Đơn hàng' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Tổng số sản phẩm trong kho hàng', 'GIÁ TRỊ': products.length, 'ĐƠN VỊ TÍNH': 'Sản phẩm' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': 'Tổng số tài khoản khách hàng', 'GIÁ TRỊ': userCount, 'ĐƠN VỊ TÍNH': 'Thành viên' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': '', 'GIÁ TRỊ': '', 'ĐƠN VỊ TÍNH': '' },
    { 'CHỈ SỐ DOANH THU & KINH DOANH': `DOANH THU THEO TỪNG THÁNG NĂM ${year}`, 'GIÁ TRỊ': '', 'ĐƠN VỊ TÍNH': '' },
  ];

  // Tính 12 tháng của năm
  for (let m = 1; m <= 12; m++) {
    const mStr = `${year}-${String(m).padStart(2, '0')}`;
    const ordersInM = deliveredOrders.filter(o => {
      if (!o.OrderDate) return false;
      const d = new Date(o.OrderDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mStr;
    });
    const revInM = ordersInM.reduce((sum, o) => sum + formatMoneyNum(o.TotalAmount), 0);
    kpiData.push({
      'CHỈ SỐ DOANH THU & KINH DOANH': `Tháng ${m}/${year} (${ordersInM.length} đơn hoàn tất)`,
      'GIÁ TRỊ': revInM,
      'ĐƠN VỊ TÍNH': 'VNĐ',
    });
  }

  const wsKpi = XLSX.utils.json_to_sheet(kpiData);
  wsKpi['!cols'] = [{ wch: 55 }, { wch: 25 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, wsKpi, 'Tong_Quan_KPI');

  // ==========================================
  // SHEET 2: CHI TIẾT ĐƠN HÀNG THÀNH CÔNG NĂM (Nguồn doanh thu)
  // ==========================================
  const yearOrders = deliveredOrders.filter(o => {
    if (!o.OrderDate) return false;
    const d = new Date(o.OrderDate);
    return d.getFullYear() === year;
  });

  const detailRows = yearOrders.map((order, idx) => ({
    'STT': idx + 1,
    'Mã Đơn Hàng': `#DH${order.OrderID}`,
    'Thời Gian Đặt': formatDate(order.OrderDate),
    'Tài Khoản Đặt': order.User?.FullName || order.User?.Email || '',
    'Người Nhận Hàng': order.RecipientName || '—',
    'Số Điện Thoại': order.RecipientPhone || '—',
    'Địa Chỉ Giao': order.ShippingAddress || '—',
    'Phương Thức': order.PaymentMethod || 'COD',
    'Mã Voucher': order.VoucherCode || '',
    'Giảm Giá Voucher (VNĐ)': formatMoneyNum(order.DiscountAmount),
    'Doanh Thu Thực Thu (VNĐ)': formatMoneyNum(order.TotalAmount),
    'Sản Phẩm Đã Mua': (order.OrderItems || []).map(i => `${i.Product?.ProductName || `SP#${i.ProductID}`} (x${i.Quantity})`).join('; '),
  }));

  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 8 },  // STT
    { wch: 15 }, // Mã Đơn
    { wch: 20 }, // Thời gian
    { wch: 22 }, // Tài khoản
    { wch: 22 }, // Người nhận
    { wch: 16 }, // SĐT
    { wch: 35 }, // Địa chỉ
    { wch: 16 }, // Phương thức
    { wch: 16 }, // Voucher
    { wch: 22 }, // Giảm giá
    { wch: 24 }, // Doanh thu
    { wch: 45 }, // Sản phẩm
  ];
  XLSX.utils.book_append_sheet(workbook, wsDetail, `Chi_Tiet_Don_${year}`);

  // Tên file xuất báo cáo chuẩn doanh nghiệp
  const now = new Date();
  const timeTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `Bao_Cao_Doanh_Thu_DEVORA_Nam_${year}_${timeTag}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
