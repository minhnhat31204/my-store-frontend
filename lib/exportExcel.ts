/**
 * exportExcel.ts
 * Tiện ích xuất dữ liệu ra file Excel (.xlsx) chuyên nghiệp
 * - Tự động định dạng độ rộng cột (Auto column width)
 * - Đặt tên sheet và tên file có ngày giờ xuất
 * - Hỗ trợ Tiếng Việt có dấu UTF-8 chuẩn xác
 */

import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  key?: keyof T;
  width?: number;
  transform?: (item: T, index: number) => string | number | null | undefined;
}

export function exportToExcel<T>({
  filename,
  sheetName = 'Dữ liệu',
  columns,
  data,
}: {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn<T>[];
  data: T[];
}) {
  if (!data || data.length === 0) {
    alert('Không có dữ liệu để xuất Excel!');
    return;
  }

  // Chuyển đổi dữ liệu sang định dạng hàng cho SheetJS
  const rows = data.map((item, index) => {
    const rowObj: Record<string, string | number | null> = {};
    columns.forEach((col) => {
      let val: unknown;
      if (col.transform) {
        val = col.transform(item, index);
      } else if (col.key) {
        val = item[col.key];
      }
      rowObj[col.header] = val != null ? (val as string | number) : '';
    });
    return rowObj;
  });

  // Tạo Worksheet từ JSON
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Tự động tính độ rộng cột phù hợp
  const colWidths = columns.map((col) => {
    if (col.width) return { wch: col.width };
    // Đo độ dài lớn nhất giữa header và các ô nội dung
    let maxLen = col.header.length;
    rows.forEach((r) => {
      const cellVal = String(r[col.header] ?? '');
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    // Giới hạn trong khoảng 10 đến 50 ký tự
    return { wch: Math.min(Math.max(maxLen + 4, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Tạo Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  // Tên file xuất kèm ngày giờ: vi du Danh_Sach_Don_Hang_2026-10-28_20h30.xlsx
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  const fullFilename = `${filename}_${dateStr}_${timeStr}.xlsx`;

  // Tải file về máy người dùng
  XLSX.writeFile(workbook, fullFilename);
}
