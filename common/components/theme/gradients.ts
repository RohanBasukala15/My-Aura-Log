/**
 * Centralized gradient definitions for the app
 * 
 * Primary Brand Gradient: Lavender (#9B87F5) → Teal (#7DD3C0)
 * This is the main primary linear gradient representing the app's brand identity
 */

export const GRADIENTS = {
  /**
   * Primary brand gradient: Lavender to Teal
   * Used for primary CTAs, premium buttons, and key brand elements
   * Direction: Left to Right (horizontal)
   */
  primary: {
    colors: ["#9B87F5", "#7DD3C0"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 0 } as const,
  },

  /**
   * Reverse primary gradient: Teal to Lavender
   * Used for secondary CTAs and alternative brand elements
   * Direction: Left to Right (horizontal)
   */
  primaryReverse: {
    colors: ["#7DD3C0", "#9B87F5"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 0 } as const,
  },

  /**
   * Primary gradient vertical: Lavender to Teal
   * Direction: Top to Bottom (vertical)
   */
  primaryVertical: {
    colors: ["#9B87F5", "#7DD3C0"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },

  /**
   * Primary gradient diagonal: Lavender to Teal
   * Direction: Top-left to Bottom-right (diagonal)
   */
  primaryDiagonal: {
    colors: ["#9B87F5", "#7DD3C0"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 1 } as const,
  },

  /**
   * Background gradient: Soft lavender background
   * Used for screen backgrounds
   */
  background: {
    colors: ["#F8F6FF", "#FFFFFF", "#F8F6FF"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 1 } as const,
  },

  /**
   * Background gradient solid: Soft lavender
   * Used for breathing screen and other full-screen backgrounds
   */
  backgroundSolid: {
    colors: ["rgba(248, 246, 255, 1)", "rgba(248, 246, 255, 0.95)", "rgba(248, 246, 255, 1)"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 1 } as const,
  },

  /**
   * Breathing phase gradients
   */
  breathing: {
    inhale: {
      colors: ["rgba(155, 167, 245, 0.6)", "rgba(181, 196, 245, 0.5)"] as const,
      start: { x: 0, y: 0 } as const,
      end: { x: 1, y: 1 } as const,
    },
    hold: {
      colors: ["rgba(155, 167, 245, 0.7)", "rgba(155, 167, 245, 0.6)"] as const,
      start: { x: 0, y: 0 } as const,
      end: { x: 1, y: 1 } as const,
    },
    exhale: {
      colors: ["rgba(125, 218, 192, 0.6)", "rgba(163, 230, 209, 0.5)"] as const,
      start: { x: 0, y: 0 } as const,
      end: { x: 1, y: 1 } as const,
    },
  },

  /**
   * Disabled state gradient
   */
  disabled: {
    colors: ["#D3D3D3", "#B8B8B8"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 0 } as const,
  },
} as const;

/**
 * Main primary linear gradient from app perspective
 * This is the primary brand gradient used throughout the app
 */
export const PRIMARY_GRADIENT = GRADIENTS.primary;


