"use client";

import { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import Link from "next/link";

export interface MapPin {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
}

const ICON = icon({
  iconUrl: "/z.webp",
  iconSize: [24, 24],
});

function getBounds(pins: MapPin[]): [[number, number], [number, number]] {
  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  return [
    [Math.min(...lats) - 0.3, Math.min(...lngs) - 0.3],
    [Math.max(...lats) + 0.3, Math.max(...lngs) + 0.3],
  ];
}

export default function MultiPinMap({ pins }: { pins: MapPin[] }) {
  if (pins.length === 0) return null;

  const center: [number, number] =
    pins.length === 1
      ? [pins[0].lat, pins[0].lng]
      : [
          pins.reduce((s, p) => s + p.lat, 0) / pins.length,
          pins.reduce((s, p) => s + p.lng, 0) / pins.length,
        ];

  const bounds = pins.length > 1 ? getBounds(pins) : undefined;

  return (
    <MapContainer
      center={center}
      zoom={pins.length === 1 ? 12 : 7}
      bounds={bounds}
      scrollWheelZoom={false}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={ICON}>
          <Popup>
            <Link href={`/home/${pin.id}`} className="font-semibold text-sm hover:underline">
              {pin.title}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">${pin.price} / noche</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
