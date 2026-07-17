---
name: C. Saint-Girons — AI Law & Legal Intelligence
description: A quiet, futuristic legal-intelligence interface — near-black body, dark frosted-glass surfaces, light editorial type, a single gold signal accent.
colors:
  bg: "#0a0a0a"
  surface: "rgba(255,255,255,0.04)"
  elevated: "rgba(255,255,255,0.07)"
  ink: "rgba(255,255,255,0.95)"
  body: "rgba(255,255,255,0.72)"
  muted: "rgba(255,255,255,0.58)"
  border: "rgba(255,255,255,0.10)"
  navy: "#1e293b"
  accent: "#9a6b1f"
  accent-strong: "#c4882a"
  live: "#10b981"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Avenir Next, SF Pro Display, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Bricolage Grotesque, Avenir Next, sans-serif"
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

This is a legal-intelligence instrument, not a vitrine. The interface behaves like a calm command post: precise, instrumental, futuristic — but it never raises its voice. Authority is signaled through restraint. The site runs on a **near-black body (`#0a0a0a`)**; surfaces are **dark frosted glass** (translucent white fills 4–8% with a lit top edge); type is **light editorial** on dark; a single gold accent acts like a status light on an otherwise quiet console.

> **Theme note (2026-07):** the system is now **dark** throughout. Muted text steps all clear WCAG AA (≥4.5:1) on the body. Legacy light-authored pages are bridged to dark by the `.dark-site` class in `globals.css`, which remaps Tailwind `zinc`/`white` utility classes to the dark ramp; `glass-panel*` classes are dark glass. New work should read from the dark tokens above rather than author light values. The reader is a skeptical legal professional who must judge a development's reliability in seconds, so every element earns its place by clarifying *what changed, where, and how verified* — never by decorating.

The system rejects the flashy SaaS startup register outright: no purple gradients, no "Get started free" energy, no inflated marketing claims, no emoji. It equally rejects the generic navy-and-serif law-firm template and any neon/crypto "hacker" glow. Futurism here is carried by typography (Bricolage Grotesque), light/glass materials, and exact spacing — not by loud color or gimmicks.

Motion is purposeful and fast, easing out on `[0.16, 1, 0.3, 1]`, and always has a reduced-motion fallback. Glass and a quiet light-sweep "sheen" are the premium materials; they appear on a few high-signal surfaces, never everywhere.

**Key Characteristics:**
- Near-black body with dark frosted-glass panels floating above it.
- Light editorial typography on dark; one geometric display face for presence.
- A single gold/bronze accent used as a *signal*, never as decoration.
- Status semantics are explicit: live is green, verification is labeled — never color alone.
- Restrained, eased motion; a subtle hover sheen as the signature flourish.

## 2. Colors

A light-on-dark palette with one disciplined gold signal and a structural navy. Glassmorphism is achieved with translucent whites (4–8% fills, lit top edge) layered over the near-black body.

### Primary
- **Signal Gold** (`#9a6b1f`, brightening to `#c4882a` for text/marks on dark): the lone accent. Used on section kickers, entry-point icons, focus rings, and small "authority" marks. It is the console's status light — its rarity is the point.

### Secondary
- **Command Navy** (`#1e293b`): structural depth on dark panels (timelines, live-monitoring desks) and as a restrained tint in radial backgrounds. Carries gravity without going full corporate-navy.

### Neutral (light-on-dark ramp)
- **Body** (`#080808`–`#0a0a0a`): the near-black page background.
- **Surface / Elevated** (`rgba(255,255,255,0.04)` → `0.07`): glass card and panel fills.
- **Ink** (`rgba(255,255,255,0.95)`): primary text; the solid primary button is white on dark.
- **Body text** (`rgba(255,255,255,0.72)`): default prose.
- **Muted** (`rgba(255,255,255,0.58)`): secondary text and labels — only where it still clears 4.5:1. Steps below ~0.55 are decorative-only (dividers, dots).
- **Hairline** (`rgba(255,255,255,0.10)`): borders and dividers.

### Status (functional, non-decorative)
- **Live Green** (`#10b981`): the live-monitoring pulse. Never repurposed as an accent.

### Named Rules
**The One Signal Rule.** Signal Gold appears on ≤10% of any screen. If it's carrying more than kickers, focus, and a few marks, it has stopped being a signal.
**The Status-Never-Color-Alone Rule.** Verified / binding / live states always pair the color with a label or icon. Color is the echo, not the message.

## 3. Typography

**Display Font:** Bricolage Grotesque (with Avenir Next, SF Pro Display fallback)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** IBM Plex Mono

**Character:** A geometric, slightly futuristic display (Bricolage Grotesque) paired with the neutral, highly legible Inter — contrast on the geometric-vs-humanist axis, not two lookalike sans. Mono labels (IBM Plex Mono) add an instrument-panel precision to kickers and metadata.

### Hierarchy
- **Display** (Bricolage Grotesque 500, `clamp(2.25rem, 6vw, 6rem)`, line-height 0.9, tracking −0.05em, often UPPERCASE): hero and page titles. The single moment of scale.
- **Headline** (Bricolage Grotesque 500, `clamp(1.5rem, 3vw, 2.25rem)`, −0.04em): section titles.
- **Title** (Bricolage Grotesque / Inter 500, ~1.25rem): card titles, item names.
- **Body** (Inter 400, 1rem, line-height 1.7): prose; capped at 65–75ch.
- **Label** (IBM Plex Mono 500, 0.6875rem, tracking 0.3em, UPPERCASE): kickers, metadata, status chips.

