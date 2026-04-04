"use client";

import { useEffect } from "react";
import { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import { SupabaseImage } from "./SupabaseImage";

export interface MapPin {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  image: string;
}

const ICON = icon({
  iconUrl: "/logo.png",
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

// Componente que actualiza el mapa cuando cambian los pins
function MapUpdater({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;

    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 12);
    } else {
      const bounds = getBounds(pins);
      map.fitBounds(bounds);
    }
  }, [pins, map]);

  return null;
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
      className="h-full w-full rounded-xl relative z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater pins={pins} />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={ICON}>
          <Popup className="custom-popup" maxWidth={250}>
            <Link href={`/home/${pin.id}`} className="block hover:opacity-90 transition-opacity">
              <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
                <SupabaseImage
                  imagePath={pin.image}
                  alt={pin.title}
                  fill
                  className="object-cover"
                  sizes="250px"
                />
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {pin.title}
              </h3>
              <p className="text-sm text-gray-900 font-medium">
                ${pin.price} <span className="text-gray-500 font-normal">/ noche</span>
              </p>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
