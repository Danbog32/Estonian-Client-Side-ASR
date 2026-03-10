"use client";

export const SHARED_COLOR_PRESETS = [
  // Light presets
  {
    key: "blackOnWhite",
    textColor: "#000000",
    backgroundColor: "#FFFFFF",
    label: { en: "Black / White", et: "Must / Valge" },
  },
  {
    key: "blackOnCream",
    textColor: "#1A1A1A",
    backgroundColor: "#FFF8E7",
    label: { en: "Black / Cream", et: "Must / Kreem" },
  },
  {
    key: "sepiaOnParchment",
    textColor: "#5C4033",
    backgroundColor: "#F4E4BC",
    label: { en: "Sepia / Parchment", et: "Seepia / Pärgament" },
  },
  // Dark presets
  {
    key: "whiteOnBlack",
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    label: { en: "White / Black", et: "Valge / Must" },
  },
  {
    key: "amberOnCharcoal",
    textColor: "#FFB347",
    backgroundColor: "#1A1A1A",
    label: { en: "Amber / Charcoal", et: "Merevaik / Söe" },
  },
  {
    key: "cyanOnBlack",
    textColor: "#50E3C2",
    backgroundColor: "#000000",
    label: { en: "Cyan / Black", et: "Tsüaan / Must" },
  },
] as const;
