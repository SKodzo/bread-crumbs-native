import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
import { useTheme } from "../lib/theme";
import { mpi, convRate, fmt, fmtK, calcSaleProceeds } from "../lib/math";
import { federalTax, ficaTax, calcItemized, FILING_LABELS } from "../lib/tax";
import { stateTax } from "../lib/stateTax";
import { getClimate, getPropTaxRate, getInsuranceRate, getUtilities, getUtilitiesBreakdown } from "../lib/data";
import { Card, SecTitle, Alert } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function Row({ label, value, valueColor, bold }) {
  const C = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
      <Text style={{ fontSize: 12, color: C.gray700, flex: 1, paddingRight: 8 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: bold ? "900" : "700", color: valueColor || C.charcoal }}>{value}</Text>
    </View>
  );
}

const WAIT_OPTIONS = [
  { label: "1 month",  years: 1/12  },
  { label: "2 months", years: 2/12  },
  { label: "3 months", years: 3/12  },
  { label: "6 months", years: 6/12  },
  { label: "1 year",   years: 1     },
  { label: "2 years",  years: 2     },
  { label: "3 years",  years: 3     },
  { label: "5 years",  years: 5     },
];

const TABS = [
  { id: "summary",    l: "Summary"    },
  { id: "closing",    l: "Closing"    },
  { id: "monthly",    l: "Monthly"    },
  { id: "wait",       l: "Wait vs Buy"},
  { id: "climate",    l: "🌍 Climate" },
  { id: "negotiate",  l: "🤝 Negotiate"},
];

const NEGOTIATE_SECTIONS = [
  { emoji:"💰", title:"Purchase Price", items:[
    "List price is a starting point. Comparable sales (comps) determine market value.",
    "In a buyer's market: offer 3–8% below list. In a hot market: offer at or above list.",
    "Ask your agent to pull comps from the past 90 days within a 0.5-mile radius before writing any offer.",
  ]},
  { emoji:"🏷️", title:"Seller Concessions", items:[
    "You can ask the seller to pay some or all of your closing costs — called a seller concession.",
    "FHA allows up to 6% in seller concessions. Conventional allows 3% (under 10% down) or 9% (10%+ down).",
    "Framing it as 'net price' works better than a discount request — seller nets the same, you get cash at closing.",
  ]},
  { emoji:"🔧", title:"Repairs After Inspection", items:[
    "After the inspection, request repairs, a price reduction, or a repair credit at closing.",
    "Repair credits are often better — you control the contractor and quality.",
    "Focus on health/safety issues (roof, electrical, plumbing, HVAC) — not cosmetic items.",
  ]},
  { emoji:"📅", title:"Closing Date & Possession", items:[
    "Sellers often value a flexible closing date as much as a higher price.",
    "If a seller needs more time, offer a leaseback — they rent from you post-closing.",
    "If you need speed, a 21-day close can beat a higher offer from a buyer needing 45 days.",
  ]},
  { emoji:"🛡️", title:"Home Warranty", items:[
    "Ask the seller to provide a 1-year home warranty ($400–700). Low cost to them, high value to you.",
    "Covers HVAC, plumbing, electrical, and appliances for the first year.",
    "If they decline, ask your agent to cover it as a buyer's closing gift — many do.",
  ]},
  { emoji:"💵", title:"Earnest Money & Rate Buydown", items:[
    "Earnest money (1–3% of price) shows commitment. Make sure your contract has financing, inspection, and appraisal contingencies.",
    "Ask the seller to pay points to buy down your interest rate — most powerful in a high-rate environment.",
    "A 2-1 buydown (rate 2% lower year 1, 1% lower year 2) costs ~2–3% of loan — sellers sometimes pay this to close.",
  ]},
];

