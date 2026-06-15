export const mpi = (loan, ar, mo) => {
  if (loan <= 0 || ar <= 0) return 0;
  const r = ar / 100 / 12;
  return loan * (r * Math.pow(1 + r, mo)) / (Math.pow(1 + r, mo) - 1);
};

export const calcTax = (gross, pretax) => {
  const t = Math.max(0, gross - pretax - 14600);
  let f = 0;
  if (t > 609350) f = 184956 + (t - 609350) * .37;
  else if (t > 243725) f = 53579 + (t - 243725) * .35;
  else if (t > 100525) f = 17168 + (t - 100525) * .24;
  else if (t > 47150) f = 5426 + (t - 47150) * .22;
  else if (t > 11600) f = 1160 + (t - 11600) * .12;
  else f = t * .10;
  return Math.round((f + Math.min(gross, 168600) * .062 + gross * .0145) / 12);
};

export const convRate = (sc, dp) => {
  let b = 6.51;
  if (sc >= 780) b -= .20;
  else if (sc >= 760) b -= .12;
  else if (sc >= 740) b -= .05;
  else if (sc >= 720) b += .10;
  else if (sc >= 700) b += .20;
  else if (sc >= 680) b += .35;
  else b += .55;
  if (dp < 5) b += .15;
  else if (dp < 10) b += .05;
  else if (dp >= 20) b -= .10;
  return Math.round(b * 100) / 100;
};

export const fmt = n => "$" + Math.round(Math.max(0, n)).toLocaleString();
export const fmtK = n => "$" + Math.round(Math.abs(n) / 1000) + "K";

export function getLoanRec(score, dpPct, isVet) {
  if (isVet) return { type: "va", reason: "VA gives you $0 down and the lowest available rate — the strongest loan if you've served." };
  if (score >= 720 && dpPct >= 5) return { type: "conv", reason: `At ${score}+ your PMI rate is low and cancels at 20% equity — cheaper long-term than FHA's lifetime MIP.` };
  if (score >= 620 && dpPct >= 20) return { type: "conv", reason: "With 20% down you have no PMI on either loan — conventional wins with its lower base rate." };
  if (score < 620) return { type: "fha", reason: `Below 620, conventional lenders add heavy surcharges. FHA's flat MIP is more predictable at your score.` };
  return { type: "fha", reason: `With ${dpPct}% down and a ${score} score, FHA's minimum requirements and flexible guidelines are your best entry point.` };
}
