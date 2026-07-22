// State income tax engine — 2026 rates sourced from Tax Foundation and state DOR sites.
// Covers all 50 states + DC + NYC local tax.
//
// Three state types: "none" (no income tax), "flat" (single rate), "progressive" (brackets).
// Progressive brackets use the same [threshold, rate] format as the federal engine.

import { progressiveTax } from "./tax.js";

// No income tax
const NONE = { type: "none" };

// Flat rate states
const flat = (rate) => ({ type: "flat", rate });

// Progressive states — brackets for single filers. MFJ thresholds are typically
// ~2x single; we simplify by using single brackets for all filers since state
// bracket differences are small relative to the estimate's purpose.
const prog = (brackets, std) => ({ type: "progressive", brackets, std: std || 0 });

export const STATE_TAX_2026 = {
  // No income tax
  AK: NONE, FL: NONE, NV: NONE, SD: NONE, TN: NONE, TX: NONE, WY: NONE,
  NH: NONE, // NH taxes only interest/dividends, repealed effective 2025
  WA: NONE, // WA taxes only capital gains, not wages

  // Flat rate states
  AZ: flat(0.0250),
  CO: flat(0.0440),
  GA: flat(0.0519),
  ID: flat(0.0530),
  IL: flat(0.0495),
  IN: flat(0.0295),
  IA: flat(0.0380),
  KS: flat(0.0520),
  KY: flat(0.0350),
  LA: flat(0.0300),
  MI: flat(0.0425),
  MS: flat(0.0400),
  MO: flat(0.0200),
  NC: flat(0.0399),
  PA: flat(0.0307),

  // Progressive states
  AL: prog([[0,.02],[500,.04],[3000,.05]]),
  AR: prog([[0,.0200],[5100,.0400],[10300,.0449]]),
  CA: prog([[0,.01],[11079,.02],[26264,.04],[41452,.06],[57542,.08],[72724,.093],[371479,.103],[445771,.113],[742953,.123],[1000000,.133]], 5540),
  CT: prog([[0,.02],[10000,.045],[50000,.055],[100000,.06],[200000,.065],[250000,.069],[500000,.0699]]),
  DC: prog([[0,.04],[10000,.06],[40000,.065],[60000,.085],[250000,.0925],[500000,.0975],[1000000,.1075]]),
  DE: prog([[2000,.022],[5000,.039],[10000,.048],[20000,.052],[25000,.0555],[60000,.066]]),
  HI: prog([[0,.014],[2400,.032],[4800,.055],[9600,.064],[14400,.068],[19200,.072],[24000,.076],[36000,.079],[48000,.0825],[150000,.09],[175000,.10],[200000,.11]]),
  MA: prog([[0,.05],[1083150,.09]]),
  MD: prog([[0,.02],[1000,.03],[2000,.04],[3000,.0475],[100000,.05],[125000,.0525],[150000,.055],[250000,.0575]]),
  ME: prog([[0,.058],[26050,.0675],[61600,.0715]]),
  MN: prog([[0,.0535],[31690,.068],[104090,.0785],[183340,.0985]]),
  MT: prog([[0,.047],[21600,.059]]),
  NE: prog([[0,.0246],[3700,.0351],[22170,.0501],[35730,.0584]]),
  NJ: prog([[0,.014],[20000,.0175],[35000,.035],[40000,.05525],[75000,.0637],[500000,.0897],[1000000,.1075]]),
  NM: prog([[0,.017],[5500,.032],[11000,.047],[16000,.049],[210000,.059]]),
  NY: prog([[0,.04],[8500,.045],[11700,.0525],[13900,.0585],[80650,.0625],[215400,.0685],[1077550,.0965],[5000000,.103],[25000000,.109]], 8000),
  ND: prog([[0,.0195],[44725,.0280]]),
  OH: flat(0.0350),
  OK: prog([[0,.0025],[1000,.005],[2500,.0075],[3750,.01],[4900,.0125],[7200,.025]]),
  OR: prog([[0,.0475],[4300,.0675],[10750,.0875],[125000,.099]], 2910),
  RI: prog([[0,.0375],[77450,.0475],[176050,.0599]]),
  SC: prog([[0,.00],[3460,.03],[17330,.065]]),
  UT: flat(0.0445),
  VA: prog([[0,.02],[3000,.03],[5000,.05],[17000,.0575]]),
  VT: prog([[0,.0335],[45400,.066],[110450,.076],[229550,.0875]]),
  WI: prog([[0,.035],[14320,.044],[28640,.053],[315310,.0765]]),
  WV: prog([[0,.0236],[10000,.0315],[25000,.0354],[40000,.0472],[60000,.0512]]),
};

// NYC local income tax — applies ON TOP of NY state tax for NYC residents.
// Brackets for single/MFS filers.
export const NYC_TAX_2026 = {
  single: [[0,.03078],[12000,.03762],[25000,.03819],[50000,.03876]],
  mfj:    [[0,.03078],[21600,.03762],[45000,.03819],[90000,.03876]],
};

/**
 * Compute state income tax for a given state and taxable income.
 * Returns the annual state tax amount.
 *
 * @param {string} stateCode - two-letter state abbreviation
 * @param {number} taxableIncome - income after deductions
 * @param {object} [options]
 * @param {boolean} [options.isNYC] - true if the user lives in NYC (5 boroughs)
 * @param {string} [options.status] - filing status for NYC brackets
 */
export function stateTax(stateCode, taxableIncome, options = {}) {
  if (!stateCode || taxableIncome <= 0) return 0;
  const st = STATE_TAX_2026[stateCode.toUpperCase()];
  if (!st) return 0;

  let tax = 0;
  if (st.type === "none") {
    tax = 0;
  } else if (st.type === "flat") {
    tax = Math.max(0, taxableIncome) * st.rate;
  } else {
    const adj = st.std ? Math.max(0, taxableIncome - st.std) : Math.max(0, taxableIncome);
    tax = progressiveTax(adj, st.brackets);
  }

  if (stateCode.toUpperCase() === "NY" && options.isNYC) {
    const nycBrackets = options.status === "mfj" || options.status === "hoh"
      ? NYC_TAX_2026.mfj : NYC_TAX_2026.single;
    const nycTaxable = STATE_TAX_2026.NY.std
      ? Math.max(0, taxableIncome - STATE_TAX_2026.NY.std)
      : Math.max(0, taxableIncome);
    tax += progressiveTax(nycTaxable, nycBrackets);
  }

  return Math.round(tax);
}
