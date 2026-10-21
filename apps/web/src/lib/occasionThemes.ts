import type { OccasionTheme } from "@love/shared";

/**
 * Only colour emoji in `particles`: plain text glyphs (♥, ❅) render in the text colour, i.e. near-black.
 *
 * How each occasion theme looks: the emoji particles drifting over her pages and how they move.
 * fall: drift down with a sway · rise: float up · twinkle: pulse in place · burst: pop like fireworks.
 */
export const OCCASION_THEME_STYLES: Record<
  OccasionTheme,
  { label: string; particles: string[]; motion: "fall" | "rise" | "twinkle" | "burst" }
> = {
  hearts: { label: "Tim bay", particles: ["💗", "💕", "💖", "💘", "💞"], motion: "rise" },
  fireworks: { label: "Pháo hoa", particles: ["🎆", "🎇", "✨", "💥"], motion: "burst" },
  blossoms: { label: "Hoa mai đào", particles: ["🌸", "🌼", "🏵️", "🧧"], motion: "fall" },
  petals: { label: "Cánh hoa", particles: ["🌷", "🌸", "🌹", "💐"], motion: "fall" },
  stars: { label: "Sao lấp lánh", particles: ["⭐", "✨", "🌟", "💫"], motion: "twinkle" },
  lanterns: { label: "Đèn lồng", particles: ["🏮", "🏮", "🌕", "✨"], motion: "rise" },
  spooky: { label: "Halloween", particles: ["🎃", "🦇", "👻", "🕸️"], motion: "fall" },
  snow: { label: "Tuyết rơi", particles: ["❄️", "❄️", "☃️", "⛄"], motion: "fall" },
  confetti: { label: "Pháo giấy", particles: ["🎉", "🎊", "🎈", "✨"], motion: "fall" },
};
