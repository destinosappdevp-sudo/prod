"use client";

import { icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";

const ICON = icon({
  iconUrl: "/z.webp",
  iconSize: [20, 20],
});

function Map({
  stateValue,
  municipalityValue,
}: {
  stateValue: string;
  municipalityValue?: string;
}) {
  const { getStateByValue } = useVenezuelaStates();
  const { getMunicipalityByValue } = useVenezuelaMunicipalities();
  const municipality = municipalityValue
    ? getMunicipalityByValue(stateValue, municipalityValue)
    : null;
  const stateLatLng = getStateByValue(stateValue)?.latLng;
  const latLng = municipality?.latLng ?? stateLatLng;

  return (
    <>
      <MapContainer
        scrollWheelZoom={false}
        className="h-[50vh] rounded-lg relative z-0"
        center={latLng ?? [6.5, -66.6]}
        zoom={7}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.github.com/shpetimaliu">ShpetimAliu</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={latLng ?? [6.5, -66.6]} icon={ICON} />
      </MapContainer>
    </>
  );
}

export default Map;
