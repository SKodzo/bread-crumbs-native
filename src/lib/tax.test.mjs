// Federal tax engine tests. Run: node src/lib/tax.test.mjs
// Node 24 auto-detects the ESM in tax.js, so this imports the real module.
import assert from "node:assert";
import {
  progressiveTax, federalIncomeTax, federalTax, ficaTax, calcItemized, FEDERAL_2026,
} from "./tax.js";

let pass = 0;
const approx = (a, b, tol = 1) => Math.abs(a - b) <= tol;
function t(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("Federal income tax — brackets");

t("single, exactly the 10% ceiling", () => {
  assert.ok(approx(federalIncomeTax(12400, "single"), 1240));
});

t("single, top of 12% bracket", () => {
  // 10%*12400 + 12%*(50400-12400) = 1240 + 4560
  assert.ok(approx(federalIncomeTax(50400, "single"), 5800));
});

t("single, $220k taxable INCLUDES the 32% bracket (the old bug)", () => {
  // 1240 + 4560 + 22%*55300 + 24%*96075 + 32%*18225
  const expected = 1240 + 4560 + 12166 + 23058 + 5832; // 46856
  assert.ok(approx(federalIncomeTax(220000, "single"), expected),
    `got ${federalIncomeTax(220000, "single")}, expected ${expected}`);
});

t("married jointly, $167.8k taxable", () => {
  // 10%*24800 + 12%*76000 + 22%*67000 = 2480 + 9120 + 14740
  assert.ok(approx(federalIncomeTax(167800, "mfj"), 26340));
});

t("head of household, top of 12% bracket", () => {
  // 10%*17700 + 12%*(67450-17700) = 1770 + 5970
  assert.ok(approx(federalIncomeTax(67450, "hoh"), 7740));
});

t("zero / negative income => 0", () => {
  assert.strictEqual(federalIncomeTax(0, "single"), 0);
  assert.strictEqual(federalIncomeTax(-5000, "mfj"), 0);
});

t("unknown filing status falls back to single", () => {
  assert.strictEqual(federalIncomeTax(80000, "bogus"), federalIncomeTax(80000, "single"));
});

console.log("Federal tax — gross with deductions");

t("standard deduction applied (single, $100k gross)", () => {
  // taxable = 100000 - 16100 = 83900
  assert.ok(approx(federalTax({ gross: 100000, status: "single" }), federalIncomeTax(83900, "single")));
});

t("married couple taxed jointly is far less than as a single filer", () => {
  const joint = federalTax({ gross: 180000, status: "mfj" });
  const single = federalTax({ gross: 180000, status: "single" });
  assert.ok(joint < single, "MFJ should owe less than single on the same income");
});

t("itemized deduction used when larger than standard", () => {
  const withItemized = federalTax({ gross: 200000, status: "single", itemized: 40000 });
  const standard = federalTax({ gross: 200000, status: "single" });
  assert.ok(withItemized < standard, "itemizing $40k should lower tax vs $16.1k standard");
});

t("pre-tax contributions lower taxable income", () => {
  const withPretax = federalTax({ gross: 100000, status: "single", pretax: 20000 });
  const without = federalTax({ gross: 100000, status: "single" });
  assert.ok(withPretax < without);
});

console.log("FICA");

t("single at the SS wage base", () => {
  // SS 184500*.062 + Medicare 184500*.0145, no surtax
  assert.ok(approx(ficaTax(184500, "single"), 11439 + 2675.25, 0.5));
});

t("SS caps above the wage base", () => {
  const atCap = ficaTax(184500, "single");
  const above = ficaTax(300000, "single");
  // Above cap, only Medicare (+surtax) grows, SS portion is frozen
  assert.ok(above > atCap);
  assert.ok(approx(above - atCap, (300000 - 184500) * 0.0145 + (300000 - 200000) * 0.009, 1));
});

t("additional Medicare surtax kicks in over threshold (mfj $250k)", () => {
  const surtax = ficaTax(300000, "mfj") - (Math.min(300000, 184500) * 0.062 + 300000 * 0.0145);
  assert.ok(approx(surtax, (300000 - 250000) * 0.009, 1));
});

t("zero income => 0 FICA", () => {
  assert.strictEqual(ficaTax(0, "single"), 0);
});

console.log("Itemized deductions (mortgage interest + SALT)");

t("mortgage interest + property tax under SALT cap", () => {
  // $15K interest + $8K property tax + $5K state tax = $15K + min($13K, $40.4K) = $28K
  assert.ok(approx(calcItemized(15000, 8000, 5000), 28000));
});

t("SALT capped at $40,400", () => {
  // $0 interest + $30K property tax + $20K state = $0 + min($50K, $40.4K) = $40,400
  assert.ok(approx(calcItemized(0, 30000, 20000), 40400));
});

t("SALT phase-down above $500K income", () => {
  // $600K income, single: over by $100K, cap reduced by $100K*0.30 = $30K → cap = $10,400
  const item = calcItemized(20000, 25000, 10000, 600000, "single");
  // SALT = min($35K, $10,400) = $10,400, total = $20K + $10,400 = $30,400
  assert.ok(approx(item, 30400, 10), `got ${item}`);
});

t("SALT phase-down floor is $10,000", () => {
  // $900K income, single: over by $400K, cap reduced by $120K → floor at $10K
  const item = calcItemized(20000, 30000, 20000, 900000, "single");
  // SALT = min($50K, $10K) = $10K, total = $20K + $10K = $30K
  assert.ok(approx(item, 30000, 10), `got ${item}`);
});

t("federalTax uses itemized when larger than standard", () => {
  // Single std = $16,100. If itemized = $40K, should use $40K.
  const withItemized = federalTax({ gross: 200000, status: "single", itemized: 40000 });
  const withStandard = federalTax({ gross: 200000, status: "single" });
  const diff = withStandard - withItemized;
  // Extra $23,900 deduction at ~24% marginal ≈ $5,736 savings
  assert.ok(diff > 4000 && diff < 8000, `tax savings from itemizing = ${diff}`);
});

console.log(`\n${pass} checks passed.`);
