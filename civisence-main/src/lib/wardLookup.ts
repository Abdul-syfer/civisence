/**
 * Ward lookup using Nominatim reverse geocoding.
 *
 * Returns the city/town name for a GPS coordinate.
 * e.g. anywhere inside Hosur → "Hosur"
 * The entire city is treated as one ward.
 */

interface NominatimAddress {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
}

interface NominatimResponse {
    address: NominatimAddress;
}

const fetchNominatim = async (lat: number, lng: number): Promise<NominatimResponse | null> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
        const res = await fetch(url, {
            headers: { "Accept-Language": "en", "User-Agent": "CivicSense/1.0" },
        });
        if (!res.ok) return null;
        return await res.json() as NominatimResponse;
    } catch {
        return null;
    }
};

/**
 * Returns the city/town name for a GPS coordinate.
 * Anywhere inside Hosur → "Hosur"
 * On network failure → null (caller falls back to user's registered ward)
 */
export const getWardFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    const data = await fetchNominatim(lat, lng);
    if (!data) return null;
    const addr = data.address;
    return addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.state_district || null;
};

/**
 * Returns just the municipality/city name for display purposes.
 * Uses zoom=10 so it reliably returns the city rather than a street.
 */
export const getMunicipalityFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    const data = await fetchNominatim(lat, lng);
    if (!data) return null;
    const addr = data.address;
    return addr.city || addr.town || addr.municipality || addr.county || addr.state_district || null;
};