export default function ResultsScreen({ data, onBack, onNext, programs: allP = [], rates = {} }) {
  const C = useTheme();
  const [tab, setTab] = useState("summary");
  const [waitIdx, setWaitIdx] = useState(4);
  const waitYr = WAIT_OPTIONS[waitIdx].years;
  const waitLabel = WAIT_OPTIONS[waitIdx].label;
  const d = data;
  const loc = d.locationInfo || {};

  const st  = loc.state || "";
  const ar  = d.loanType === "fha" ? (rates.fha30 || 6.73)
            : d.loanType === "va"  ? (rates.va30  || 6.54)
            : convRate(d.score, d.dpPct, rates.conv30 || 6.51);
  const dp = d.price * d.dpPct / 100;
  const grossMo = Math.round(d.income / 12);

  const progMap = useMemo(() => new Map(allP.map(p => [p.id, p])), [allP]);
  const totalAssist = useMemo(() =>
    (d.programs || []).reduce((s, id) => { const p = progMap.get(id); return p ? s + p.calc(d.price) : s; }, 0),
    [d.programs, d.price, progMap]);

  const fhaUp = d.loanType === "fha" ? (d.price - dp) * 0.0175 : 0;
  const cashNeeded = dp + d.price * 0.03 + 1000 + fhaUp;
  const saleProceeds = d.isFirstTime === false ? calcSaleProceeds(d.currentHomeValue || 0, d.currentMortgageBalance || 0) : 0;
  const assistPrin = Math.max(0, totalAssist - cashNeeded);
  const effLoan = (d.price - dp) - assistPrin;
  const oop = Math.max(0, cashNeeded - totalAssist - saleProceeds);

  let miMo = 0;
  if (d.loanType === "fha") miMo = Math.round(effLoan * 0.0055 / 12);
  else if (d.loanType === "conv") {
    const pr = d.score >= 780 ? .002 : d.score >= 760 ? .003 : d.score >= 740 ? .004 : d.score >= 720 ? .006 : .009;
    miMo = d.dpPct < 20 ? Math.round(effLoan * pr / 12) : 0;
  }

  const piMo  = Math.round(mpi(effLoan, ar, 360));
  const txMo  = Math.round(d.price * getPropTaxRate(st) / 12);
  const insMo = Math.round(d.price * getInsuranceRate(st) / 12);
  const piti  = piMo + txMo + insMo + miMo;
  const hoa   = d.price < 280000 ? 0 : d.price < 340000 ? 55 : d.price < 400000 ? 120 : 175;
  const maint = Math.round(d.price * 0.01 / 12);
  const utils = getUtilities(st);
  const utilsBreakdown = getUtilitiesBreakdown(st, utils);
  const housing = piti + utils + hoa + maint;

  const pretax = (d.k401 || 0) + (d.hsa || 0) + (d.ira || 0);
  const status = d.filingStatus || "single";
  const propTaxYr = d.price * getPropTaxRate(st);
  const annualInterest = Math.round(effLoan * ar / 100);
  const stateTaxYr = stateTax(st, Math.max(0, d.income - pretax));
  const itemized = calcItemized(annualInterest, propTaxYr, stateTaxYr, d.income, status);
  const fedTaxYr = federalTax({ gross: d.income, pretax, status, itemized });
  const ficaYr = ficaTax(d.income, status);
  const taxFICA = Math.round((fedTaxYr + ficaYr + stateTaxYr) / 12);
  const fedTaxNoDeductions = federalTax({ gross: d.income, pretax, status });
  const taxBenefitMo = Math.round((fedTaxNoDeductions - fedTaxYr) / 12);
  const k401Mo = Math.round((d.k401 || 0) / 12);
  const hsaMo  = Math.round((d.hsa  || 0) / 12);
  const iraMo  = Math.round((d.ira  || 0) / 12);
  const rothMo = Math.round((d.roth || 0) / 12);
  const pretaxMo = k401Mo + hsaMo + iraMo;
  const trueTakeHome = grossMo - taxFICA - pretaxMo - rothMo;
  const taxSavMo = Math.round((federalTax({ gross: d.income, status }) + ficaTax(d.income, status) + stateTax(st, d.income)) / 12) - taxFICA;

  const personal = (d.groc || 0) + (d.dining || 0) + (d.ent || 0) + (d.pcare || 0) + (d.car || 0) + (d.debts || 0) + (d.student || 0) + (d.efund || 0) + (d.childcare || 0) + (d.healthcare || 0) + (d.education || 0) + (d.misc || 0);
  const mccMo = (d.programs || []).some(p => p.includes("mcc")) ? Math.round(piMo * 12 * .15 / 12) : 0;
  const currentRent = d.isRenting ? (d.monthlyRent || 0) : 0;
  const remaining = trueTakeHome - housing - personal - currentRent + mccMo;
  const bufCol = remaining >= 500 ? C.green : remaining >= 100 ? C.amber : C.red;
  const bufBg  = remaining >= 500 ? C.greenPale : remaining >= 100 ? C.amberLight : C.redLight;

  const fe = grossMo > 0 ? Math.round(piti / grossMo * 100) : 0;
  const be = grossMo > 0 ? Math.round((piti + (d.debts || 0) + (d.student || 0)) / grossMo * 100) : 0;

  const fprice = Math.round(d.price * Math.pow(1.043, waitYr));
  const fpiti  = Math.round(mpi(fprice * (1 - d.dpPct / 100), ar + waitYr * .1, 360) + fprice * .022 / 12 + fprice * .012 / 12);

  const vtype = remaining >= 500 ? "success" : remaining >= 100 ? "warning" : "danger";

  const climate = getClimate(loc.state);

  const fp1price = Math.round(d.price * Math.pow(1.043, 1));
  const fp1piti  = Math.round(mpi(fp1price * (1 - d.dpPct / 100), ar + .1, 360) + fp1price * .022 / 12 + fp1price * .012 / 12);

  const riskColor = (r) => r === "Extreme" || r === "Very High" ? C.red : r === "High" ? C.amber : C.green;
  const riskBg    = (r) => r === "Extreme" || r === "Very High" ? C.redLight : r === "High" ? C.amberLight : C.greenPale;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      {/* Hero header */}
      <View style={{ backgroundColor: C.green, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
          {loc.city || "Your area"}{loc.state ? ", " + loc.state : ""}  ·  ZIP {loc.zip || "—"}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: "900", color: C.white, marginBottom: 2 }}>{fmt(d.price)}</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 12 }}>
          {d.loanType.toUpperCase()}  ·  {ar.toFixed(2)}%  ·  {fmtK(effLoan)} effective loan
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { l: "To closing",    v: oop === 0 ? "$0 🎉" : fmt(oop) },
            { l: "PITI/mo",       v: fmt(piti) },
            { l: "True monthly",  v: fmt(housing) },
          ].map(m => (
            <View key={m.l} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginBottom: 2, fontWeight: "600" }}>{m.l}</Text>
              <Text style={{ fontSize: 13, fontWeight: "900", color: C.white }}>{m.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Alert banner */}
      <Alert type={vtype}>
        {remaining >= 500 && <Text><Text style={{ fontWeight: "900" }}>✓ Solid picture.</Text>{" "}After all expenses you keep {fmt(remaining)}/mo. Back-end DTI {be}% — lenders approve up to 43%.</Text>}
        {remaining >= 100 && remaining < 500 && <Text><Text style={{ fontWeight: "900" }}>⚠ Tight but workable.</Text>{" "}About {fmt(remaining)}/mo buffer. Stack more programs or lower the price $10–20K.</Text>}
        {remaining < 100 && <Text><Text style={{ fontWeight: "900" }}>✗ Too tight.</Text>{" "}{remaining < 0 ? fmt(Math.abs(remaining)) + " shortfall/mo — " : "Nearly nothing left — "}lower price, add programs, or reduce debts.</Text>}
      </Alert>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ paddingVertical: 4, gap: 6 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: 99,
              borderWidth: 1.5,
              borderColor: tab === t.id ? C.green : C.gray300,
              backgroundColor: tab === t.id ? C.green : C.card,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: tab === t.id ? C.white : C.gray700 }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── SUMMARY TAB ── */}
      {tab === "summary" && (
        <Card>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {[
              { l: "Gross monthly",  v: fmt(grossMo),     sub: fmtK(d.income) + "/yr",         c: C.charcoal,  bg: C.gray100 },
              { l: "Take-home",      v: fmt(trueTakeHome), sub: "after tax + retirement",        c: C.green,     bg: C.greenPale },
              { l: "Housing cost",   v: fmt(housing),     sub: Math.round(housing/grossMo*100) + "% of gross", c: Math.round(housing/grossMo*100) > 35 ? C.red : C.green, bg: Math.round(housing/grossMo*100) > 35 ? C.redLight : C.greenPale },
              { l: "Buffer",         v: remaining >= 0 ? fmt(remaining) : "- " + fmt(Math.abs(remaining)), sub: remaining < 0 ? "shortfall" : "left over", c: bufCol, bg: bufBg },
            ].map(s => (
              <View key={s.l} style={{ width: "47.5%", backgroundColor: s.bg, borderRadius: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, color: C.gray500, fontWeight: "600", marginBottom: 2 }}>{s.l}</Text>
                <Text style={{ fontSize: 16, fontWeight: "900", color: s.c }}>{s.v}</Text>
                <Text style={{ fontSize: 10, color: C.gray500, marginTop: 2 }}>{s.sub}</Text>
              </View>
            ))}
          </View>
          <Row label="Front-end DTI" value={fe + "% " + (fe <= 28 ? "✓" : "⚠")} valueColor={fe <= 28 ? C.green : C.red} />
          <Row label="Back-end DTI"  value={be + "% " + (be <= 43 ? "✓" : "✗")} valueColor={be <= 43 ? C.green : C.red} />
          <Row label="Retirement savings" value={fmt(k401Mo + rothMo + hsaMo + iraMo) + "/mo"} valueColor={C.amber} />
          <Row label="Tax savings (pre-tax)" value={"+ " + fmt(taxSavMo) + "/mo"} valueColor={C.green} />
          {mccMo > 0 && <Row label="MCC tax credit" value={"+ " + fmt(mccMo * 12) + "/yr"} valueColor={C.green} />}
          {totalAssist > 0 && <Row label="Total assistance stacked" value={fmt(totalAssist)} valueColor={C.green} />}
          {(d.programs || []).length > 0 && (
            <View style={{ marginTop: 10, backgroundColor: C.greenPale, borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: C.green, marginBottom: 4 }}>Selected programs</Text>
              <Text style={{ fontSize: 11, color: C.greenMid, lineHeight: 16 }}>
                {(d.programs || []).map(id => allP.find(p => p.id === id)?.name || id).join("  ·  ")}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* ── CLOSING TAB ── */}
      {tab === "closing" && d.isFirstTime === false && saleProceeds > 0 && (
        <Card>
          <SecTitle>Home sale proceeds</SecTitle>
          <Row label="Current home value" value={fmt(d.currentHomeValue || 0)} />
          <Row label="Agent commission (~6%)" value={"- " + fmt((d.currentHomeValue || 0) * 0.06)} valueColor={C.red} />
          <Row label="Seller closing costs (~2%)" value={"- " + fmt((d.currentHomeValue || 0) * 0.02)} valueColor={C.red} />
          <Row label="Mortgage payoff" value={"- " + fmt(d.currentMortgageBalance || 0)} valueColor={C.red} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.greenLight, borderRadius: 10, padding: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: C.green }}>Net proceeds</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: C.green }}>{fmt(saleProceeds)}</Text>
          </View>
          {(d.currentHomeValue || 0) > 0 && (
            <Alert type="info">If you've lived in this home 2+ of the last 5 years, up to {d.householdSize > 1 ? "$500K" : "$250K"} in gains are tax-free (IRS Section 121).</Alert>
          )}
        </Card>
      )}

      {tab === "closing" && (
        <Card>
          <SecTitle>Loan flow</SecTitle>
          <View style={{ borderWidth: 1, borderColor: C.gray300, borderRadius: 10, padding: 12, marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: C.gray500, fontWeight: "600" }}>Purchase price</Text>
            <Text style={{ fontSize: 20, fontWeight: "900", color: C.charcoal }}>{fmt(d.price)}</Text>
          </View>
          <Text style={{ fontSize: 12, color: C.gray500, paddingVertical: 4, paddingLeft: 8 }}>↓ Down payment ({d.dpPct}%): <Text style={{ fontWeight: "700" }}>{fmt(dp)}</Text></Text>
          <View style={{ borderWidth: 1, borderColor: C.gray300, borderRadius: 10, padding: 12, marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: C.gray500, fontWeight: "600" }}>Base loan</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: C.charcoal }}>{fmt(d.price - dp)}</Text>
            <Text style={{ fontSize: 11, color: C.gray500 }}>What your lender approves against</Text>
          </View>
          {totalAssist > 0 && (
            <>
              <Text style={{ fontSize: 12, color: C.gray500, paddingVertical: 4, paddingLeft: 8 }}>↓ Assistance covers cash at closing: <Text style={{ fontWeight: "700", color: C.green }}>- {fmt(Math.min(totalAssist, cashNeeded))}</Text></Text>
              {assistPrin > 0 && <Text style={{ fontSize: 12, color: C.gray500, paddingVertical: 4, paddingLeft: 8 }}>↓ Surplus reduces principal: <Text style={{ fontWeight: "700", color: C.green }}>- {fmt(assistPrin)}</Text></Text>}
            </>
          )}
          <View style={{ borderWidth: assistPrin > 0 ? 2 : 1, borderColor: assistPrin > 0 ? C.green : C.gray300, borderRadius: 10, padding: 12, backgroundColor: assistPrin > 0 ? C.greenPale : C.card, marginBottom: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: assistPrin > 0 ? C.green : C.gray500, marginBottom: 2 }}>✓ Effective loan — P&I is based on this</Text>
            <Text style={{ fontSize: 24, fontWeight: "900", color: assistPrin > 0 ? C.green : C.charcoal }}>{fmt(effLoan)}</Text>
            {assistPrin > 0 && <Text style={{ fontSize: 11, color: C.greenMid }}>Reduced from {fmt(d.price - dp)} by {fmt(assistPrin)} principal buydown</Text>}
          </View>
          <Row label="Down payment"                   value={fmt(dp)} />
          {fhaUp > 0 && <Row label="FHA upfront MIP (1.75%)" value={fmt(fhaUp)} valueColor={C.red} />}
          <Row label="Lender fees & title (~2%)"      value={fmt(d.price * .02)} />
          <Row label="Prepaid taxes & insurance (~1%)" value={fmt(d.price * .01)} />
          <Row label="Inspection + appraisal"         value="$1,000" />
          <Row label="Total cash needed" value={fmt(cashNeeded)} bold />
          {totalAssist > 0 && <Row label="Assistance applied" value={"- " + fmt(Math.min(totalAssist, cashNeeded))} valueColor={C.green} />}
          {assistPrin > 0 && <Row label="Principal buydown" value={"- " + fmt(assistPrin)} valueColor={C.green} />}
          {saleProceeds > 0 && <Row label="Home sale proceeds" value={"- " + fmt(Math.min(saleProceeds, Math.max(0, cashNeeded - totalAssist)))} valueColor={C.green} />}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: oop === 0 ? C.greenLight : oop < 10000 ? C.amberLight : C.redLight, borderRadius: 10, padding: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: oop === 0 ? C.green : oop < 10000 ? C.amber : C.red }}>You bring to closing</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: oop === 0 ? C.green : oop < 10000 ? C.amber : C.red }}>{oop === 0 ? "$0 🎉" : fmt(oop)}</Text>
          </View>
        </Card>
      )}

      {/* ── MONTHLY TAB ── */}
      {tab === "monthly" && (
        <Card>
          <SecTitle>Paycheck flow</SecTitle>
          {[
            { l: "Gross monthly",        v: fmt(grossMo),       c: C.green },
            k401Mo > 0 ? { l: "401(k) pre-tax",      v: "- " + fmt(k401Mo), c: C.red } : null,
            hsaMo  > 0 ? { l: "HSA pre-tax",          v: "- " + fmt(hsaMo),  c: C.red } : null,
            iraMo  > 0 ? { l: "IRA pre-tax",           v: "- " + fmt(iraMo),  c: C.red } : null,
            { l: "Federal" + (st && stateTaxYr > 0 ? " + " + st + " state" : "") + " + FICA tax", v: "- " + fmt(taxFICA), c: C.red },
          ].filter(Boolean).map((r, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>{r.l}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: r.c }}>{r.v}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.gray300, marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: "800", color: C.green }}>Net take-home</Text>
            <Text style={{ fontSize: 13, fontWeight: "800", color: C.green }}>{fmt(grossMo - taxFICA - pretaxMo)}/mo</Text>
          </View>
          {rothMo > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
              <Text style={{ fontSize: 12, color: C.gray700 }}>Roth IRA (post-tax)</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.red }}>- {fmt(rothMo)}/mo</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.gray300, marginTop: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: C.green }}>True spendable take-home</Text>
            <Text style={{ fontSize: 14, fontWeight: "900", color: C.green }}>{fmt(trueTakeHome)}/mo</Text>
          </View>
          {[
            [`P&I (${fmt(effLoan)} @ ${ar.toFixed(2)}%)`, piMo],
            [`Property tax (${(getPropTaxRate(st)*100).toFixed(2)}% est.)`, txMo],
            [`Insurance (${(getInsuranceRate(st)*100).toFixed(2)}% est.)`, insMo],
            miMo > 0  ? ["PMI / MIP", miMo]         : null,
            [`Utilities — ${st || "est."} avg`, utils],
            hoa > 0   ? ["HOA", hoa]                 : null,
            ["Maintenance reserve (1%/yr)", maint],
            (d.groc  || 0) > 0 ? ["Groceries", d.groc]         : null,
            (d.dining|| 0) > 0 ? ["Dining out", d.dining]       : null,
            (d.ent   || 0) > 0 ? ["Entertainment", d.ent]       : null,
            (d.pcare || 0) > 0 ? ["Personal care", d.pcare]     : null,
            (d.car   || 0) > 0 ? ["Car", d.car]                 : null,
            (d.debts || 0) > 0 ? ["Other debts", d.debts]       : null,
            (d.student||0) > 0 ? ["Student loans", d.student]   : null,
            (d.efund      || 0) > 0 ? ["Emergency fund", d.efund]       : null,
            (d.childcare  || 0) > 0 ? ["Child care", d.childcare]        : null,
            (d.healthcare || 0) > 0 ? ["Health care", d.healthcare]      : null,
            (d.education  || 0) > 0 ? ["Education", d.education]         : null,
            (d.misc       || 0) > 0 ? ["Miscellaneous", d.misc]          : null,
            d.isRenting && currentRent > 0 ? ["Current rent (while renting)", currentRent] : null,
            k401Mo + rothMo + hsaMo + iraMo > 0 ? ["Retirement (all)", k401Mo + rothMo + hsaMo + iraMo] : null,
          ].filter(Boolean).map((r, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
              <Text style={{ fontSize: 12, color: C.text }}>{r[0]}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.text }}>{fmt(r[1])}/mo</Text>
            </View>
          ))}
          {/* Utilities breakdown */}
          <View style={{ backgroundColor: C.gray100, borderRadius: 8, padding: 10, marginTop: 4, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Utilities estimate includes
            </Text>
            {utilsBreakdown.map(u => (
              <View key={u.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: C.text }}>{u.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: C.text }}>{fmt(u.amount)}/mo</Text>
              </View>
            ))}
            <Text style={{ fontSize: 9, color: C.gray500, marginTop: 4 }}>
              Based on {st ? st + " state" : "national"} average · EIA residential data
            </Text>
          </View>
          {mccMo > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.gray100 }}>
              <Text style={{ fontSize: 12, color: C.green }}>MCC credit (at tax time)</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.green }}>+ {fmt(mccMo * 12)}/yr</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 2, borderTopColor: C.charcoal, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: bufCol }}>Monthly buffer</Text>
            <Text style={{ fontSize: 14, fontWeight: "900", color: bufCol }}>{remaining >= 0 ? fmt(remaining) : "⚠ - " + fmt(Math.abs(remaining))}</Text>
          </View>
        </Card>
      )}

      {/* ── WAIT VS BUY TAB ── */}
      {tab === "wait" && (
        <Card>
          <SecTitle>What if I wait?</SecTitle>
          <Text style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>Based on 4.3%/yr average appreciation · +0.1% rate/yr</Text>
          {/* Wait slider */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.charcoal }}>Time to wait</Text>
              <View style={{ backgroundColor: C.green, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: "900", color: C.white }}>{waitLabel}</Text>
              </View>
            </View>
            <Slider
              style={{ width: "100%", height: 36 }}
              minimumValue={0}
              maximumValue={WAIT_OPTIONS.length - 1}
              step={1}
              value={waitIdx}
              onValueChange={v => setWaitIdx(Math.round(v))}
              minimumTrackTintColor={C.green}
              maximumTrackTintColor={C.gray300}
              thumbTintColor={C.green}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: -6 }}>
              {WAIT_OPTIONS.map((o, i) => (
                <Text key={i} style={{ fontSize: 8, color: i === waitIdx ? C.green : C.gray500, fontWeight: i === waitIdx ? "800" : "400", textAlign: "center" }}>
                  {o.label.replace(" ", "\n")}
                </Text>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: C.greenLight, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: C.green }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.green, marginBottom: 3 }}>BUY NOW</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: C.green }}>{fmt(d.price)}</Text>
              <Text style={{ fontSize: 10, color: C.greenMid, marginTop: 4 }}>P&I: {fmt(piMo)}/mo</Text>
              <Text style={{ fontSize: 10, color: C.greenMid }}>Rate: {ar.toFixed(2)}%</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: C.redLight, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: C.red }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: C.red, marginBottom: 3 }}>WAIT {waitLabel.toUpperCase()}</Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: C.red }}>{fmt(fprice)}</Text>
              <Text style={{ fontSize: 10, color: C.red, marginTop: 4 }}>P&I: {fmt(fpiti)}/mo</Text>
              <Text style={{ fontSize: 10, color: C.red }}>Rate: ~{(ar + waitYr * .1).toFixed(2)}%</Text>
            </View>
          </View>
          <Row label="Price increase"          value={"+ " + fmt(fprice - d.price)}     valueColor={C.red} />
          <Row label="Monthly P&I increase"    value={"+ " + fmt(fpiti - piMo) + "/mo"} valueColor={C.red} />
          {d.isFirstTime === false ? (
            <>
              <Row label={`Current mortgage while waiting (${fmt(d.currentMortgagePayment || 0)}/mo)`} value={"- " + fmt(Math.round(waitYr * 12 * (d.currentMortgagePayment || 0)))} valueColor={C.red} />
              <Row label="Equity growth in current home (~4.3%/yr)" value={"+ " + fmt(Math.round((d.currentHomeValue || 0) * 0.043 * waitYr))} valueColor={C.green} />
            </>
          ) : d.isRenting ? (
              <Row label={`Your rent paid while waiting (${fmt(d.monthlyRent)}/mo)`} value={"- " + fmt(Math.round(waitYr * 12 * (d.monthlyRent || 0)))} valueColor={C.red} />
          ) : null}
          <Row label="Equity built buying now" value={"+ " + fmtK(Math.round(piMo * waitYr * 12 * .25))} valueColor={C.green} />
          <Alert type={fpiti - piMo > 200 ? "danger" : "warning"}>
            <Text>Waiting {waitLabel} could cost <Text style={{ fontWeight: "900" }}>{fmt(fpiti - piMo)}/mo more</Text> in payments and <Text style={{ fontWeight: "900" }}>{fmt(fprice - d.price)}</Text> more in price.</Text>
          </Alert>
        </Card>
      )}

      {/* ── CLIMATE TAB ── */}
      {tab === "climate" && (
        <View>
          {climate ? (
            <View>
              <Alert type="warning">
                <Text>Climate risk directly affects your insurance costs, mortgage qualification, and resale value. Always get flood and windstorm insurance quotes <Text style={{ fontWeight: "900" }}>before making an offer</Text> — in some ZIP codes the cost makes an otherwise affordable home unaffordable.</Text>
              </Alert>
              <View style={{ height: 10 }} />
              {Object.entries(climate)
                .filter(([, v]) => v.risk !== "None")
                .map(([key, val]) => (
                  <View key={key} style={{ backgroundColor: riskBg(val.risk), borderRadius: 12, padding: 14, marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: riskColor(val.risk) }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} Risk
                      </Text>
                      <View style={{ backgroundColor: riskColor(val.risk), borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: C.white }}>{val.risk}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: C.gray700, lineHeight: 18 }}>{val.detail}</Text>
                  </View>
                ))}
              <Alert type="info">
                <Text>Verify flood zone at <Text style={{ fontWeight: "700" }}>msc.fema.gov</Text> for ZIP {loc.zip || "your area"} before purchasing.</Text>
              </Alert>
            </View>
          ) : (
            <Alert type="info">
              <Text>Climate risk data isn't available for <Text style={{ fontWeight: "700" }}>{loc.state || "your state"}</Text> yet. Check msc.fema.gov for flood maps and your state's emergency management site for hazard data.</Text>
            </Alert>
          )}
        </View>
      )}

      {/* ── NEGOTIATE TAB ── */}
      {tab === "negotiate" && (
        <View>
          <Alert type="info">
            <Text>Everything below is negotiable — most buyers leave money on the table by not asking. Your agent works for you; these are the levers you control.</Text>
          </Alert>
          <View style={{ height: 8 }} />
          {NEGOTIATE_SECTIONS.map(sec => (
            <Card key={sec.title}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 20 }}>{sec.emoji}</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal }}>{sec.title}</Text>
              </View>
              {sec.items.map((item, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 5, borderBottomWidth: i < sec.items.length - 1 ? 0.5 : 0, borderBottomColor: C.gray100 }}>
                  <Text style={{ color: C.green, fontWeight: "900", flexShrink: 0, marginTop: 1 }}>·</Text>
                  <Text style={{ fontSize: 12, color: C.charcoal, lineHeight: 18, flex: 1 }}>{item}</Text>
                </View>
              ))}
            </Card>
          ))}
          {d.isFirstTime === false && (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 20 }}>🏡</Text>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.charcoal }}>Contingent offers</Text>
              </View>
              {[
                "A sale contingency makes your offer conditional on selling your current home — protects you but weakens your bid in competitive markets.",
                "To strengthen a contingent offer: get your home under contract first, show proof of listing, or offer a shorter contingency window (30–45 days).",
                "Some sellers won't accept contingent offers at all. In that case, consider a bridge loan or selling first with a leaseback arrangement.",
                "If you sell first, negotiate a post-closing occupancy (leaseback) of 30–60 days so you can close on the new home without moving twice.",
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 5, borderBottomWidth: i < 3 ? 0.5 : 0, borderBottomColor: C.gray100 }}>
                  <Text style={{ color: C.green, fontWeight: "900", flexShrink: 0, marginTop: 1 }}>·</Text>
                  <Text style={{ fontSize: 12, color: C.charcoal, lineHeight: 18, flex: 1 }}>{item}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300 }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} style={{ flex: 2, borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.green }} activeOpacity={0.8}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.white }}>Action Plan →</Text>
        </TouchableOpacity>
      </View>

      <GlossaryBar keys={["PITI", "DTI", "PMI", "MIP", "MCC", "HOA"]} />

    </ScrollView>
  );
}
