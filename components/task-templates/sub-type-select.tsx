"use client";

import {
  practiceAreaSubTypes,
  formatSubType,
  type PracticeArea,
} from "@/lib/constants/practice-sub-types";

interface SubTypeSelectProps {
  practiceArea: string;
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

/**
 * Sub-type dropdown that dynamically updates based on selected practice area.
 * Shows available sub-types for the given practice area.
 */
export function SubTypeSelect({
  practiceArea,
  value,
  onChange,
  disabled = false,
  required = false,
  id = "subType",
  className,
}: SubTypeSelectProps) {
  const subTypes = practiceAreaSubTypes[practiceArea as PracticeArea] ?? [];
  const hasSubTypes = subTypes.length > 0;

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || !hasSubTypes}
      required={required}
      className={
        className ??
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      <option value="">{hasSubTypes ? "Select case type..." : "Select practice area first"}</option>
      {subTypes.map((subType) => (
        <option key={subType} value={subType}>
          {formatSubType(subType)}
        </option>
      ))}
    </select>
  );
}