### Named Rules
**The Display-Once Rule.** One display moment per viewport. The title earns the scale; everything else steps down hard.

## 4. Elevation

A hybrid: the page is flat and matte; **glass panels** float above it with soft, wide, low-opacity shadows and an inset top highlight. Depth reads as *layering of light-through-frosted-glass*, not drop-shadow weight. Surfaces are calm at rest; elevation responds to state (hover lifts 1–4px, shadow widens).

### Shadow Vocabulary (on the near-black body)
- **Panel ambient** (`box-shadow: 0 24px 60px rgba(0,0,0,0.4)`): the resting float of glass cards.
- **Hover lift** (`box-shadow: 0 28px 80px rgba(0,0,0,0.45)` + `translateY(-2px to -4px)`): response to pointer.
- **Inset highlight** (`inset 0 1px 0 rgba(255,255,255,0.08)`): the lit top edge that makes glass read as glass on dark.

### Named Rules
**The Float-Not-Stamp Rule.** Shadows are wide and soft (blur ≥ 24px). On dark, depth comes from a deep, wide black shadow (alpha ~0.35–0.45) paired with a faint light inset edge — not from a tight, hard shadow. If it looks stamped, the blur is too small.

## 5. Components

### Buttons
- **Shape:** full pills (`9999px`).
- **Primary:** near-white background (`#f0f0f0`), near-black text, `0.75rem 1.5rem` padding; the single solid element on a dark glass field.
- **Secondary:** `glass-panel-soft` — translucent white fill, light text, hairline border; same pill shape.
- **Hover / Focus:** primary darkens slightly / lifts; all interactive elements get the on-brand focus-visible ring (`2px solid Signal Gold`, offset 2px).

### Chips / Labels
- **Style:** mono uppercase, wide tracking. Status chips use a tint of their own status hue (gold for authority, green for live), never gray-on-tint.
- **State:** verification status pairs color with a worded label.

### Cards / Containers
- **Corner Style:** generous — `2rem` (cards) to `2.8rem` (hero), `1.2rem` for inner chips.
- **Background:** `glass-panel*` translucent fills over the near-black body.
- **Shadow Strategy:** Panel ambient at rest, Hover lift on interaction (see Elevation).
- **Border:** single hairline (`1px`) all around. Never a colored side-stripe.
- **Internal Padding:** `1.5rem` (mobile) to `2rem`+ (desktop).

### Navigation
- **Style:** sticky top bar, transparent at the top of the page, condensing on scroll into a frosted, hairline-bordered bar with a thin gold scroll-progress line.
- **Items:** icon + short label; the active item carries a single sliding pill (spring), and only the *most specific* route is active.
- **Mobile:** hamburger morphs to ✕; dropdown reveals the same icon+label list with staggered entrance.

### Signature: The Sheen Surface
A `premium-sheen` class sweeps a soft light band across a glass surface on hover (skewed, 0.85s ease-out, disabled under reduced-motion). Reserved for the few hero-level cards (AI Law Hub, primary entry points) — the one piece of "delight" the Quiet Terminal permits.

## 6. Country & State Pages — "The Country Console"

Every jurisdiction page (EU country, U.S. state) uses one shared visual system.
Only the data changes; the layout, components, and motion never do. These pages
were historically the most text-saturated surfaces of the site — the principles
below exist to keep them glanceable.

### Principles
1. **One glance = legal posture.** The hero is a console header: jurisdiction
   roundel (mono code, regional tint), display name, the implementation gauge,
   and 3–4 count-up stats. No introductory paragraph.
2. **Numbers carry no essays.** Signal counts render as compact stat tiles —
   number + worded label only. If a label needs a footnote to be understood,
   rewrite the label, don't add the footnote.
3. **No ops copy in public.** Scheduler cadence, fallbacks, parser notes, and
   monitoring internals belong to the admin surface, never to country pages.
4. **Rows, not cards-of-paragraphs.** Authority maps, timelines, and decisions
   are animated ledger rows: category + worded-status chips, title, one mono
   meta line (date · source), source arrow. Long notes are collapsed by
   default and unfold on hover/focus.
5. **Uniformity is the feature.** A reader who learned France can read Sweden.
   New per-country content must fit the shared components — never a bespoke
   layout per country.
6. **Motion budget:** count-up stats, gauge sweep on load, staggered row
   entrance, hover unfold, live pulse on the monitoring kicker. All with
   reduced-motion fallbacks.

## 7. Do's and Don'ts

### Do:
- **Do** keep Signal Gold (`#9a6b1f`) to ≤10% of any screen — kickers, focus rings, a few marks.
- **Do** float panels on wide, soft dark shadows (blur ≥24px, black alpha ~0.35–0.45 on the near-black body) with a faint light inset top highlight.
- **Do** pair every status color with a label or icon (verified, binding, live).
- **Do** give one display moment per viewport in Bricolage Grotesque; step everything else down.
- **Do** ship a `prefers-reduced-motion` fallback for every animation, including the sheen.
- **Do** cap body measure at 65–75ch and keep body text ≥4.5:1 contrast.

### Don't:
- **Don't** drift into the **flashy SaaS startup** look: no purple gradients, no "Get started free" energy, no emoji, no inflated claims.
- **Don't** fall back to the **generic navy-and-serif law-firm template**.
- **Don't** use **neon / crypto "hacker" glow** or decorative glassmorphism everywhere — glass is purposeful, not default.
- **Don't** overload: no walls of text, no identical card grids, no everything-at-one-level density.
- **Don't** use a colored `border-left`/`border-right` stripe as an accent — full hairline borders only.
- **Don't** convey verified/binding/live by color alone.
