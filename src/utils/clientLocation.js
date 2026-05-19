const STORAGE_KEY = 'chambing-client-location';
const TTL_MS = 24 * 60 * 60 * 1000;

export const getStoredClientLocation = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.lat !== 'number' ||
      typeof parsed?.lng !== 'number' ||
      typeof parsed?.ts !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.ts > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
};

export const saveClientLocation = (lat, lng) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lat, lng, ts: Date.now() }),
  );
};

export const clearStoredClientLocation = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
};

export const requestClientLocation = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        saveClientLocation(coords.lat, coords.lng);
        resolve(coords);
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });
