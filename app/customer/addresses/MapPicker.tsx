"use client";

import { useEffect, useRef, useState } from "react";

type Props = { latitude: number | null; longitude: number | null; onPick: (latitude: number, longitude: number) => void };
type LeafletMap = {
  setView: (center: [number, number], zoom?: number) => LeafletMap;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => LeafletMap;
  remove: () => void;
};
type LeafletMarker = {
  setLatLng: (position: [number, number]) => LeafletMarker;
  addTo: (map: LeafletMap) => LeafletMarker;
  on: (event: string, handler: (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => void) => LeafletMarker;
};
type LeafletApi = {
  map: (element: HTMLElement, options: { scrollWheelZoom: boolean }) => LeafletMap;
  tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => { addTo: (map: LeafletMap) => void };
  marker: (position: [number, number], options: { draggable: boolean }) => LeafletMarker;
};

declare global {
  interface Window { L?: LeafletApi; __manbLeafletLoading?: Promise<void> }
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (window.__manbLeafletLoading) return window.__manbLeafletLoading;
  window.__manbLeafletLoading = new Promise<void>((resolve, reject) => {
    if (!document.querySelector("#manb-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "manb-leaflet-css";
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => window.L ? resolve() : reject(new Error("Leaflet chưa sẵn sàng."));
    script.onerror = () => reject(new Error("Không tải được bản đồ. Kiểm tra kết nối mạng rồi tải lại."));
    document.body.appendChild(script);
  });
  return window.__manbLeafletLoading;
}

export default function MapPicker({ latitude, longitude, onPick }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  onPickRef.current = onPick;

  useEffect(() => {
    let mounted = true;
    loadLeaflet().then(() => {
      if (!mounted || !element.current || !window.L) return;
      const L = window.L;
      const center: [number, number] = latitude !== null && longitude !== null ? [latitude, longitude] : [16.2, 107.8];
      const instance = L.map(element.current, { scrollWheelZoom: false }).setView(center, latitude !== null ? 16 : 5);
      map.current = instance;
      setMapReady(true);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(instance);
      const placeMarker = (lat: number, lng: number) => {
        const point: [number, number] = [lat, lng];
        if (marker.current) marker.current.setLatLng(point);
        else {
          marker.current = L.marker(point, { draggable: true }).addTo(instance);
          marker.current.on("dragend", (event) => {
            const position = event.target.getLatLng();
            onPickRef.current(position.lat, position.lng);
          });
        }
        onPickRef.current(lat, lng);
      };
      if (latitude !== null && longitude !== null) {
        marker.current = L.marker([latitude, longitude], { draggable: true }).addTo(instance);
        marker.current.on("dragend", (event) => {
          const position = event.target.getLatLng();
          onPickRef.current(position.lat, position.lng);
        });
      }
      instance.on("click", (event) => placeMarker(event.latlng.lat, event.latlng.lng));
    }).catch((error: unknown) => {
      if (mounted) setMapError(error instanceof Error ? error.message : "Không tải được bản đồ.");
    });
    return () => { mounted = false; map.current?.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => {
    if (latitude === null || longitude === null || !map.current || !window.L) return;
    const point: [number, number] = [latitude, longitude];
    if (marker.current) marker.current.setLatLng(point);
    else {
      marker.current = window.L.marker(point, { draggable: true }).addTo(map.current);
      marker.current.on("dragend", (event) => {
        const position = event.target.getLatLng();
        onPickRef.current(position.lat, position.lng);
      });
    }
    map.current.setView(point, 16);
  }, [latitude, longitude, mapReady]);

  return <div>
    <div ref={element} className="h-72 w-full rounded-xl border border-slate-200 bg-slate-100" aria-label="Bản đồ chọn vị trí giao hàng" />
    {mapError && <p role="alert" className="mt-2 text-sm text-red-700">{mapError}</p>}
    <p className="mt-2 text-xs text-slate-500">Chạm vào bản đồ hoặc kéo ghim để chọn vị trí. Bản đồ dùng OpenStreetMap.</p>
  </div>;
}
