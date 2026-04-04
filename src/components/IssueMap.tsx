import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CivicIssue, Severity } from "@/lib/types";

const severityColors: Record<Severity, string> = {
  severe: "#ef4444",
  medium: "#f59e0b",
  minor: "#22c55e",
};

const isValidCoord = (lat: unknown, lng: unknown): boolean =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  !isNaN(lat) &&
  !isNaN(lng) &&
  lat !== 0 &&
  lng !== 0 &&
  lat >= -90 && lat <= 90 &&
  lng >= -180 && lng <= 180;

const createIssueIcon = (color: string, count: number) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:38px;height:38px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 3px 12px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      ${count > 1 ? `<div style="
        position:absolute;top:-6px;right:-6px;
        background:white;color:${color};
        font-size:9px;font-weight:700;
        border-radius:999px;padding:1px 4px;
        border:1px solid ${color};
        line-height:1.4;
      ">${count}</div>` : ""}
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40],
  });

const createUserIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:#3b82f6;border:3px solid white;
      box-shadow:0 0 0 8px rgba(59,130,246,0.2);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

interface Props {
  issues: CivicIssue[];
  userLocation?: { lat: number; lng: number } | null;
  onSelectIssue?: (issue: CivicIssue) => void;
  onMapClick?: (lat: number, lng: number) => void;
  severityFilter?: Severity | "all";
  statusFilter?: "open" | "resolved" | "all";
  /** Increment this counter to trigger a flyTo on the user's location */
  panToUser?: number;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const IssueMap = ({
  issues,
  userLocation,
  onSelectIssue,
  onMapClick,
  severityFilter = "all",
  statusFilter = "all",
  panToUser = 0,
  center = [28.6139, 77.209],
  zoom = 14,
  className = "h-[60vh]",
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const hasCenteredOnUser = useRef(false);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    if (onMapClick) {
      map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersLayer.current = null;
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render markers when issues, location, or filters change
  useEffect(() => {
    const map = mapInstance.current;
    const layer = markersLayer.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // User location marker
    if (userLocation && isValidCoord(userLocation.lat, userLocation.lng)) {
      L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon(),
        zIndexOffset: 1000,
      })
        .addTo(layer)
        .bindTooltip("You are here", { permanent: false, direction: "top" });

      if (!hasCenteredOnUser.current) {
        map.setView([userLocation.lat, userLocation.lng], 16);
        hasCenteredOnUser.current = true;
      }
    }

    // Apply filters
    const visible = issues.filter((i) => {
      if (severityFilter !== "all" && i.severity !== severityFilter) return false;
      if (statusFilter === "open" && i.status === "resolved") return false;
      if (statusFilter === "resolved" && i.status !== "resolved") return false;
      return isValidCoord(i.lat, i.lng);
    });

    visible.forEach((issue) => {
      const color = severityColors[issue.severity] ?? "#6b7280";
      const marker = L.marker([issue.lat, issue.lng], {
        icon: createIssueIcon(color, issue.reportCount),
      }).addTo(layer);

      if (onSelectIssue) {
        marker.on("click", () => onSelectIssue(issue));
      }
      marker.bindTooltip(`<b>${issue.title}</b><br/><span style="font-size:10px">${issue.category}</span>`, {
        direction: "top",
        offset: [0, -26],
        className: "!bg-card !text-foreground !border-border !rounded-lg !px-3 !py-1.5 !text-xs !shadow-lg",
      });
    });
  }, [issues, userLocation, severityFilter, statusFilter, onSelectIssue]);

  // Effect to fly to user location when panToUser prop increments
  useEffect(() => {
    if (panToUser > 0 && userLocation && isValidCoord(userLocation.lat, userLocation.lng) && mapInstance.current) {
      mapInstance.current.flyTo([userLocation.lat, userLocation.lng], 17, {
        animate: true,
        duration: 1,
      });
    }
  }, [panToUser, userLocation]);

  return <div ref={mapRef} className={`w-full ${className} z-0`} />;
};

export default IssueMap;
