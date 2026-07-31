---
name: Massalia Bold High-Contrast
colors:
  surface: '#021525'
  surface-dim: '#021525'
  surface-bright: '#293b4d'
  surface-container-lowest: '#000f1e'
  surface-container-low: '#091d2e'
  surface-container: '#0e2132'
  surface-container-high: '#192b3d'
  surface-container-highest: '#243648'
  on-surface: '#d1e4fb'
  on-surface-variant: '#dcc1b1'
  inverse-surface: '#d1e4fb'
  inverse-on-surface: '#203243'
  outline: '#a48c7d'
  outline-variant: '#564337'
  surface-tint: '#ffb783'
  primary: '#ffb783'
  on-primary: '#4f2500'
  primary-container: '#e67e22'
  on-primary-container: '#502600'
  inverse-primary: '#944a00'
  secondary: '#bcc7d8'
  on-secondary: '#26313e'
  secondary-container: '#3c4856'
  on-secondary-container: '#aab6c7'
  tertiary: '#c8c6c2'
  on-tertiary: '#30312e'
  tertiary-container: '#9a9995'
  on-tertiary-container: '#31312e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#ffb783'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#d8e3f5'
  secondary-fixed-dim: '#bcc7d8'
  on-secondary-fixed: '#111c29'
  on-secondary-fixed-variant: '#3c4856'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#021525'
  on-background: '#d1e4fb'
  surface-variant: '#243648'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 80px
    fontWeight: '900'
    lineHeight: '1.0'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '900'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 32px
  lg: 64px
  xl: 128px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
This design system is built on a foundation of high-contrast editorial rigor. It targets a sophisticated audience that values clarity, authority, and high-impact visual storytelling. The aesthetic leans heavily into **Modern Minimalism** fused with **Editorial Brutalism**, utilizing sharp edges, massive typographic scales, and a restricted but aggressive color palette.

The UI should evoke a sense of "digital ink"—deliberate, permanent, and premium. By removing soft shadows and rounded corners, the interface prioritizes structure and information density, creating an atmosphere of professional precision and cinematic boldness.

## Colors
The color strategy employs a deep "Midnight" surface to provide a boundless, high-contrast backdrop. The "Terracotta" accent acts as a high-visibility signal, used strictly for primary actions, highlights, and critical path indicators. 

- **Surface (Primary):** #0a1622 (Midnight). Used for all main backgrounds and containers.
- **Accent (Primary):** #e67e22 (Terracotta). High-saturation focal point.
- **Text (On-Surface):** #f9f7f2 (Off-White). Optimized for maximum legibility against the dark background.
- **Subtle (Muted):** #2c3e50. Used for borders, dividers, and inactive states to maintain depth without breaking the high-contrast ethos.

## Typography
The typographic hierarchy is the primary driver of the design system's personality. 
- **Headlines:** Playfair Display Black (900 weight) creates an authoritative, editorial feel. Large displays use tight line-heights and negative letter spacing to feel "locked in."
- **Body:** Inter provides a utilitarian, high-contrast counterpoint. It is set with generous line-height to ensure readability within dense information blocks.
- **Labels:** Small caps and increased letter spacing are used for metadata and labels to differentiate them from body copy while maintaining the sharp, structured grid.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile. The layout is inspired by broadsheet newspapers, favoring vertical rhythm and clear demarcations.

- **Desktop:** 12-column grid, 1200px max-width, 24px gutters.
- **Mobile:** 4-column grid with 16px side margins.
- **Rhythm:** All spacing must be a multiple of the 4px base unit. Use `lg` (64px) or `xl` (128px) spacing to separate major content sections, creating "islands" of information that prevent the high-contrast text from feeling cluttered.
- **Borders:** Instead of whitespace-only separation, use 1px solid borders (#2c3e50) to define sections and maintain the "sharp" editorial structure.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layers** and **Bold Outlines** rather than shadows. 
- **Level 0:** Midnight (#0a1622) background.
- **Level 1:** Slightly lighter containers (#152535) used for cards or sidebars.
- **Interactions:** Use sharp 1px or 2px borders in Terracotta (#e67e22) to indicate focus or active states.
- **Shadows:** Strictly avoided. All elevation changes must be communicated via background color shifts or high-contrast border treatments.

## Shapes
The shape language is strictly **Sharp (0px)**. No radii are permitted on any UI element—including buttons, inputs, cards, or selection states. This reinforces the architectural and editorial nature of the brand. Horizontal and vertical lines should be 1px or 2px thick to maintain a "drafted" look.

## Components
- **Buttons:** Rectangular with 0px corner radius. Primary buttons are Terracotta (#e67e22) with Midnight text. Secondary buttons are outlined in Off-White.
- **Inputs:** Simple bottom-border or 1px stroke. Labels are consistently `label-lg` (uppercase) placed above the input field.
- **Cards:** Defined by a 1px solid border (#2c3e50) or a subtle shift in surface color. No shadows. Content inside cards follows a strict vertical stack.
- **Lists:** Separated by 1px horizontal rules. High information density is encouraged; use `label-sm` for secondary data points.
- **Chips:** Inverted color blocks (Off-White background with Midnight text) to make them pop against the dark surface without using rounded shapes.
- **Navigation:** Large, bold typography for top-level links. The active state is indicated by a 2px Terracotta underline.