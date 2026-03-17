import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
  readonly?: boolean;
}

function ClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Flies the map to a new position whenever the prop changes
function FlyToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({ position, onPositionChange, readonly = false }: Props) {
  const center: [number, number] = position || [20.5937, 78.9629]; // Default to India center

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-lg border">
      <MapContainer center={center} zoom={position ? 13 : 5} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readonly && <ClickHandler onPositionChange={onPositionChange} />}
        <FlyToPosition position={position} />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}
