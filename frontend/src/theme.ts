// Chart palette. Risk semantic colors follow the GramDrishti AI design
// system (see index.css @theme) — status colors are reserved for risk
// levels only, never reused as a chart series color.

export const STATUS = {
  good: "#059669", // success-green
  warning: "#fe932c", // secondary-container
  critical: "#ba1a1a", // error
};

export const RISK_COLOR: Record<"low" | "medium" | "high", string> = {
  low: STATUS.good,
  medium: STATUS.warning,
  high: STATUS.critical,
};

export const RISK_BG: Record<"low" | "medium" | "high", string> = {
  low: "#e3f2ec",
  medium: "#fef1e2",
  high: "#ffdad6", // error-container
};

// i18n keys for each risk level's short label (t("risk.levelLow") etc.) —
// shared by any component that needs to render a level as translated text.
export const RISK_LEVEL_KEY: Record<"low" | "medium" | "high", string> = {
  low: "risk.levelLow",
  medium: "risk.levelMedium",
  high: "risk.levelHigh",
};

export const CATEGORICAL = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

export const SECTOR_COLOR: Record<string, string> = {
  dairy: CATEGORICAL[0],
  poultry: CATEGORICAL[7],
  food_processing: CATEGORICAL[4],
  handicrafts: CATEGORICAL[6],
  rural_retail: CATEGORICAL[1],
};

export const SEQUENTIAL_BLUE = {
  100: "#cde2fb",
  300: "#6da7ec",
  500: "#256abf",
  700: "#0d366b",
};

export const CHROME = {
  surface: "#fcfcfb",
  page: "#f9f9f7",
  primaryInk: "#0b0b0b",
  secondaryInk: "#52514e",
  mutedInk: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};

// Sector display names are localized via i18n (see src/i18n) — use
// t(`sectors.${sector}`) at call sites rather than a static map here.
export const SECTORS = ["dairy", "poultry", "food_processing", "handicrafts", "rural_retail"] as const;
