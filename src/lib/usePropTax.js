import { useState, useEffect } from "react";

const API_BASE = "https://bread-crumbs-one.vercel.app";

export function usePropTax(locationInfo) {
  const [propTax, setPropTax] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = locationInfo?.state;
    const county = locationInfo?.county;
    if (!state) { setPropTax(null); return; }

    setLoading(true);
    const params = new URLSearchParams({ state, ...(county ? { county } : {}) });
    fetch(`${API_BASE}/api/proptax?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { if (json?.effectiveRate) setPropTax(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locationInfo?.state, locationInfo?.county]);

  return { propTax, loading };
}
