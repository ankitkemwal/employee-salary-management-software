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

// Rough plausible annual salary ranges per currency, used only by the
// seed script so generated numbers are in the right ballpark for each
// currency's typical magnitude (e.g. JPY/INR nominal amounts are much
// larger than USD/GBP for equivalent purchasing power).
export const CURRENCY_SALARY_RANGE: Record<string, [number, number]> = {
  USD: [45000, 180000],
  GBP: [28000, 130000],
  INR: [400000, 3000000],
  EUR: [32000, 140000],
  CAD: [45000, 160000],
  AUD: [50000, 170000],
  JPY: [3500000, 12000000],
  SGD: [40000, 160000],
  BRL: [40000, 250000],
  MXN: [150000, 900000],
  ZAR: [200000, 900000],
  CHF: [60000, 200000],
  SEK: [350000, 900000],
  AED: [80000, 400000],
  PHP: [400000, 2000000],
  PLN: [60000, 220000],
};

