---
name: C. Saint-Girons — AI Law & Legal Intelligence
description: A quiet, futuristic legal-intelligence interface — glass surfaces, ink-on-light editorial type, a single gold signal accent.
colors:
  ink: "#111111"
  body-bg: "#ecebe6"
  paper: "#f7f6f1"
  muted: "#666662"
  border: "#e0dfd9"
  navy: "#1e293b"
  accent: "#9a6b1f"
  accent-strong: "#7c5214"
  live: "#10b981"
typography:
  display:
    fontFamily: "Space Grotesk, Avenir Next, SF Pro Display, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Space Grotesk, Avenir Next, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, -apple-system, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.01em"
  label:
    fontFamily: "IBM Plex Mono, SF Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.3em"
rounded:
  pill: "9999px"
  card: "2rem"
  card-lg: "2.8rem"
  chip: "1.2rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.5rem"
  lg: "3.5rem"
  xl: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.5rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  chip:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
---

# Design System: C. Saint-Girons — AI Law & Legal Intelligence

## 1. Overview

**Creative North Star: "The Quiet Terminal"**

This is a legal-intelligence instrument, not a vitrine. The interface behaves like a calm command post: precise, instrumental, futuristic — but it never raises its voice. Authority is signaled through restraint. Surfaces are light and glassy; type is ink-dark and editorial; a single gold accent acts like a status light on an otherwise quiet console. The reader is a skeptical legal professional who must judge a development's reliability in seconds, so every element earns its place by clarifying *what changed, where, and how verified* — never by decorating.

The system rejects the flashy SaaS startup register outright: no purple gradients, no "Get started free" energy, no inflated marketing claims, no emoji. It equally rejects the generic navy-and-serif law-firm template and any neon/crypto "hacker" glow. Futurism here is carried by typography (Space Grotesk), light/glass materials, and exact spacing — not by loud color or gimmicks.

Motion is purposeful and fast, easing out on `[0.16, 1, 0.3, 1]`, and always has a reduced-motion fallback. Glass and a quiet light-sweep "sheen" are the premium materials; they appear on a few high-signal surfaces, never everywhere.

**Key Characteristics:**
- Light, warm-neutral body with frosted-glass panels floating above it.
- Ink-dark editorial typography; one geometric display face for presence.
- A single gold/bronze accent used as a *signal*, never as decoration.
- Status semantics are explicit: live is green, verification is labeled — never color alone.
- Restrained, eased motion; a subtle hover sheen as the signature flourish.

## 2. Colors

A warm-neutral, ink-on-light palette with one disciplined gold signal and a structural navy. Glassmorphism is achieved with translucent whites layered over the body.

### Primary
- **Signal Gold** (`#9a6b1f`, deepening to `#7c5214` for text): the lone accent. Used on section kickers, entry-point icons, focus rings, and small "authority" marks. It is the console's status light — its rarity is the point.

### Secondary
- **Command Navy** (`#1e293b`): structural depth on dark panels (timelines, live-monitoring desks) and as a restrained tint in radial backgrounds. Carries gravity without going full corporate-navy.

### Neutral
- **Ink** (`#111111`): primary text and the solid primary button.
- **Stone Body** (`#ecebe6`): the warm-neutral page background.
- **Paper** (`#f7f6f1`): card and panel fills, and the secondary button.
- **Muted** (`#666662`): secondary text and labels — only where it still clears 4.5:1.
- **Hairline** (`#e0dfd9` / `rgba(17,17,17,0.08)`): borders and dividers.

### Status (functional, non-decorative)
- **Live Green** (`#10b981`): the live-monitoring pulse. Never repurposed as an accent.

### Named Rules
**The One Signal Rule.** Signal Gold appears on ≤10% of any screen. If it's carrying more than kickers, focus, and a few marks, it has stopped being a signal.
**The Status-Never-Color-Alone Rule.** Verified / binding / live states always pair the color with a label or icon. Color is the echo, not the message.

## 3. Typography

**Display Font:** Space Grotesk (with Avenir Next, SF Pro Display fallback)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** IBM Plex Mono

**Character:** A geometric, slightly futuristic display (Space Grotesk) paired with the neutral, highly legible Inter — contrast on the geometric-vs-humanist axis, not two lookalike sans. Mono labels (IBM Plex Mono) add an instrument-panel precision to kickers and metadata.

