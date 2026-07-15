// Chart palette, following the dataviz skill's validated reference palette
// (references/palette.md). Status colors are reserved for risk levels only.

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export const RISK_COLOR: Record<"low" | "medium" | "high", string> = {
  low: STATUS.good,
  medium: STATUS.warning,
  high: STATUS.critical,
};

export const RISK_BG: Record<"low" | "medium" | "high", string> = {
  low: "#e7f6e7",
  medium: "#fef3d9",
  high: "#fbe4e4",
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
