import { View, Text } from "react-native";
import { useTheme } from "../lib/theme";

const ACRONYMS = {
  "AMI":   "Area Median Income — the midpoint income for a geographic area, used by housing programs to determine eligibility thresholds.",
  "DTI":   "Debt-to-Income Ratio — your total monthly debt payments divided by your gross monthly income. Lenders max out at 43% back-end DTI.",
  "PMI":   "Private Mortgage Insurance — required on conventional loans with less than 20% down. Cancels automatically when you reach 20% equity.",
  "MIP":   "Mortgage Insurance Premium — FHA's version of PMI. Includes a 1.75% upfront fee plus 0.55% annual premium.",
  "PITI":  "Principal, Interest, Taxes & Insurance — the four components of a full monthly housing payment.",
  "MCC":   "Mortgage Credit Certificate — a federal tax credit that converts a percentage of your annual mortgage interest into a dollar-for-dollar reduction in your federal tax bill.",
  "DPA":   "Down Payment Assistance — grants or low/no-interest loans that help cover your down payment and/or closing costs.",
  "FHA":   "Federal Housing Administration — insures mortgages with lower credit and down payment requirements (3.5% min, 580+ score).",
  "VA":    "VA Home Loan — a mortgage benefit for veterans, active duty service members, and surviving spouses. $0 down payment, no PMI.",
  "USDA":  "U.S. Department of Agriculture — offers the USDA Rural Development loan: $0 down, low rates for buyers in eligible rural/suburban areas.",
  "HOA":   "Homeowners Association — manages common areas and collects monthly or annual fees from homeowners.",
  "HUD":   "U.S. Department of Housing and Urban Development — the federal agency overseeing FHA loans and fair housing laws.",
  "FICO":  "Fair Isaac Corporation — the company that created the standard credit scoring model used by most mortgage lenders.",
  "FEMA":  "Federal Emergency Management Agency — manages the National Flood Insurance Program and publishes official flood zone maps.",
  "HYSA":  "High-Yield Savings Account — a savings account (typically at an online bank) offering significantly above-average interest rates.",
  "UCR":   "Uniform Crime Reports — the FBI's standardized annual crime data collection program used by most local police departments.",
  "NRI":   "National Risk Index — FEMA's composite risk score for natural hazards by county and census tract.",
  "NACA":  "Neighborhood Assistance Corporation of America — a national nonprofit offering below-market mortgages with no down payment and no closing costs.",
  "GNND":  "Good Neighbor Next Door — a HUD program offering eligible buyers 50% off HUD-listed homes in designated revitalization areas.",
};

export default function GlossaryBar({ keys }) {
  const C = useTheme();
  const relevant = keys.filter(k => ACRONYMS[k]);
  if (!relevant.length) return null;
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: C.border, borderStyle: "dashed", marginTop: 8, paddingTop: 10, marginBottom: 8 }}>
      <Text style={{ fontSize: 9, fontWeight: "800", color: C.gray500, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>
        📖 Glossary — terms used on this page
      </Text>
      {relevant.map(k => (
        <Text key={k} style={{ fontSize: 10, color: C.gray500, lineHeight: 16, marginBottom: 3 }}>
          <Text style={{ fontWeight: "700", color: C.charcoal }}>{k}</Text>
          {" — "}{ACRONYMS[k]}
        </Text>
      ))}
    </View>
  );
}