### Hierarchy
- **Display** (Space Grotesk 500, `clamp(2.25rem, 6vw, 6rem)`, line-height 0.9, tracking −0.05em, often UPPERCASE): hero and page titles. The single moment of scale.
- **Headline** (Space Grotesk 500, `clamp(1.5rem, 3vw, 2.25rem)`, −0.04em): section titles.
- **Title** (Space Grotesk / Inter 500, ~1.25rem): card titles, item names.
- **Body** (Inter 400, 1rem, line-height 1.7): prose; capped at 65–75ch.
- **Label** (IBM Plex Mono 500, 0.6875rem, tracking 0.3em, UPPERCASE): kickers, metadata, status chips.

### Named Rules
**The Display-Once Rule.** One display moment per viewport. The title earns the scale; everything else steps down hard.

## 4. Elevation

A hybrid: the page is flat and matte; **glass panels** float above it with soft, wide, low-opacity shadows and an inset top highlight. Depth reads as *layering of light-through-frosted-glass*, not drop-shadow weight. Surfaces are calm at rest; elevation responds to state (hover lifts 1–4px, shadow widens).

### Shadow Vocabulary
- **Panel ambient** (`box-shadow: 0 24px 60px rgba(15,15,15,0.06)`): the resting float of glass cards.
- **Hover lift** (`box-shadow: 0 28px 80px rgba(15,15,15,0.08)` + `translateY(-2px to -4px)`): response to pointer.
- **Inset highlight** (`inset 0 1px 0 rgba(255,255,255,0.75)`): the lit top edge that makes glass read as glass.

### Named Rules
**The Float-Not-Stamp Rule.** Shadows are wide and faint (blur ≥ 24px, alpha ≤ 0.08). A tight dark shadow makes it look like a 2014 app; if it looks stamped, the blur is too small and the alpha too high.

## 5. Components

### Buttons
- **Shape:** full pills (`9999px`).
- **Primary:** Ink background (`#111111`), Paper text, `0.75rem 1.5rem` padding; the single solid element on a glass field.
- **Secondary:** `glass-panel-soft` — translucent white, ink text, hairline border; same pill shape.
- **Hover / Focus:** primary darkens slightly / lifts; all interactive elements get the on-brand focus-visible ring (`2px solid Signal Gold`, offset 2px).

### Chips / Labels
- **Style:** mono uppercase, wide tracking. Status chips use a tint of their own status hue (gold for authority, green for live), never gray-on-tint.
- **State:** verification status pairs color with a worded label.

### Cards / Containers
- **Corner Style:** generous — `2rem` (cards) to `2.8rem` (hero), `1.2rem` for inner chips.
- **Background:** Paper or `glass-panel*` translucent fills over the Stone body.
- **Shadow Strategy:** Panel ambient at rest, Hover lift on interaction (see Elevation).
- **Border:** single hairline (`1px`) all around. Never a colored side-stripe.
- **Internal Padding:** `1.5rem` (mobile) to `2rem`+ (desktop).

### Navigation
- **Style:** sticky top bar, transparent at the top of the page, condensing on scroll into a frosted, hairline-bordered bar with a thin gold scroll-progress line.
- **Items:** icon + short label; the active item carries a single sliding pill (spring), and only the *most specific* route is active.
- **Mobile:** hamburger morphs to ✕; dropdown reveals the same icon+label list with staggered entrance.

### Signature: The Sheen Surface
A `premium-sheen` class sweeps a soft light band across a glass surface on hover (skewed, 0.85s ease-out, disabled under reduced-motion). Reserved for the few hero-level cards (AI Law Hub, primary entry points) — the one piece of "delight" the Quiet Terminal permits.

## 6. Do's and Don'ts

### Do:
- **Do** keep Signal Gold (`#9a6b1f`) to ≤10% of any screen — kickers, focus rings, a few marks.
- **Do** float panels on wide, faint shadows (blur ≥24px, alpha ≤0.08) with an inset top highlight.
- **Do** pair every status color with a label or icon (verified, binding, live).
- **Do** give one display moment per viewport in Space Grotesk; step everything else down.
- **Do** ship a `prefers-reduced-motion` fallback for every animation, including the sheen.
- **Do** cap body measure at 65–75ch and keep body text ≥4.5:1 contrast.

### Don't:
- **Don't** drift into the **flashy SaaS startup** look: no purple gradients, no "Get started free" energy, no emoji, no inflated claims.
- **Don't** fall back to the **generic navy-and-serif law-firm template**.
- **Don't** use **neon / crypto "hacker" glow** or decorative glassmorphism everywhere — glass is purposeful, not default.
- **Don't** overload: no walls of text, no identical card grids, no everything-at-one-level density.
- **Don't** use a colored `border-left`/`border-right` stripe as an accent — full hairline borders only.
- **Don't** convey verified/binding/live by color alone.
