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

// country -> primary local currency, used by the seed script so amounts
// look plausible per-country (e.g. India employees paid in INR).
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  IN: "INR",
  DE: "EUR",
  FR: "EUR",
  CA: "CAD",
  AU: "AUD",
  JP: "JPY",
  SG: "SGD",
  BR: "BRL",
  MX: "MXN",
  ZA: "ZAR",
  NL: "EUR",
  ES: "EUR",
  IT: "EUR",
  CH: "CHF",
  SE: "SEK",
  AE: "AED",
  PH: "PHP",
  PL: "PLN",
};

export const COUNTRIES = Object.keys(COUNTRY_CURRENCY);
