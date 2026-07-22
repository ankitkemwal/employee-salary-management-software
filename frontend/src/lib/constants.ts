// Mirrors backend/src/db/constants.ts so filter dropdowns match what the
// seed data (and any newly created employee) can actually contain.
export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Human Resources",
  "Finance",
  "Legal",
  "Customer Support",
  "Product",
  "Design",
  "Operations",
  "IT",
  "Procurement",
  "Quality Assurance",
  "Research & Development",
  "Executive",
] as const;

export const COUNTRY_CODES = [
  "US",
  "GB",
  "IN",
  "DE",
  "FR",
  "CA",
  "AU",
  "JP",
  "SG",
  "BR",
  "MX",
  "ZA",
  "NL",
  "ES",
  "IT",
  "CH",
  "SE",
  "AE",
  "PH",
  "PL",
] as const;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  return regionNames.of(code) ?? code;
}

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
] as const;
