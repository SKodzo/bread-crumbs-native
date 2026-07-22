import { useState, useEffect } from "react";

const API_BASE = "https://bread-crumbs-one.vercel.app";
const FALLBACK = { conv30: 6.89, conv15: 6.18, fha30: 7.14, va30: 6.54, arm5: 6.14, updated: null };

export function useRates() {
  const [rates, setRates] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/rates`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => { if (json?.conv30) setRates(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading };
}
