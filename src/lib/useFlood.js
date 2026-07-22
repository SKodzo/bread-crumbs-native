import { useState, useEffect } from "react";

const API_BASE = "https://bread-crumbs-one.vercel.app";

export function useFlood(zip) {
  const [flood, setFlood] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zip || zip.length < 5) { setFlood(null); return; }

    setLoading(true);
    fetch(`${API_BASE}/api/flood?zip=${zip}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { if (json?.floodZone) setFlood(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [zip]);

  return { flood, loading };
}
