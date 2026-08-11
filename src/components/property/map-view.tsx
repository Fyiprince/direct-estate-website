import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MapViewProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

/** Read-only single-pin map used on the property detail page. */
export function MapView({ latitude, longitude, label, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:32px;height:38px;">
          <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.2 0 0 7.1 0 15.8C0 27.6 16 38 16 38C16 38 32 27.6 32 15.8C32 7.1 24.8 0 16 0Z"
              fill="#0f4c81" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="15.5" r="6.5" fill="white"/>
          </svg>
        </div>`,
      iconSize: [32, 38],
      iconAnchor: [16, 38],
    });

    L.marker([latitude, longitude], { icon })
      .addTo(map)
      .bindPopup(label ?? "Property location")
      .openPopup();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={containerRef}
      className={cn("h-56 w-full overflow-hidden rounded-xl border border-border/60", className)}
    />
  );
}