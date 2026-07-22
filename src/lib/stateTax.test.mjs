// State income tax tests. Run: node src/lib/stateTax.test.mjs
import assert from "node:assert";
import { stateTax, STATE_TAX_2026 } from "./stateTax.js";

let pass = 0;
const approx = (a, b, tol = 5) => Math.abs(a - b) <= tol;
function t(name, fn) {
  try { fn(); pass++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + e.message); process.exitCode = 1; }
}

console.log("No-income-tax states");

t("TX returns 0", () => assert.strictEqual(stateTax("TX", 100000), 0));
t("FL returns 0", () => assert.strictEqual(stateTax("FL", 100000), 0));
t("WA returns 0", () => assert.strictEqual(stateTax("WA", 100000), 0));
t("NH returns 0", () => assert.strictEqual(stateTax("NH", 100000), 0));

console.log("Flat rate states");

t("IL 4.95% on $80k", () => assert.ok(approx(stateTax("IL", 80000), 3960)));
t("GA 5.19% on $100k", () => assert.ok(approx(stateTax("GA", 100000), 5190)));
t("AZ 2.50% on $60k", () => assert.ok(approx(stateTax("AZ", 60000), 1500)));
t("PA 3.07% on $75k", () => assert.ok(approx(stateTax("PA", 75000), 2303)));
t("IN 2.95% on $50k", () => assert.ok(approx(stateTax("IN", 50000), 1475)));

console.log("Progressive states");

t("CA $100k single — hits the 9.3% bracket", () => {
  const tax = stateTax("CA", 100000);
  assert.ok(tax > 3000 && tax < 7000, `CA tax on $100k = ${tax}, expected ~$4k-6k range`);
});

t("CA $0 => 0", () => assert.strictEqual(stateTax("CA", 0), 0));

t("NY $100k single — hits 6.25% bracket", () => {
  const tax = stateTax("NY", 100000);
  assert.ok(tax > 3000 && tax < 7000, `NY tax on $100k = ${tax}, expected ~$4k-6k range`);
});

t("NY + NYC local adds extra tax", () => {
  const nyOnly = stateTax("NY", 100000);
  const nyPlusNyc = stateTax("NY", 100000, { isNYC: true, status: "single" });
  assert.ok(nyPlusNyc > nyOnly, `NYC should add tax: ${nyPlusNyc} > ${nyOnly}`);
  const nycPortion = nyPlusNyc - nyOnly;
  assert.ok(nycPortion > 2000 && nycPortion < 5000, `NYC local on $100k = ${nycPortion}, expected ~$3k`);
});

t("NY + NYC mfj uses wider brackets", () => {
  const single = stateTax("NY", 100000, { isNYC: true, status: "single" });
  const mfj = stateTax("NY", 100000, { isNYC: true, status: "mfj" });
  assert.ok(mfj <= single, `MFJ NYC should be <= single: mfj=${mfj}, single=${single}`);
});

console.log("Edge cases");

t("unknown state returns 0", () => assert.strictEqual(stateTax("XX", 100000), 0));
t("null state returns 0", () => assert.strictEqual(stateTax(null, 100000), 0));
t("negative income returns 0", () => assert.strictEqual(stateTax("CA", -50000), 0));

console.log("Coverage check — all 50 states + DC defined");

t("all states present", () => {
  const expected = ["AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT","WA","WI","WV","WY"];
  const missing = expected.filter(s => !STATE_TAX_2026[s]);
  assert.strictEqual(missing.length, 0, `Missing states: ${missing.join(", ")}`);
});

console.log(`\n${pass} checks passed.`);
