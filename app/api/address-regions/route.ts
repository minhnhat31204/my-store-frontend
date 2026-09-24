import { NextResponse } from "next/server";

const NSO_URL = "https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx";
const TODAY = new Date().toISOString().slice(0, 10);

function xmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function xmlDecode(value: string) {
  return value
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&");
}

function parseRows(xml: string) {
  const result = xml.match(/<(?:\w+:)?(DanhMucTinhResult|DanhMucPhuongXaResult)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?\1>/i)?.[2];
  if (!result) return [];
  const inner = xmlDecode(result);
  const rows: Record<string, string>[] = [];
  for (const match of inner.matchAll(/<(?:\w+:)?(Table\w*)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?\1>/gi)) {
    const fields: Record<string, string> = {};
    for (const field of match[2].matchAll(/<(?:\w+:)?([\w-]+)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?\1>/g)) {
      fields[field[1].toLowerCase().replace(/[^a-z0-9]/g, "")] = xmlDecode(field[2].replace(/<[^>]+>/g, "")).trim();
    }
    if (Object.keys(fields).length) rows.push(fields);
  }
  return rows;
}

async function soapRequest(method: "DanhMucTinh" | "DanhMucPhuongXa", provinceCode = "") {
  const fields = method === "DanhMucTinh"
    ? `<DenNgay>${TODAY}</DenNgay>`
    : `<DenNgay>${TODAY}</DenNgay><Tinh>${xmlEscape(provinceCode)}</Tinh><TenTinh></TenTinh><QuanHuyen></QuanHuyen><TenQuanHuyen></TenQuanHuyen>`;
  const body = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${method} xmlns="http://tempuri.org/">${fields}</${method}></soap:Body></soap:Envelope>`;
  const response = await fetch(NSO_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"http://tempuri.org/${method}"` },
    body,
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Danh mục hành chính trả về ${response.status}`);
  return parseRows(await response.text());
}

function firstValue(row: Record<string, string>, names: string[]) {
  for (const name of names) if (row[name]) return row[name];
  return "";
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const level = params.get("level");
  try {
    if (level === "provinces") {
      const rows = await soapRequest("DanhMucTinh");
      if (!rows.length) throw new Error("Dữ liệu tỉnh/thành trả về rỗng hoặc không đúng cấu trúc.");
      return NextResponse.json(rows.map((row) => ({
        code: firstValue(row, ["matinh", "tinh", "ma", "code", "matinhthanh"]),
        name: firstValue(row, ["tentinh", "ten", "name", "tentinhthanh"]),
      })).filter((item) => item.code && item.name));
    }
    if (level === "wards") {
      const provinceCode = params.get("provinceCode")?.trim();
      if (!provinceCode) return NextResponse.json({ error: "Thiếu mã tỉnh/thành." }, { status: 400 });
      const rows = await soapRequest("DanhMucPhuongXa", provinceCode);
      if (!rows.length) throw new Error("Dữ liệu phường/xã trả về rỗng hoặc không đúng cấu trúc.");
      return NextResponse.json(rows.map((row) => ({
        code: firstValue(row, ["maphuongxa", "maphuong", "maxa", "phuongxa", "ma", "code"]),
        name: firstValue(row, ["tenphuongxa", "tenxa", "ten", "name"]),
      })).filter((item) => item.code && item.name));
    }
    return NextResponse.json({ error: "level phải là provinces hoặc wards." }, { status: 400 });
  } catch (error) {
    console.error("Không tải được danh mục hành chính:", error);
    return NextResponse.json({ error: "Không tải được danh mục địa chỉ Việt Nam lúc này." }, { status: 502 });
  }
}
