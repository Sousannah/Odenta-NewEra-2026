/**
 * Every image the app ships, addressed by name.
 *
 * Screens import from here rather than hardcoding `/imgs/...`, so moving the
 * files to a CDN later is a change to this map alone.
 */
const base = "/imgs";

export const brandAssets = {
  /**
   * The shipped logo ships on an opaque near-white plate; `logo` is the
   * background-removed build used everywhere on screen. `logoPlate` is the
   * original, kept for print and for anything that wants the solid ground.
   */
  logo: `${base}/odenta-logo-transparent.png`,
  logoPlate: `${base}/odenta-logo.png`,
  logoAlt: `${base}/odenta-logo3.png`,
  logoFlat: `${base}/odenta-logo2.jpg`,

  /**
   * The tooth on its own, square and background-removed.
   *
   * Cut from `/odenta-pic.png` — same artwork, without the near-white plate it
   * was exported on — so it can sit on the tinted sidebar, a collapsed rail or
   * a browser tab without carrying a pale box around with it.
   */
  markPng: `${base}/odenta-mark.png`,
  mark: "/tooth.svg",
  ogImage: "/odenta-pic.png",
};

export const images = {
  heroClinician: `${base}/hero_3.jpg`,
  heroAlt: `${base}/hero.jpg`,
  heroWide: `${base}/hero_2.jpg`,
  aiAnalysis: `${base}/ai.jpg`,
  aiDetail: `${base}/ai_2.jpg`,
  xray: `${base}/xray.jpg`,
  xrayDetail: `${base}/x-ray-1.jpg`,
  dashboard: `${base}/dash.jpg`,
  dashboardAlt: `${base}/dash2.jpg`,
  analytics: `${base}/analytics.png`,
  chart: `${base}/chart.png`,
  campus: `${base}/aiu-campus.jpeg`,
  clinic: `${base}/odenta.jpg`,
};

export const universityLogos = {
  aiu: `${base}/aiu_logo.png`,
  aiuWordmark: `${base}/AIU_New_Logo.png`,
};

export const people = {
  sousannah: `${base}/sousannah.jpg`,
  salma: `${base}/salma.jpg`,
  jana: `${base}/jana.jpg`,
};

/** Per-tooth reference imagery, keyed by FDI number. */
export const toothImage = (fdi) => `${base}/teeth/${fdi}.png`;

export default { brandAssets, images, universityLogos, people, toothImage };
