import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// City centroids used to recentre the map when the city changes.
export const CITY_COORDS: Record<string, [number, number]> = {
  Bangalore: [12.9716, 77.5946],
  Mumbai: [19.076, 72.8777],
  "Delhi NCR": [28.6139, 77.209],
  Pune: [18.5204, 73.8567],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

/** Custom amber map pin (avoids Leaflet's default icon asset issues). */
function makePinIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:38px;">
        <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.2 0 0 7.1 0 15.8C0 27.6 16 38 16 38C16 38 32 27.6 32 15.8C32 7.1 24.8 0 16 0Z"
            fill="${active ? "#f59e0b" : "#0f4c81"}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="15.5" r="6.5" fill="white"/>
        </svg>
      </div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -34],
  });
}

export interface LocationValue {
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  city?: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
}

/**
 * Manual location chooser: click or drag a pin on an OpenStreetMap map,
 * or type coordinates directly. Fires onChange with lat/lng (5 decimals).
 */
export function LocationPicker({ city, value, onChange, className }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const hasPin = value.latitude != null && value.longitude != null;
  const pinLatLng: [number, number] = hasPin
    ? [value.latitude!, value.longitude!]
    : (city && CITY_COORDS[city]) || DEFAULT_CENTER;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: pinLatLng,
      zoom: city ? 12 : 5,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker(pinLatLng, {
      icon: makePinIcon(true),
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Click to place pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });

    // Drag to place pin
    marker.on("dragend", (e: L.DragEndEvent) => {
      const latlng = (e.target as L.Marker).getLatLng();
      onChange({ latitude: latlng.lat, longitude: latlng.lng });
    });

    map.on("error", () => setMapError("Couldn't load the map tiles — type the coordinates manually below."));

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre when city changes (only when the user hasn't placed a pin)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (city && CITY_COORDS[city] && !hasPin) {
      map.flyTo(CITY_COORDS[city], 12);
      markerRef.current?.setLatLng(CITY_COORDS[city]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  // Keep marker in sync with external value changes
  useEffect(() => {
    if (hasPin) {
      markerRef.current?.setLatLng([value.latitude!, value.longitude!]);
      mapRef.current?.panTo([value.latitude!, value.longitude!]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.latitude, value.longitude]);

  const handleLocate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onChange({ latitude: lat, longitude: lng });
        mapRef.current?.flyTo([lat, lng], 15);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const setManual = (field: "latitude" | "longitude", raw: string) => {
    const num = Number(raw);
    const next: LocationValue = { ...value };
    if (Number.isFinite(num) && Math.abs(num) <= 180) {
      next[field] = num;
      onChange(next);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-border/60">
        <div ref={containerRef} className="h-64 w-full sm:h-72" />
        {/* Overlay hint */}
        {!hasPin && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-blue-950/85 px-3 py-1 text-[11px] font-medium text-white shadow">
              Click the map or drag the pin to set the exact location
            </span>
          </div>
        )}
      </div>
      {mapError && <p className="text-xs text-destructive">{mapError}</p>}

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Latitude</Label>
            <Input
              type="number"
              step="0.0001"
              value={value.latitude ?? ""}
              onChange={(e) => setManual("latitude", e.target.value)}
              placeholder="12.9716"
              className="mt-1 h-9 w-28 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Longitude</Label>
            <Input
              type="number"
              step="0.0001"
              value={value.longitude ?? ""}
              onChange={(e) => setManual("longitude", e.target.value)}
              placeholder="77.5946"
              className="mt-1 h-9 w-28 text-xs"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={handleLocate}
          disabled={locating}
        >
          <Crosshair className={cn("h-3.5 w-3.5 mr-1", locating && "animate-spin")} />
          {locating ? "Locating..." : "Use my location"}
        </Button>
      </div>

      {hasPin && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <MapPin className="h-3.5 w-3.5" />
          Pin placed at {value.latitude!.toFixed(4)}, {value.longitude!.toFixed(4)}
        </p>
      )}
    </div>
  );
}