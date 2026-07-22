import { useState, useEffect } from "react";

const API_BASE = "https://bread-crumbs-one.vercel.app";

const FALLBACK = {
  fhaLimit: 498257,
  ami: 80000,
  ami80: 64000,
  ami120: 96000,
  county: "",
  state: "",
  source: "fallback",
};

export function useHUD(locationInfo) {
  const [hud, setHud] = useState(FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state  = locationInfo?.state;
    const county = locationInfo?.county;
    if (!state) { setHud(FALLBACK); return; }

    setLoading(true);
    const params = new URLSearchParams({ state, ...(county ? { county } : {}) });
    fetch(`${API_BASE}/api/hud?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { if (json?.fhaLimit) setHud(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationInfo?.state, locationInfo?.county]);

  return { hud, loading };
}
