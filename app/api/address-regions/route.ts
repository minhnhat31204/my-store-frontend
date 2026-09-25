import { NextResponse } from "next/server";

const API_BASE = "https://provinces.open-api.vn/api/v2";
type ApiRegion = { code: number; name: string; province_code?: number };

async function getData<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Danh mục địa chỉ trả về ${response.status}`);
  return response.json() as Promise<T>;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const level = params.get("level");
  try {
    if (level === "provinces") {
      const data = await getData<ApiRegion[]>("/p/");
      return NextResponse.json(data.map(({ code, name }) => ({ code: String(code), name })));
    }
    if (level === "wards") {
      const data = await getData<ApiRegion[]>("/w/");
      return NextResponse.json(data.map(({ code, name, province_code }) => ({
        code: String(code), name, provinceCode: String(province_code ?? ""),
      })));
    }
    return NextResponse.json({ error: "level phải là provinces hoặc wards." }, { status: 400 });
  } catch (error) {
    console.error("Không tải được danh mục hành chính:", error);
    return NextResponse.json({ error: "Không tải được danh mục tỉnh/thành, phường/xã. Hãy thử tải lại." }, { status: 502 });
  }
}
