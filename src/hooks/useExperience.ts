// The storefront plays its full animation on every device. Many Android phones ask for reduced
// motion whenever power saving is on, which used to leave the site still on them, so that request
// is no longer followed. Components keep calling this hook so the choice stays in one place:
// returning the media query's value here would bring reduced motion back.
export function useReducedMotion() {
  return false;
}
