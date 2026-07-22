// Tax engine — federal income tax, FICA, and (added in later steps) state income
// tax and itemized deductions. All constants are tax year 2026, sourced from the
// IRS 2026 inflation adjustments (Rev. Proc. 2025-32) and the SSA 2026 wage base.
//
// Brackets are computed by iterating the schedule (progressiveTax) rather than
// hand-computed cumulative bases — this removes the class of bug where a missing
// bracket silently produced wrong totals.
//
// These defaults are the in-app fallback. At runtime they can be overridden by the
// Vercel tax config (see useTaxConfig) so the numbers can be updated once a year
// without shipping a new App Store build.

export const TAX_YEAR = 2026;

// [lowerThreshold, marginalRate] ascending. MFS thresholds are MFJ / 2 by statute.
export const FEDERAL_2026 = {
  single: { std: 16100, brackets: [[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[640600,.37]] },
  mfj:    { std: 32200, brackets: [[0,.10],[24800,.12],[100800,.22],[211400,.24],[403550,.32],[512450,.35],[768700,.37]] },
  mfs:    { std: 16100, brackets: [[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[384350,.37]] },
  hoh:    { std: 24150, brackets: [[0,.10],[17700,.12],[67450,.22],[105700,.24],[201775,.32],[256200,.35],[640600,.37]] },
};

export const SS_WAGE_BASE_2026 = 184500;
export const SS_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;
export const ADDL_MEDICARE_RATE = 0.009;
// Statutory thresholds for the 0.9% additional Medicare tax — fixed in law, not indexed.
export const ADDL_MEDICARE_THRESHOLD = { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 };

export const FILING_STATUSES = ["single", "mfj", "mfs", "hoh"];

// Mutable active config — updated at runtime by useTaxConfig when the Vercel
// endpoint returns newer numbers. Every call to federalTax/ficaTax reads from here.
let _activeFederal = FEDERAL_2026;
let _activeSSBase = SS_WAGE_BASE_2026;
export function applyTaxConfig(config) {
  if (config?.federal?.single?.brackets) _activeFederal = config.federal;
  if (config?.fica?.ssWageBase) _activeSSBase = config.fica.ssWageBase;
}
export function getActiveFederal() { return _activeFederal; }
export function getActiveSSBase() { return _activeSSBase; }
export const FILING_LABELS = { single: "Single", mfj: "Married filing jointly", mfs: "Married filing separately", hoh: "Head of household" };

const normStatus = s => (FILING_STATUSES.includes(s) ? s : "single");

// Progressive tax over an ascending [threshold, rate] schedule.
export function progressiveTax(taxable, brackets) {
  if (taxable <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i][0];
    const rate = brackets[i][1];
    const hi = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxable > lo) tax += (Math.min(taxable, hi) - lo) * rate;
    else break;
  }
  return tax;
}

// Federal income tax on an already-computed taxable income.
export function federalIncomeTax(taxableIncome, status = "single", fed = FEDERAL_2026) {
  const f = fed[normStatus(status)];
  return Math.max(0, progressiveTax(Math.max(0, taxableIncome), f.brackets));
}

// Federal income tax from gross, applying pre-tax deductions and the larger of the
// standard deduction or itemized deductions (mortgage interest + capped SALT).
export function federalTax({ gross, pretax = 0, status = "single", itemized = 0, fed = null }) {
  if (!fed) fed = _activeFederal;
  const f = fed[normStatus(status)];
  const deduction = Math.max(f.std, itemized || 0);
  const taxable = Math.max(0, (gross || 0) - (pretax || 0) - deduction);
  return Math.max(0, progressiveTax(taxable, f.brackets));
}

// 2026 SALT cap — raised from $10K to $40K by the One Big Beautiful Bill Act.
// Indexed +1%/yr through 2029, then reverts to $10K in 2030.
// Phase-down: above $500K MAGI ($250K MFS), reduced $0.30 per $1 over, floor $10K.
export const SALT_CAP_2026 = 40400;
export const SALT_PHASE_THRESHOLD = { single: 500000, mfj: 500000, mfs: 250000, hoh: 500000 };

/**
 * Compute itemized deduction: mortgage interest + capped SALT.
 * Returns the total itemized amount (caller compares vs standard deduction).
 *
 * @param {number} mortgageInterest - annual mortgage interest paid
 * @param {number} propertyTax - annual property tax
 * @param {number} stateTaxPaid - annual state/local income tax paid
 * @param {number} gross - MAGI for SALT phase-down
 * @param {string} status - filing status
 */
export function calcItemized(mortgageInterest, propertyTax, stateTaxPaid, gross = 0, status = "single") {
  const s = normStatus(status);
  const rawSalt = (propertyTax || 0) + (stateTaxPaid || 0);
  let saltCap = SALT_CAP_2026;
  const threshold = SALT_PHASE_THRESHOLD[s];
  if (gross > threshold) {
    saltCap = Math.max(10000, SALT_CAP_2026 - Math.round((gross - threshold) * 0.30));
  }
  const salt = Math.min(rawSalt, saltCap);
  return Math.round((mortgageInterest || 0) + salt);
}

// FICA: Social Security (capped) + Medicare + additional Medicare surtax over the
// statutory threshold. Computed on gross wages (pre-tax 401k/HSA do not reduce SS/Medicare
// for income-tax purposes here; HSA-via-payroll FICA savings are not modeled).
export function ficaTax(gross, status = "single", ssBase = null) {
  if (!ssBase) ssBase = _activeSSBase;
  if (!gross || gross <= 0) return 0;
  const ss = Math.min(gross, ssBase) * SS_RATE;
  const med = gross * MEDICARE_RATE;
  const addl = Math.max(0, gross - ADDL_MEDICARE_THRESHOLD[normStatus(status)]) * ADDL_MEDICARE_RATE;
  return ss + med + addl;
}
