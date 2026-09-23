/**
 * The Odenta palette, in the shape the odontogram module's `themeConfig` takes.
 *
 * The module paints itself from eight CSS custom properties (`--odon-*`). This
 * maps them onto `src/theme/tokens.js` so the chart rebrands with the rest of
 * the app — no hex is introduced here. `odenta-skin.css` covers what a colour
 * alone cannot (radii, shadows, typography).
 */

import { accent, brand, ink, surface } from "@/theme/tokens";

export const odontogramTheme = {
  colors: {
    /* Transparent so the chart sits on whatever Odenta surface hosts it
       rather than painting its own page background. */
    background: "transparent",
    panel: surface.card,
    card: surface.card,
    text: ink.DEFAULT,
    muted: ink.muted,
    line: surface.line,
    accent: brand[600],
    accent2: accent[500],
  },
};

export default odontogramTheme;
