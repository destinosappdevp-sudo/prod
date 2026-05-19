"use client";

import { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";

const ICON = icon({
  iconUrl: "/logo.png",
  iconSize: [20, 20],
});

function RecenterMap({ latLng, zoom }: { latLng: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(latLng, zoom);
  }, [map, latLng, zoom]);
  return null;
}

function Map({
  stateValue,
  municipalityValue,
  exactAddress,
  latitude,
  longitude,
}: {
  stateValue: string;
  municipalityValue?: string;
  exactAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const { getStateByValue } = useVenezuelaStates();
  const { getMunicipalityByValue } = useVenezuelaMunicipalities();
  const stateObj = getStateByValue(stateValue);
  const municipality = municipalityValue
    ? getMunicipalityByValue(stateValue, municipalityValue)
    : null;
  const stateLatLng = stateObj?.latLng;
  const fallbackLatLng = (municipality?.latLng ?? stateLatLng ?? [6.5, -66.6]) as [number, number];
  const hasGpsCoords = Number.isFinite(latitude) && Number.isFinite(longitude);

  // Si hay coordenadas GPS exactas, úsalas directamente
  const gpsLatLng: [number, number] | null =
    hasGpsCoords ? [latitude as number, longitude as number] : null;
  const hasMunicipality = Boolean(municipality);

  // Zoom inicial: 16 si GPS, 11 si municipio, 8 si sólo estado
  const initialZoom = gpsLatLng ? 16 : municipality ? 11 : 8;
  const [pinLatLng, setPinLatLng] = useState<[number, number]>(
    gpsLatLng ?? fallbackLatLng
  );
  const [zoom, setZoom] = useState(initialZoom);

  useEffect(() => {
    if (gpsLatLng) {
      setPinLatLng(gpsLatLng);
      setZoom(16);
      return;
    }

    setPinLatLng(fallbackLatLng);
    setZoom(hasMunicipality ? 11 : 8);
  }, [
    stateValue,
    municipalityValue,
    hasMunicipality,
    gpsLatLng?.[0],
    gpsLatLng?.[1],
    fallbackLatLng[0],
    fallbackLatLng[1],
  ]);

  // Venezuela bounding box
  const inVenezuela = (lat: number, lon: number) =>
    lat >= 0.7 && lat <= 12.2 && lon >= -73.4 && lon <= -59.5;

  const tryGeocode = async (q: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ve`
      );
      const results = await res.json();
      if (results?.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        if (inVenezuela(lat, lon)) return [lat, lon];
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    // Si ya hay coordenadas GPS, no necesitamos geocodificar
    if (gpsLatLng) return;
    if (!exactAddress) return;

    const stateLabel = stateObj?.label ?? "";
    const munLabel = municipality?.label ?? "";

    // Cascade: con máximo contexto primero, luego más simple
    const queries = [
      // 1. Dirección + municipio + estado + país
      munLabel && stateLabel
        ? `${exactAddress}, ${munLabel}, ${stateLabel}, Venezuela`
        : null,
      // 2. Dirección + estado + país
      stateLabel ? `${exactAddress}, ${stateLabel}, Venezuela` : null,
      // 3. Solo dirección + país
      `${exactAddress}, Venezuela`,
    ].filter(Boolean) as string[];

    (async () => {
      for (const q of queries) {
        const coords = await tryGeocode(q);
        if (coords) {
          setPinLatLng(coords);
          setZoom(16);
          return;
        }
      }
      // Ningún query funcionó → queda en el fallback del municipio
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactAddress]);

  return (
    <MapContainer
      scrollWheelZoom={false}
      className="h-[50vh] rounded-lg relative z-0"
      center={fallbackLatLng}
      zoom={zoom}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={pinLatLng} icon={ICON} />
      <RecenterMap latLng={pinLatLng} zoom={zoom} />
    </MapContainer>
  );
}

export default Map;



