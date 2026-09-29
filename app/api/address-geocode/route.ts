import { NextResponse } from "next/server";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | number | undefined>;
};
type PhotonResponse = { features?: PhotonFeature[] };

const cache = new Map<string, PhotonFeature | null>();
const exactCache = new Map<string, boolean>();
let nextRequestAt = 0;
let requestQueue: Promise<unknown> = Promise.resolve();

async function photonRequest(url: URL) {
  const request = requestQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - nextRequestAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    nextRequestAt = Date.now();
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "MANB-Store-Address-Map/1.0" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Dịch vụ bản đồ trả về ${response.status}`);
    return response.json() as Promise<PhotonResponse>;
  });
  requestQueue = request.then(() => undefined, () => undefined);
  return request;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const query = (params.get("q") || "").trim().slice(0, 250);
  const reverse = !query && params.has("lat") && params.has("lon") && Number.isFinite(lat) && Number.isFinite(lon);
  if (!reverse && query.length < 6) {
    return NextResponse.json({ error: "Nhập đầy đủ số nhà, tên đường, phường/xã và tỉnh/thành." }, { status: 400 });
  }

  const cacheKey = reverse ? `reverse:${lat.toFixed(5)},${lon.toFixed(5)}` : `search:${query.toLocaleLowerCase("vi")}`;
  if (cache.has(cacheKey)) return NextResponse.json({ feature: cache.get(cacheKey), exact: exactCache.get(cacheKey) ?? true });

  try {
    const upstream = reverse
      ? new URL("https://photon.komoot.io/reverse")
      : new URL("https://photon.komoot.io/api/");
    if (reverse) {
      upstream.searchParams.set("lat", String(lat));
      upstream.searchParams.set("lon", String(lon));
      upstream.searchParams.set("lang", "en");
    } else {
      const parts = query.split(",").map((part) => part.trim()).filter(Boolean);
      const normalized = (value: string) => value.toLocaleLowerCase("vi").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
      const street = parts[0] || "";
      const ward = parts.length >= 3 ? parts[1] : "";
      const province = parts.at(-1) || "";
      const candidates = [...new Set([
        query,
        [street, ward.replace(/^(phường|phuong|xã|xa)\s+/i, ""), province].filter(Boolean).join(", "),
        [ward, province].filter(Boolean).join(", "),
        province,
      ].filter((value) => value.length >= 3))];
      let feature: PhotonFeature | null = null;
      let matchedQuery = "";
      for (const candidate of candidates) {
        const candidateUrl = new URL("https://photon.komoot.io/api/");
        candidateUrl.searchParams.set("q", candidate);
        candidateUrl.searchParams.set("lat", String(params.has("lat") && Number.isFinite(lat) ? lat : 16));
        candidateUrl.searchParams.set("lon", String(params.has("lon") && Number.isFinite(lon) ? lon : 108));
        candidateUrl.searchParams.set("limit", "3");
        const data = await photonRequest(candidateUrl);
        const result = data.features?.find((item) => item.geometry?.coordinates?.length === 2);
        if (result) {
          feature = result;
          matchedQuery = candidate;
          break;
        }
      }
      const featureAddress = feature?.properties || {};
      const matchedStreet = normalized(String(featureAddress.street || featureAddress.name || featureAddress.road || ""));
      const exact = normalized(matchedQuery) === normalized(query)
        && (!street || (matchedStreet.length > 0
          && (matchedStreet.includes(normalized(street)) || normalized(street).includes(matchedStreet))));
      const result = feature ? { feature, exact } : null;
      cache.set(cacheKey, result?.feature || null);
      exactCache.set(cacheKey, result?.exact ?? false);
      if (cache.size > 500) {
        const oldestKey = cache.keys().next().value as string;
        cache.delete(oldestKey);
        exactCache.delete(oldestKey);
      }
      return NextResponse.json({ feature: result?.feature || null, exact: result?.exact ?? false });
    }
    const data = await photonRequest(upstream);
    const feature = data.features?.[0] || null;
    cache.set(cacheKey, feature);
    exactCache.set(cacheKey, true);
    if (cache.size > 500) {
      const oldestKey = cache.keys().next().value as string;
      cache.delete(oldestKey);
      exactCache.delete(oldestKey);
    }
    return NextResponse.json({ feature, exact: true });
  } catch (error) {
    console.error("Address geocoding failed:", error);
    return NextResponse.json({ error: "Không tra được vị trí từ dịch vụ bản đồ. Bạn có thể thử ghim trực tiếp trên bản đồ." }, { status: 502 });
  }
}
