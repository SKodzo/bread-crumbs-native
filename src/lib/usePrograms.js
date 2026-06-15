import { useState, useEffect } from "react";
import { calcFromSpec, getProgramsForLocation } from "./data";

const API_BASE = "https://bread-crumbs-one.vercel.app";

export function usePrograms(loc, data) {
  const [programs, setPrograms] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loc?.state) { setPrograms([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({
      state: loc.state || "", city: loc.city || "", county: loc.county || "",
      profession: data.profession || "none", isVet: String(!!data.isVet),
      income: String(data.income || 0), householdSize: String(data.householdSize || 1),
    });
    fetch(`${API_BASE}/api/programs?${params}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => {
        const rebuilt = json.programs.map(p => ({
          ...p, calc: price => calcFromSpec(p.calcSpec, price),
        }));
        setPrograms(rebuilt);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        setPrograms(getProgramsForLocation(
          loc.state, loc.city, loc.county,
          data.profession, data.isVet, data.income, data.householdSize || 1
        ));
      })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [loc?.state, loc?.city, loc?.county, data.profession, data.isVet, data.income, data.householdSize]);

  return { programs: programs || [], loading };
}
