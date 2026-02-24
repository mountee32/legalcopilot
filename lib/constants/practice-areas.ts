/**
 * Practice area labels/colors/options for US-facing UI.
 *
 * Values remain compatible with stored enum keys.
 */

export const PRACTICE_AREA_LABELS: Record<string, string> = {
  personal_injury: "Personal Injury",
  workers_compensation: "Workers' Compensation",
  insurance_defense: "Insurance Defense",
  litigation: "Litigation",
  family: "Family Law",
  employment: "Employment",
  immigration: "Immigration",
  commercial: "Business Law",
  criminal: "Criminal Defense",
  ip: "Intellectual Property",
  insolvency: "Bankruptcy & Restructuring",
  conveyancing: "Real Estate",
  probate: "Estate & Probate",
  other: "Other",
};

export const PRACTICE_AREA_COLORS: Record<string, string> = {
  personal_injury: "bg-rose-100 border-rose-200 text-rose-700",
  workers_compensation: "bg-orange-100 border-orange-200 text-orange-700",
  insurance_defense: "bg-cyan-100 border-cyan-200 text-cyan-700",
  litigation: "bg-red-100 border-red-200 text-red-700",
  family: "bg-pink-100 border-pink-200 text-pink-700",
  employment: "bg-green-100 border-green-200 text-green-700",
  immigration: "bg-teal-100 border-teal-200 text-teal-700",
  commercial: "bg-indigo-100 border-indigo-200 text-indigo-700",
  criminal: "bg-slate-200 border-slate-300 text-slate-700",
  ip: "bg-violet-100 border-violet-200 text-violet-700",
  insolvency: "bg-amber-100 border-amber-200 text-amber-700",
  conveyancing: "bg-blue-100 border-blue-200 text-blue-700",
  probate: "bg-yellow-100 border-yellow-200 text-yellow-700",
  other: "bg-slate-100 border-slate-200 text-slate-700",
};

export const PRACTICE_AREA_OPTIONS = [
  { value: "personal_injury", label: PRACTICE_AREA_LABELS.personal_injury },
  { value: "workers_compensation", label: PRACTICE_AREA_LABELS.workers_compensation },
  { value: "insurance_defense", label: PRACTICE_AREA_LABELS.insurance_defense },
  { value: "litigation", label: PRACTICE_AREA_LABELS.litigation },
  { value: "family", label: PRACTICE_AREA_LABELS.family },
  { value: "employment", label: PRACTICE_AREA_LABELS.employment },
  { value: "immigration", label: PRACTICE_AREA_LABELS.immigration },
  { value: "commercial", label: PRACTICE_AREA_LABELS.commercial },
  { value: "criminal", label: PRACTICE_AREA_LABELS.criminal },
  { value: "ip", label: PRACTICE_AREA_LABELS.ip },
  { value: "insolvency", label: PRACTICE_AREA_LABELS.insolvency },
  // Legacy values retained for compatibility:
  { value: "conveyancing", label: PRACTICE_AREA_LABELS.conveyancing },
  { value: "probate", label: PRACTICE_AREA_LABELS.probate },
  { value: "other", label: PRACTICE_AREA_LABELS.other },
] as const;

export function formatPracticeArea(practiceArea: string): string {
  return (
    PRACTICE_AREA_LABELS[practiceArea] ||
    practiceArea
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function getPracticeAreaColor(practiceArea: string): string {
  return PRACTICE_AREA_COLORS[practiceArea] || PRACTICE_AREA_COLORS.other;
}
