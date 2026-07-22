import { useState, useEffect } from "react";

const API_BASE = "https://bread-crumbs-one.vercel.app";

export function useCrime(locationInfo) {
  const [crime, setCrime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = locationInfo?.state;
    const city = locationInfo?.city;
    if (!state || !city) { setCrime(null); return; }

    setLoading(true);
    const params = new URLSearchParams({ state, city });
    fetch(`${API_BASE}/api/crime?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { if (json?.safety) setCrime(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationInfo?.state, locationInfo?.city]);

  return { crime, loading };
}
