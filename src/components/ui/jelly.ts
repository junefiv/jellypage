/** Bouncy enter / morph */
export const JELLY_SPRING = { damping: 7.2, stiffness: 105, mass: 0.95 };
/** Viscous wobble — keeps oscillating a beat */
export const JELLY_WOBBLE = { damping: 5.8, stiffness: 78, mass: 1.15 };
/** Quick squish on press */
export const JELLY_SQUISH = { damping: 8.5, stiffness: 320, mass: 0.5 };
export const JELLY_SETTLE = { damping: 11, stiffness: 165, mass: 0.8 };
export const JELLY_OUT = { damping: 14, stiffness: 190, mass: 0.62, overshootClamping: true };
