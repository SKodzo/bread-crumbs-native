import { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../lib/theme";
import { fmt } from "../lib/math";
import { Card, SecTitle } from "../components/UI";
import GlossaryBar from "../components/GlossaryBar";

function generateChecklist(data, loc) {
  const { income, score, dpPct, price, debts, programs: selP, isFirstTime } = data;
  const repeat = isFirstTime === false;
  const { state = "", city = "" } = loc || {};
  const hasHarvey   = selP.includes("harvey");
  const hasTSAHC    = selP.includes("tsahc") || selP.includes("tdhca");
  const hasCityProg = selP.some(p => ["hap","dhap","sa_nhsd","ahfc","invest_atl","chicago_dpa","phoenix_dpa","nyc_homefirst","lahd_dpa"].includes(p));
  const hasMCC      = selP.some(p => p.includes("mcc"));
  const dp          = price * dpPct / 100;
  const needsScore  = score < 680;
  const needsDebt   = debts > 500;
  const grossMo     = Math.round(income / 12);
  const cityLabel   = city || (state ? state + " area" : "your area");

  return {
    "3mo": { label: "3 months out", color: "#DC2626", bg: "#FEE2E2", emoji: "🚀", desc: "Final sprint — every week counts.", tasks: [
      // Loan & Lender
      { id: "3_1",   cat: "🏦 Loan",        text: `Get fully pre-approved (not just pre-qualified) with a ${hasTSAHC ? "TSAHC-approved" : "HUD-approved"} lender — hard pull required`, urgent: true },
      { id: "3_2",   cat: "🏦 Loan",        text: "Ask your lender about a rate lock — rates can move daily. Locks typically cost 0.25–0.5% and last 30–60 days", urgent: true },
      { id: "3_3",   cat: "🏦 Loan",        text: "Shop at least 3 lenders and compare Loan Estimates side by side — same loan, different fees can cost you thousands", urgent: true },
      { id: "3_dpa", cat: "💰 DPA",         text: "Confirm your lender is approved for your DPA programs — not all lenders participate. Get it in writing", urgent: true },
      ...(hasMCC     ? [{ id: "3_m1", cat: "💰 MCC", text: "Ask your lender to apply the MCC before closing — the certificate must be issued at or before loan origination", urgent: true }] : []),
      // Documents
      { id: "3_4",   cat: "🗂️ Documents",  text: "Gather: 2 years W-2s, 2 years federal tax returns (all pages + schedules), 30 days pay stubs", urgent: true },
      { id: "3_5",   cat: "🗂️ Documents",  text: "Gather: 3 months bank statements (all pages, all accounts), most recent 401(k)/investment statements", urgent: true },
      { id: "3_6",   cat: "🗂️ Documents",  text: "Prepare a gift letter if any down payment funds are a gift — lenders require the donor to sign a specific form", urgent: false },
      { id: "3_doc3",cat: "🗂️ Documents",  text: "Prepare a written explanation for any large deposits over $500 in the last 60 days — underwriters will ask", urgent: false },
      // Education & Counseling (first-time buyers)
      ...(!repeat ? [
        { id: "3_7",   cat: "📋 Education",   text: "Complete your 8-hour HUD-approved homebuyer education course — required for most DPA programs", urgent: true },
        { id: "3_8",   cat: "📋 Education",   text: "Schedule your one-on-one HUD housing counseling session (1-800-569-4287 for referral) — required for many programs", urgent: true },
      ] : []),
      // Selling your current home (repeat buyers)
      ...(repeat ? [
        { id: "3_s1",  cat: "🏡 Selling",     text: "Get a Comparative Market Analysis (CMA) on your current home from 2–3 agents to set a realistic sale price", urgent: true },
        { id: "3_s2",  cat: "🏡 Selling",     text: "Interview 2–3 listing agents — compare commission rates, marketing plans, and recent sales in your neighborhood", urgent: true },
        { id: "3_s3",  cat: "🏡 Selling",     text: "Prep your home for sale: declutter, deep clean, minor repairs, fresh paint on scuffed walls — staging raises offers 5–10%", urgent: false },
        { id: "3_s4",  cat: "🏡 Selling",     text: "Coordinate your sale and purchase closing dates — aim for same-day or back-to-back closings to minimize the gap", urgent: true },
        { id: "3_s5",  cat: "💰 Equity",      text: "Confirm capital gains exclusion eligibility: you must have lived in the home 2 of the last 5 years for up to $250K ($500K married) tax-free", urgent: false },
      ] : []),
      // Finances
      { id: "3_9",   cat: "💵 Finances",    text: `Verify ${fmt(dp + price * .03)} in liquid savings is accessible, seasoned (60+ days in account), and untouched`, urgent: true },
      { id: "3_10",  cat: "💵 Finances",    text: "Do NOT move large sums between accounts, close accounts, or co-sign any loans — underwriting snapshots your finances at application", urgent: true },
      { id: "3_11",  cat: "💵 Finances",    text: "Stop all new credit applications immediately — each hard pull can lower your score 5–10 pts", urgent: true },
      { id: "3_12",  cat: "💵 Finances",    text: `Keep credit card balances under 10% of their limits — every extra point of utilization counts at ${score} score`, urgent: false },
      // Search & Agent
      { id: "3_13",  cat: "🔍 Search",      text: "Hire a buyer's real estate agent — buyer's agents are paid by the seller and cost you nothing out of pocket", urgent: true },
      { id: "3_14",  cat: "🔍 Search",      text: `Begin active home search in ${cityLabel} — schedule at least 2–3 tours per week to move fast when you find the right home`, urgent: false },
      { id: "3_15",  cat: "🔍 Search",      text: "Attend open houses to calibrate — you need to see 10+ homes before you can evaluate one accurately", urgent: false },
      { id: "3_16",  cat: "🔍 Search",      text: "Set up automated MLS alerts with your agent for your target ZIP, price range, and bed/bath criteria", urgent: false },
      // Offer & Contract
      { id: "3_17",  cat: "📝 Offer",       text: "Have your agent pull comparable sales (comps) from the past 90 days within 0.5 miles before writing any offer", urgent: false },
      { id: "3_18",  cat: "📝 Offer",       text: "Include a financing contingency, inspection contingency, and appraisal contingency in every offer — do not waive these without legal advice", urgent: false },
      { id: "3_19",  cat: "📝 Offer",       text: "Understand your earnest money deposit (1–3% of price) — it's at risk if you back out without a contingency", urgent: false },
      // Inspection & Title
      { id: "3_20",  cat: "🏠 Inspection",  text: "Schedule a full general home inspection within 3 business days of going under contract — do not skip this", urgent: true },
      { id: "3_pest",cat: "🏠 Inspection",  text: "Schedule a separate termite/WDO inspection — required for FHA and VA loans, and highly recommended for all buyers", urgent: true },
      { id: "3_21",  cat: "🏠 Inspection",  text: "Consider a sewer scope ($100–200) for homes over 20 years old — a collapsed sewer line costs $10K+ to replace", urgent: false },
      { id: "3_22",  cat: "🏠 Inspection",  text: "If issues are found: negotiate a repair credit (better than asking seller to fix — you control contractor quality)", urgent: false },
      { id: "3_title",cat: "📜 Title",      text: "Order a title search and title insurance — your lender requires lender's title insurance; add owner's title insurance for yourself", urgent: true },
      { id: "3_23",  cat: "📜 Title",       text: "Review the title commitment for liens, easements, or deed restrictions — ask your agent or attorney to explain anything unclear", urgent: false },
      // Insurance
      { id: "3_24",  cat: "🛡️ Insurance",   text: "Get at least 3 homeowners insurance quotes before closing — rates vary widely. Lender requires proof of insurance at closing", urgent: true },
      { id: "3_25",  cat: "🛡️ Insurance",   text: "Check FEMA flood maps for your property (msc.fema.gov) — if it's in a flood zone, flood insurance is required and can be expensive", urgent: true },
      // Program-specific
      ...(hasHarvey  ? [
        { id: "3_h1", cat: "💰 Harvey HbAP 2.0", text: "Call 832-393-0550 NOW for your Harvey HbAP 2.0 Applicant ID — slots are limited and first-come, first-served", urgent: true },
        { id: "3_h2", cat: "💰 Harvey",           text: "AVOID closing June 18–July 11 (Houston fiscal year close — no program funds are wired during this window)", urgent: true },
      ] : []),
      ...(hasCityProg ? [{ id: "3_c1", cat: "💰 City Program", text: "Submit your complete city/county DPA application with ALL required documents — incomplete applications are rejected without review", urgent: true }] : []),
      // Closing prep
      { id: "3_26",  cat: "🏁 Closing",     text: "Review your Closing Disclosure (CD) 3 business days before closing — compare line by line to your Loan Estimate", urgent: true },
      { id: "3_27",  cat: "🏁 Closing",     text: "Do a final walkthrough 24 hours before closing to confirm agreed repairs were completed and the property is in expected condition", urgent: true },
      { id: "3_28",  cat: "🏁 Closing",     text: "Bring cashier's check or wire funds for closing costs — personal checks are rarely accepted. Confirm wire instructions via phone to prevent fraud", urgent: true },
      { id: "3_29",  cat: "🏁 Closing",     text: "Bring government-issued photo ID for all buyers on the loan to the closing table", urgent: false },
      { id: "3_rate",cat: "📉 Rate",         text: "Ask about a 2-1 buydown — seller pays 2–3% of loan to reduce your rate by 2% in year 1 and 1% in year 2. Powerful in a high-rate environment", urgent: false },
      { id: "3_hmst",cat: "🏡 Homestead",    text: `File your homestead exemption with the ${cityLabel} county appraisal district within 30 days of closing — ${state === "TX" ? "in Texas this removes $100K from your taxable value, saving $2,000+/yr. " : ""}Most states reduce your property tax bill significantly. Deadline is typically April 30 for the current tax year`, urgent: true },
    ]},

    "6mo": { label: "6 months out", color: "#E8A020", bg: "#FEF3DC", emoji: "🏗️", desc: "Building your foundation.", tasks: [
      // Credit
      { id: "6_1",  cat: "💳 Credit",    text: needsScore ? `Your ${score} score needs immediate attention — pay all credit cards below 30% utilization right now` : `Your ${score} score is solid — set up autopay on ALL accounts to protect it`, urgent: needsScore },
      { id: "6_2",  cat: "💳 Credit",    text: "Pull your free credit reports at AnnualCreditReport.com — dispute every error on all 3 bureaus (Experian, Equifax, TransUnion)", urgent: true },
      { id: "6_3",  cat: "💳 Credit",    text: "Do NOT open new credit, finance a vehicle, or co-sign anything — new accounts lower your average account age and trigger hard pulls", urgent: true },
      { id: "6_4",  cat: "💳 Credit",    text: "Do NOT close old credit card accounts — closing reduces your total available credit and hurts your utilization ratio", urgent: true },
      { id: "6_5",  cat: "💳 Credit",    text: "Pay every bill on time, every month — a single 30-day late payment can drop your score 60–110 points overnight", urgent: true },
      ...(needsScore ? [
        { id: "6_cr1", cat: "💳 Credit Repair", text: `Target score: ${score < 580 ? 620 : score < 620 ? 640 : 680}+ by month 3. Track monthly at Credit Karma or Experian (free)`, urgent: true },
        { id: "6_cr2", cat: "💳 Credit Repair", text: "Ask a family member with excellent credit to add you as an authorized user on their oldest card — can add 20–40 pts in 60 days", urgent: false },
      ] : []),
      // Savings
      { id: "6_6",  cat: "💵 Savings",   text: `Set up an automatic monthly transfer to a dedicated high-yield savings account (HYSA) — target ${fmt(dp + price * .03)} for down payment + closing`, urgent: true },
      { id: "6_7",  cat: "💵 Savings",   text: `Build a separate 3-month emergency reserve (${fmt(grossMo * .4 * 3)}) — do not commingle this with your down payment fund`, urgent: false },
      { id: "6_8",  cat: "💵 Savings",   text: "Avoid large cash gifts not yet seasoned — lenders require 60+ days of bank statements. Any deposit over $500 needs a paper trail", urgent: false },
      { id: "6_9",  cat: "💵 Savings",   text: "Cut non-essential subscriptions and redirect that cash to savings — every $100/mo saved is $600 more by closing day", urgent: false },
      // Debts
      ...(needsDebt ? [{ id: "6_d1", cat: "💳 Debts", text: `Pay down at least ${fmt(debts - 300)}/mo of your ${fmt(debts)}/mo in non-housing debts to bring your back-end DTI within lender limits`, urgent: true }] : []),
      { id: "6_10", cat: "💳 Debts",     text: "Do NOT take on any new recurring debt — car loans, personal loans, or buy-now-pay-later all count toward your DTI at application", urgent: true },
      // Program preparation
      ...(hasHarvey ? [{ id: "6_h1", cat: "💰 Harvey", text: "Verify your 2017 Houston address eligibility at the HoustontX.gov mapping tool — do this early, it can take time to resolve disputes", urgent: true }] : []),
      ...(hasTSAHC  ? [{ id: "6_s1", cat: "💰 State",  text: "Confirm your income is within TSAHC/TDHCA county-specific limits — income limits are updated annually", urgent: false }] : []),
      { id: "6_11", cat: "💰 Programs",  text: "Contact your state Housing Finance Agency to confirm program availability and get lender referrals — some programs have waitlists", urgent: false },
      // Education (first-time buyers)
      ...(!repeat ? [
        { id: "6_12", cat: "📋 Education", text: "Register for your HUD-approved homebuyer education course — many programs require a certificate before closing and courses fill up", urgent: false },
        { id: "6_13", cat: "📋 Education", text: "Attend a free homebuyer workshop in your area — many nonprofits (NeighborWorks, NACA, Urban League) offer free sessions", urgent: false },
      ] : []),
      // Selling prep (repeat buyers)
      ...(repeat ? [
        { id: "6_s1r", cat: "🏡 Selling", text: "Research your local market conditions — is it a buyer's or seller's market? This determines your pricing and negotiation strategy", urgent: false },
        { id: "6_s2r", cat: "🏡 Selling", text: "Get quotes for any deferred maintenance on your current home — fixing before listing typically returns 150-200% on cosmetic improvements", urgent: false },
        { id: "6_s3r", cat: "💰 Equity",  text: "If buying before selling: research bridge loans and HELOC options — your current equity can fund the new down payment temporarily", urgent: false },
        { id: "6_s4r", cat: "📦 Moving",  text: "Start budgeting for transition costs — temporary housing ($3-6K), storage ($200-400/mo), and double utilities if you'll overlap", urgent: false },
      ] : []),
      // Loan shopping
      { id: "6_14", cat: "🏦 Loan",      text: "Get a soft-pull pre-qualification from 2–3 lenders to understand your range without damaging your credit score", urgent: false },
      { id: "6_15", cat: "🏦 Loan",      text: "Understand the difference between pre-qualification (soft estimate) and pre-approval (verified, lender-committed) — sellers require pre-approval", urgent: false },
      { id: "6_16", cat: "🏦 Loan",      text: "Research FHA vs. Conventional vs. VA (if eligible) — each has different down payment, PMI, and qualification thresholds for your profile", urgent: false },
      // Documents
      { id: "6_17", cat: "🗂️ Documents", text: "Start organizing your document folder now: 2 years tax returns, 2 years W-2s, last 2 pay stubs, last 3 bank statements", urgent: false },
      { id: "6_18", cat: "🗂️ Documents", text: "If self-employed: gather 2 years business returns, year-to-date P&L, and business bank statements — underwriting is stricter for 1099 income", urgent: false },
      // Research
      { id: "6_19", cat: "🏠 Research",  text: `Identify your top 2–3 target neighborhoods in ${cityLabel} — drive them at different times of day and on weekends`, urgent: false },
      { id: "6_20", cat: "🏠 Research",  text: "Study property tax rates by ZIP code — taxes can vary 2× between adjacent neighborhoods and significantly impact your monthly PITI", urgent: false },
      { id: "6_21", cat: "🏠 Research",  text: "Research HOA fees for any condo or planned community — monthly HOA counts against your DTI and can be $100–500+/mo", urgent: false },
      { id: "6_22", cat: "🏠 Research",  text: `Check FEMA flood maps (msc.fema.gov) for target neighborhoods in ${cityLabel} — flood insurance adds $1,000–3,000+/yr in certain zones`, urgent: false },
      { id: "6_23", cat: "🏦 Loan",      text: "Ask about a seller-paid rate buydown — in a slower market, sellers often pay 1–3% of loan to buy down your interest rate at closing", urgent: false },
    ]},

    "12mo": { label: "12 months out", color: "#1B6B44", bg: "#E8F5EE", emoji: "🌱", desc: "Planting the seeds — big moves take time.", tasks: [
      // Credit foundation
      { id: "12_1",  cat: "💳 Credit",       text: needsScore ? `Your ${score} score needs serious work — start now. Target ${score + 60}+ by month 6. Call 1-800-569-4287 for free HUD counseling` : `Protect your ${score} score — set up autopay on every account and never miss a payment`, urgent: needsScore },
      { id: "12_2",  cat: "💳 Credit",       text: "Pull your free reports from all 3 bureaus at AnnualCreditReport.com — you're entitled to one free report per bureau per year", urgent: true },
      { id: "12_3",  cat: "💳 Credit",       text: "Keep all credit card balances under 30% of their limits — ideally under 10%. This single factor accounts for 30% of your FICO score", urgent: false },
      ...(needsScore ? [
        { id: "12_cr1", cat: "💳 Credit Repair", text: "Dispute every inaccurate item on all 3 bureaus in writing — bureaus have 30 days to respond or must remove the item", urgent: true },
        { id: "12_cr2", cat: "💳 Credit Repair", text: "Pay down revolving credit card debt aggressively — dropping from 60% to 30% utilization can raise your score 30–50 pts", urgent: true },
        { id: "12_cr3", cat: "💳 Credit Repair", text: "Do NOT close old accounts — your oldest account's age directly affects your score. Keep them open with a small recurring charge", urgent: false },
        { id: "12_cr4", cat: "💳 Credit Repair", text: "Ask a trusted family member with excellent credit (700+, old accounts, low utilization) to add you as an authorized user — can boost score 20–40 pts", urgent: false },
        { id: "12_cr5", cat: "💳 Credit Repair", text: "Set up autopay for every account — one 30-day late payment can drop your score 60–110 pts and stays on your report 7 years", urgent: true },
        { id: "12_cr6", cat: "💳 Credit Repair", text: "Consider a secured credit card if you have limited credit history — use it monthly, pay in full, and it builds positive history", urgent: false },
        { id: "12_cr7", cat: "💳 Credit Repair", text: `Track your score monthly at Credit Karma or Experian (both free). Target: ${score < 580 ? 620 : score < 620 ? 640 : 680}+ by month 6 of your plan`, urgent: true },
      ] : []),
      // Savings & financial foundation
      { id: "12_4",  cat: "💵 Savings",      text: `Open a dedicated high-yield savings account (HYSA) today — many online banks pay 4–5% APY. Separate from checking`, urgent: true },
      { id: "12_5",  cat: "💵 Savings",      text: `Set an automatic monthly transfer of ${fmt(Math.round((dp + price * .03) / 12))} to your HYSA — this gets you to your ${fmt(dp + price * .03)} down payment + closing target in 12 months`, urgent: true },
      { id: "12_6",  cat: "💵 Savings",      text: "Build a separate 6-month emergency fund BEFORE buying — homeownership has surprise costs. HVAC, roof, plumbing — plan for 1–3% of home value per year in repairs", urgent: false },
      { id: "12_7",  cat: "💵 Savings",      text: "Track all spending for 60 days using a free tool (Mint, YNAB, or even a spreadsheet) — buyers consistently underestimate their monthly spend", urgent: false },
      { id: "12_8",  cat: "💵 Savings",      text: "Cut the 3 largest non-essential expenses and redirect the savings — a $200/mo cut compounds to $2,400 more toward your down payment", urgent: false },
      // Debts
      { id: "12_9",  cat: "💳 Debts",        text: needsDebt ? `Your ${fmt(debts)}/mo in debts is hurting your DTI. Create a debt payoff plan now — snowball method (smallest balance first) or avalanche (highest rate first)` : "Review all recurring debts — knowing your exact monthly obligations is essential for underwriting", urgent: needsDebt },
      { id: "12_10", cat: "💳 Debts",        text: "Do NOT take on new car loans, personal loans, or large buy-now-pay-later purchases in the 12 months before buying", urgent: true },
      // Budget & financial planning
      { id: "12_11", cat: "📊 Budget",        text: "Use the Bread Crumbs monthly budget on this app to model your true post-purchase budget — stress test it at a 5% lower income", urgent: false },
      { id: "12_12", cat: "📊 Budget",        text: "Factor in moving costs ($1,000–5,000), immediate repairs, new furniture, and utility deposits — these all hit at closing time", urgent: false },
      { id: "12_13", cat: "📊 Budget",        text: "Understand your total housing cost (PITI + HOA + utilities + maintenance) vs. just the mortgage payment — buyers are often surprised", urgent: false },
      // Research & education
      { id: "12_14", cat: "🏠 Research",      text: `Study 12 months of sold listings in your target neighborhoods in ${cityLabel} — what did homes actually sell for vs. list price?`, urgent: false },
      { id: "12_15", cat: "🏠 Research",      text: `Drive through target areas in ${cityLabel} at different times — morning commute, Saturday night, and midday on a weekday paint very different pictures`, urgent: false },
      { id: "12_16", cat: "🏠 Research",      text: "Research school district ratings for target neighborhoods — even if you don't have kids, school quality strongly affects resale value", urgent: false },
      { id: "12_17", cat: "🏠 Research",      text: "Check 10-year property value trends in your target zip codes — appreciation rates vary significantly by neighborhood within the same city", urgent: false },
      { id: "12_18", cat: "🏠 Research",      text: "Look up FEMA flood maps and local climate risk tools for your target area — flood zone designation affects insurance costs dramatically", urgent: false },
      { id: "12_19", cat: "📋 Education",     text: "Find your local HUD-approved housing counseling agency — first visit is free and they can review your full financial picture", urgent: false },
      { id: "12_20", cat: "📋 Education",     text: "Attend a free homebuyer seminar (many nonprofits and banks host them) — understanding the process reduces costly mistakes", urgent: false },
      // Program planning
      ...(hasHarvey ? [{ id: "12_h1", cat: "💰 Harvey", text: "Confirm HbAP 2.0 is still funded — call 832-393-0550. Funding is limited and exhausts mid-year in most cycles", urgent: false }] : []),
      ...(hasTSAHC  ? [{ id: "12_s1", cat: "💰 State",  text: "Attend a free TSAHC homebuyer seminar — listed at tsahc.org. Learn which lenders participate and what income limits apply to your county", urgent: false }] : []),
      { id: "12_21", cat: "💰 Programs",      text: "Identify all DPA programs you may qualify for using Bread Crumbs — layering 2–3 programs can cover most or all of your closing costs", urgent: false },
      { id: "12_22", cat: "💰 Programs",      text: "Contact your state HFA to confirm current program availability — programs open and close throughout the year as funding cycles", urgent: false },
      // Long-horizon planning
      { id: "12_23", cat: "🎯 Planning",      text: "Define your must-haves vs. nice-to-haves — buyers who know what they won't compromise on make decisions faster and with less regret", urgent: false },
      { id: "12_24", cat: "🎯 Planning",      text: "Consider your 5-year plan — are you likely to stay in this area? Buying and selling within 3 years often results in a net loss after transaction costs", urgent: false },
      { id: "12_25", cat: "🎯 Planning",      text: "Build relationships with 1–2 real estate agents in your target neighborhoods now — good buyer's agents have off-market knowledge before listings go live", urgent: false },
    ]},
  };
}

const TIMELINES = [
  { id: "3mo",  label: "3 months",  emoji: "🚀", desc: "Final sprint" },
  { id: "6mo",  label: "6 months",  emoji: "🏗️", desc: "Build foundation" },
  { id: "12mo", label: "12 months", emoji: "🌱", desc: "Plant seeds" },
];

export default function ActionPlanScreen({ data, onBack }) {
  const C = useTheme();
  const [tl, setTl] = useState("6mo");
  const [checked, setChecked] = useState({});
  const loc = data.locationInfo || {};
  const cl = useMemo(() => generateChecklist(data, loc), [data, loc]);
  const cur = cl[tl];
  const toggle = useCallback(id => setChecked(p => ({ ...p, [id]: !p[id] })), []);
  const done = cur.tasks.filter(t => checked[t.id]).length;
  const pct = cur.tasks.length > 0 ? done / cur.tasks.length : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}>

      <Text style={{ fontSize: 13, color: C.gray700, marginBottom: 14, lineHeight: 20 }}>
        Your personalized action plan — tailored to your programs, credit score, debt load, and savings goals.
      </Text>

      {/* Timeline tabs */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        {TIMELINES.map(t => {
          const sel = tl === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTl(t.id)}
              style={{ flex: 1, borderWidth: 2, borderColor: sel ? cl[t.id].color : C.gray300, borderRadius: 12, padding: 10, backgroundColor: sel ? cl[t.id].bg : C.card, alignItems: "center" }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20, marginBottom: 2 }}>{t.emoji}</Text>
              <Text style={{ fontSize: 12, fontWeight: "800", color: sel ? cl[t.id].color : C.charcoal }}>{t.label}</Text>
              <Text style={{ fontSize: 10, color: C.gray500 }}>{t.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress card */}
      <Card style={{ borderTopWidth: 4, borderTopColor: cur.color }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: cur.color }}>{cur.label}</Text>
            <Text style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{cur.desc}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: cur.color }}>{done}/{cur.tasks.length}</Text>
            <Text style={{ fontSize: 10, color: C.gray500 }}>completed</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 6, borderRadius: 99, backgroundColor: C.gray100, overflow: "hidden", marginBottom: 16 }}>
          <View style={{ height: "100%", borderRadius: 99, width: `${pct * 100}%`, backgroundColor: cur.color }} />
        </View>

        {/* High priority tasks */}
        {["urgent", "other"].map(grp => {
          const tasks = cur.tasks.filter(t => (grp === "urgent") === t.urgent);
          if (!tasks.length) return null;
          return (
            <View key={grp}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: grp === "urgent" ? C.red : C.gray500, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, marginTop: grp === "other" ? 12 : 0 }}>
                {grp === "urgent" ? "⚡ High priority" : "Regular tasks"}
              </Text>
              {tasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => toggle(task.id)}
                  style={{ flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.gray100, alignItems: "flex-start" }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                    borderColor: checked[task.id] ? cur.color : C.gray300,
                    backgroundColor: checked[task.id] ? cur.color : C.card,
                    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>
                    {checked[task.id] && <Text style={{ color: C.white, fontSize: 13, fontWeight: "900" }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: cur.color, marginBottom: 2 }}>{task.cat}</Text>
                    <Text style={{ fontSize: 12, lineHeight: 18, color: checked[task.id] ? C.gray300 : C.charcoal, textDecorationLine: checked[task.id] ? "line-through" : "none" }}>
                      {task.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </Card>

      <TouchableOpacity onPress={onBack} style={{ borderRadius: 14, paddingVertical: 16, alignItems: "center", backgroundColor: C.gray100, borderWidth: 1, borderColor: C.gray300, marginBottom: 8 }} activeOpacity={0.8}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: C.gray700 }}>← Back to Results</Text>
      </TouchableOpacity>

      <GlossaryBar keys={["DTI", "MCC", "DPA", "FHA", "VA", "HUD", "HYSA", "FICO", "AMI"]} />

    </ScrollView>
  );
}
