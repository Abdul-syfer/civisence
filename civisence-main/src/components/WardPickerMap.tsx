/**
 * WardPickerMap — inline Leaflet map for selecting an authority's ward.
 * Admin clicks anywhere on the map; Nominatim reverse-geocodes to get the ward
 * name which is passed back via onWardPicked.
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getWardFromCoords, getMunicipalityFromCoords } from "@/lib/wardLookup";
import { Loader2, MapPin } from "lucide-react";

interface Props {
  onWardPicked: (ward: string) => void;
}

const createPinIcon = () =>
  L.divIcon({
    className: "",
    // Leaflet divIcon innerHTML requires inline styles — intentional
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 0 0 6px rgba(14,165,233,0.2);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const WardPickerMap = ({ onWardPicked }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const pinMarker = useRef<L.Marker | null>(null);
  const [looking, setLooking] = useState(false);
  const [info, setInfo] = useState<{ ward: string | null; municipality: string | null } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Centre on Tamil Nadu
    const map = L.map(mapRef.current, { zoomControl: true }).setView([11.1271, 78.6569], 7);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstance.current = map;

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      setLooking(true);
      setInfo(null);

      if (pinMarker.current) {
        pinMarker.current.setLatLng([lat, lng]);
      } else {
        pinMarker.current = L.marker([lat, lng], { icon: createPinIcon() }).addTo(map);
      }

      const [ward, municipality] = await Promise.all([
        getWardFromCoords(lat, lng),
        getMunicipalityFromCoords(lat, lng),
      ]);

      setLooking(false);
      setInfo({ ward, municipality });

      // Use ward if found; otherwise fall back to municipality name
      const resolved = ward || municipality;
      if (resolved) {
        onWardPicked(resolved);
      }
    });

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstance.current = null;
      pinMarker.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        Click on the map to detect the ward for that location
      </p>
      <div className="rounded-xl overflow-hidden border border-border h-52">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      {(looking || info) && (
        <div className="flex items-center gap-2 text-xs px-1">
          {looking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-muted-foreground">Looking up ward…</span>
            </>
          ) : info ? (
            (info.ward || info.municipality) ? (
              <>
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground">{info.ward || info.municipality}</span>
                {info.ward && info.municipality && (
                  <span className="text-muted-foreground">— {info.municipality}</span>
                )}
                <span className="text-[10px] text-success ml-1">✓ Ward filled</span>
              </>
            ) : (
              <span className="text-destructive text-xs">Could not detect location. Check your internet and try again.</span>
            )
          ) : null}
        </div>
      )}
    </div>
  );
};

export default WardPickerMap;
