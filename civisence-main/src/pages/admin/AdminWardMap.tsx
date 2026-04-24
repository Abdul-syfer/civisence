import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAuthorities } from "@/lib/firestore";
import { getWardFromCoords, getMunicipalityFromCoords } from "@/lib/wardLookup";
import { Authority, departments } from "@/lib/types";
import { AdminLayout } from "./AdminPages";
import { Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

// CSS class names defined in index.css — one per departments[] index
const DEPT_DOT_CLASSES = [
  "dept-dot-0", // Road Maintenance
  "dept-dot-1", // Water Supply
  "dept-dot-2", // Drainage
  "dept-dot-3", // Electricity
  "dept-dot-4", // Sanitation
  "dept-dot-5", // Emergency Services
  "dept-dot-6", // Street Lighting
];

// Hex values still needed for Leaflet divIcon HTML strings (can't use CSS classes inside innerHTML)
const DEPT_COLORS_HEX = [
  "#ef4444", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#f43f5e", "#06b6d4",
];

const deptDotClass = (dept: string) => {
  const idx = departments.indexOf(dept);
  return DEPT_DOT_CLASSES[idx >= 0 ? idx : 0];
};

const deptColorHex = (dept: string) => {
  const idx = departments.indexOf(dept);
  return DEPT_COLORS_HEX[idx >= 0 ? idx : 0];
};

const createAuthorityIcon = (colorHex: string) =>
  L.divIcon({
    className: "",
    // Leaflet divIcon innerHTML can only use inline styles — this is intentional
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${colorHex};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  });

const createClickMarkerIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#0ea5e9;border:3px solid white;
      box-shadow:0 0 0 6px rgba(14,165,233,0.25);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

interface WardInfo {
  lat: number;
  lng: number;
  ward: string | null;
  municipality: string | null;
}

export const AdminWardMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const clickMarker = useRef<L.Marker | null>(null);

  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [wardInfo, setWardInfo] = useState<WardInfo | null>(null);

  // Load authorities
  useEffect(() => {
    getAuthorities()
      .then(setAuthorities)
      .catch(console.error)
      .finally(() => setLoadingAuth(false));
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Centre on Tamil Nadu
    const map = L.map(mapRef.current, { zoomControl: false }).setView([11.1271, 78.6569], 7);

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

    // Click to look up ward
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      setLookingUp(true);
      setWardInfo(null);

      if (clickMarker.current) {
        clickMarker.current.setLatLng([lat, lng]);
      } else {
        clickMarker.current = L.marker([lat, lng], { icon: createClickMarkerIcon() }).addTo(map);
      }

      // getWardFromCoords already falls back to city/town name if no ward number found
      const [ward, municipality] = await Promise.all([
        getWardFromCoords(lat, lng),
        getMunicipalityFromCoords(lat, lng),
      ]);

      setWardInfo({ lat, lng, ward, municipality });
      setLookingUp(false);
    });

    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersLayer.current = null;
      clickMarker.current = null;
    };
  }, []);

  // Plot authority markers
  useEffect(() => {
    const layer = markersLayer.current;
    const map = mapInstance.current;
    if (!layer || !map || loadingAuth) return;

    layer.clearLayers();

      // Authorities without stored coordinates cannot be plotted yet.
      // When authority lat/lng is persisted, use:
      //   L.marker([auth.lat, auth.lng], { icon: createAuthorityIcon(deptColorHex(auth.department)) }).addTo(layer)
      void authorities;
  }, [authorities, loadingAuth]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Click anywhere on the map to look up the ward for that location. Authority officers are plotted by their assigned ward.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {departments.map((dept, i) => (
            <div key={dept} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0", DEPT_DOT_CLASSES[i])} />
              <span>{dept.replace(" Department", "").replace(" Services", "")}</span>
            </div>
          ))}
        </div>

        {/* Map container */}
        <div className="relative rounded-xl overflow-hidden border border-border h-[60vh]">
          <div ref={mapRef} className="w-full h-full" />

          {/* Ward info panel */}
          {(lookingUp || wardInfo) && (
            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
              <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl max-w-sm mx-auto pointer-events-auto">
                {lookingUp ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up ward info…
                  </div>
                ) : wardInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {wardInfo.ward ?? wardInfo.municipality ?? "Location unresolvable"}
                          </p>
                          {wardInfo.municipality && (
                            <p className="text-xs text-muted-foreground">{wardInfo.municipality}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Close"
                        aria-label="Close"
                        onClick={() => setWardInfo(null)}
                        className="text-muted-foreground hover:text-foreground ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {wardInfo.lat.toFixed(5)}, {wardInfo.lng.toFixed(5)}
                    </p>

                    {/* Show which authority is assigned to this ward */}
                    {(wardInfo.ward || wardInfo.municipality) && (() => {
                      const resolvedWard = wardInfo.ward ?? wardInfo.municipality;
                      const matched = authorities.filter(a => a.ward === resolvedWard);
                      return matched.length > 0 ? (
                        <div className="border-t border-border pt-2 space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Assigned Officers
                          </p>
                          {matched.map(a => (
                            <div key={a.id} className="flex items-center gap-2 text-xs">
                              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", deptDotClass(a.department))} />
                              <span className="font-medium text-foreground">{a.name}</span>
                              <span className="text-muted-foreground">({a.officerId})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-destructive border-t border-border pt-2">
                          No officer assigned to {wardInfo.ward ?? wardInfo.municipality}
                        </p>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Authority list by ward */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Authorities by Ward</h3>
          {loadingAuth ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : authorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No authorities added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {authorities
                .slice()
                .sort((a, b) => a.ward.localeCompare(b.ward))
                .map(auth => (
                  <div
                    key={auth.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border border-border bg-card",
                      !auth.active && "opacity-50"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-1", deptDotClass(auth.department))} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{auth.name}</p>
                      <p className="text-[11px] text-primary font-semibold">{auth.ward}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{auth.department}</p>
                      <p className="text-[10px] text-muted-foreground">{auth.officerId}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWardMap;
