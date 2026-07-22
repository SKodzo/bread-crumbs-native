import { useState, useEffect } from "react";
import Constants from "expo-constants";

const FRED_KEY = Constants.expoConfig?.extra?.fredApiKey || "";
const HYSA_SPREAD = 0.75;

function fredUrl(series, limit = 1) {
  return `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_KEY}&sort_order=desc&limit=${limit}&file_type=json`;
}

export function useFedRate() {
  const [dff, setDff] = useState(3.63);
  const [medianPrice, setMedianPrice] = useState(403200);
  const [hpiYoY, setHpiYoY] = useState(3.4);
  const [homeSales, setHomeSales] = useState({ current: 4090000, prev: 4190000, date: null });
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(fredUrl("DFF", 1)).then(r => r.json()),
      fetch(fredUrl("MSPUS", 1)).then(r => r.json()),
      fetch(fredUrl("USSTHPI", 5)).then(r => r.json()),
      fetch(fredUrl("EXHOSLUSM495S", 2)).then(r => r.json()),
    ])
      .then(([dffJson, mspusJson, hpiJson, salesJson]) => {
        const dffObs = dffJson?.observations?.[0];
        if (dffObs?.value && dffObs.value !== ".") {
          setDff(parseFloat(dffObs.value));
          setUpdated(dffObs.date);
        }
        const priceObs = mspusJson?.observations?.[0];
        if (priceObs?.value && priceObs.value !== ".") {
          setMedianPrice(parseFloat(priceObs.value));
        }
        const hpiObs = hpiJson?.observations || [];
        if (hpiObs.length >= 5) {
          const latest = parseFloat(hpiObs[0].value);
          const yearAgo = parseFloat(hpiObs[4].value);
          if (!isNaN(latest) && !isNaN(yearAgo) && yearAgo > 0) {
            setHpiYoY(parseFloat(((latest - yearAgo) / yearAgo * 100).toFixed(1)));
          }
        }
        const salesObs = salesJson?.observations || [];
        if (salesObs.length >= 2) {
          const cur = parseFloat(salesObs[0].value);
          const prev = parseFloat(salesObs[1].value);
          if (!isNaN(cur) && !isNaN(prev)) {
            setHomeSales({ current: cur, prev, date: salesObs[0].date });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bestHysa = parseFloat((dff + HYSA_SPREAD).toFixed(2));

  return { dff, bestHysa, medianPrice, hpiYoY, homeSales, updated, loading };
}
