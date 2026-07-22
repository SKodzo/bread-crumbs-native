import { useEffect } from "react";
import { applyTaxConfig } from "./tax";

const API_BASE = "https://bread-crumbs-one.vercel.app";

export function useTaxConfig() {
  useEffect(() => {
    fetch(`${API_BASE}/api/tax-config`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(config => {
        if (config?.federal?.single?.brackets) applyTaxConfig(config);
      })
      .catch(() => {});
  }, []);
}
