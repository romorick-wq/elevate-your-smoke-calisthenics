---
name: Elevate Your Smoke
description: The Cigar Society’s 30-day calisthenics card — Mission Poster Cascade at /, cream phone Field Card at /app, ember orange seal.
colors:
  society-orange: "#E85D04"
  accent-text: "#A03E02"
  accent-ink: "#1A0F08"
  soft-ember: "#F5B07A"
  field-olive: "#2F3B2A"
  field-olive-soft: "#3F4F38"
  cream-bg: "#ECEAE4"
  paper-surface: "#F7F6F2"
  white-surface: "#FFFFFF"
  ink: "#101412"
  muted: "#5E6660"
  danger: "#C43C2C"
  player-void: "#0E110F"
  cream-on-olive: "#F4F7EE"
typography:
  display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    letterSpacing: "-0.03em"
    lineHeight: 0.92
  headline:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    letterSpacing: "-0.03em"
    lineHeight: 1.02
  title:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  masthead:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  countdown:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1
  button:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "0.03em"
  body:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
  supporting:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  fine:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.16em"
rounded:
  sm: "12px"
  md: "18px"
  pill: "999px"
  cell: "10px"
spacing:
  sheet-x: "20px"
  stack-sm: "8px"
  stack-md: "14px"
  stack-lg: "18px"
  site-pad: "clamp(20px, 4vw, 48px)"
  act-y: "clamp(56px, 9vw, 112px)"
  measure: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.society-orange}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "15px 22px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "15px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.cream-on-olive}"
    rounded: "{rounded.pill}"
    padding: "15px 22px"
  button-nav-cta:
    backgroundColor: "{colors.society-orange}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
  block-card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px"
  masthead:
    backgroundColor: "{colors.field-olive}"
    textColor: "{colors.cream-on-olive}"
    padding: "16px 20px 14px"
  topnav:
    backgroundColor: "{colors.field-olive}"
    textColor: "{colors.cream-on-olive}"
    padding: "14px 0"
    height: "64px"
---

# Design System: Elevate Your Smoke

## Overview

**Creative North Star: "The Field Card"**

Elevate Your Smoke is a Society PT card expressed two ways on one identity: at `/` as a **Mission Poster Cascade** — full-bleed olive and cream poster acts that prove the card, then stamp the CTA — and at `/app` as a **cream phone column** on an olive field with ember glow. No device chrome on the marketing site; no full-bleed poster shell inside the workout. Society orange seals actions; it never paints the whole surface.

Personality is direct and Society-proud: heavy Syne headlines, tight uppercase labels, Outfit body that stays readable. Density is ordered — one job per act or sheet, not dashboard card nests. Visual rejections confirmed by the build: no purple AI defaults, no glassmorphism costume, no phone-column wrapper on `/`.

**Key Characteristics:**
- Dual shells: Mission Poster Cascade at `/` (measure ~72rem); phone-column Field Card at `/app` (max ~430px; ~720px ≥900px)
- Olive field bands ↔ cream paper acts (site); cream paper interiors + olive mastheads + dark workout player (app)
- Ember orange seals primary action; Accent Text for orange-on-cream; Soft Ember for light marks on olive
- Syne display + Outfit body; pill CTAs that stamp the next move
- Flat tonal surfaces; phone lift shadow only on `#app`; poster depth from photo, gradients, and act bands

## Colors

A restrained Society palette: olive field, cream paper, ink type, ember seal — shared by both shells.

### Primary
- **Society Orange** (`society-orange`): fills primary CTAs, nav seal, progress/focus marks, demo play. The action color.
- **Accent Text** (`accent-text`): orange readable on cream (ranks, timeline weeks, metric highlights). **Never** use raw Society Orange as small text on cream.
- **Soft Ember** (`soft-ember`): light ember on olive — nav link hover, phase time marks, link hover on dark bands.

### Secondary
- **Field Olive** / **Field Olive Soft** (`field-olive` / `field-olive-soft`): site body ground, sticky topnav, olive acts, app mastheads, inverted blocks, rest-state player. Society timber/field identity.

### Neutral
- **Cream BG** (`cream-bg`): cream acts (with paper grain) and phone shell.
- **Paper / White** (`paper-surface` / `white-surface`): blocks, tab bases, forms.
- **Ink** (`ink`): primary type and ink buttons.
- **Muted** (`muted`): secondary copy, placeholders, fine print.
- **Cream on Olive** (`cream-on-olive`): type and icons on olive/player.
- **Player Void** (`player-void`): workout demo/player grounds.
- **Danger** (`danger`): destructive controls and errors only.
- **Accent Ink** (`accent-ink`): text on Society Orange fills.

### Named Rules
**The Ember Rarity Rule.** Society Orange is the seal, not the paint. Prefer cream + olive + ink; orange marks the next action or a scarce status.

**The Readable Ember Rule.** On cream/paper, orange text uses Accent Text. Fill orange is for buttons, bars, and marks on dark or as a large fill. Soft Ember is for light marks on olive only.

## Typography

**Display Font:** Syne (system-ui fallback)  
**Body Font:** Outfit (system-ui / -apple-system fallback)  
**Label Font:** Outfit uppercase tracking

**Character:** Syne is wide, heavy, and brief — brand plane, league names, countdowns. Outfit is the working voice for proof lines, fine print, and forms.

### Hierarchy
- **Display / H-XL** (800, ~48px → ~34px ≤640px, lh ~0.92): marketing hero brand plane and app cover heroes.
- **Headline / H-LG** (800, ~34px → ~24px on narrow site acts): act and screen titles.
- **Title / H-MD** (800, ~24px): section titles, league names in splits.
- **Body / Lede** (400–600, ~15.5px, lh 1.55): primary reading; site lede max ~28–34rem in hero/acts.
- **Fine** (400–600, ~12.5px): supporting copy in muted / cream-muted on olive.
- **Label** (600–700, ~11px, tracking ~0.08–0.16em, uppercase): nav links, tool labels, meta — not decorative marketing kickers.

### Named Rules
**The Brief Headline Rule.** Display lines stay short and punchy; put explanation in Outfit body, not in Syne paragraphs.

**The Brand Plane Rule.** On the marketing first viewport, “Elevate Your Smoke” is the hero display; one proof lede; no competing display stack.

## Layout

**The Two Shells Rule.** `/` and `/app` share palette and type, never composition.

- **Marketing `/` (Mission Poster Cascade):** sticky wide olive topnav; edge-to-edge hero photo (min ~100dvh / 880px); cascading full-bleed **act-olive** / **act-cream** bands; optional ember **act-seam**; content in `.wrap` at `measure` 72rem with `site-pad`. One purpose per act. First viewport: brand + one proof line + Start / Watch demo only. ≤900px: hide non-CTA nav links; keep Start seal.
- **Workout `/app`:** phone-first column — `#app` max-width 430px (720px ≥900px), min-height 100vh, centered on field gradient + ember radial. Sheet padding ~20px horizontal (28px on wide). Cover/plan are long vertical sheets; workout player is a fixed full-bleed overlay within the column. Sticky user ticker at column bottom; hides under the player.

Vertical rhythm: site acts use `act-y`; app stacks use 8 / 14 / 18px — related groups tight, section breaks generous.

## Elevation & Depth

Mostly flat. Depth comes from tonal steps (cream → white → olive invert), full-bleed photography with dual ink scrims on the hero, cream paper grain on site acts, and one ambient phone shadow on `#app`. No stacked card shadows. Hairline separators use `rgba(16,20,18,.12)` (or cream-muted lines on olive). Callouts use a **2px top accent bar**, not a thick left rail (player tips may use a thin accent edge on dark).

### Shadow Vocabulary
- **Phone lift** (`0 18px 50px rgba(16,20,18,.18)`): only the `#app` column against the field.
- **Accent seal inset** (`inset 0 0 0 2px rgba(26,15,8,.18)` plus light top hairline on site primary): stamps Society Orange pills on marketing CTAs / nav CTA.
- **Hero / act motion** (sidecar): slow Ken Burns on hero media; rise-in on hero copy; view-timeline clip reveal on acts; honor `prefers-reduced-motion`.

### Named Rules
**The Flat-By-Default Rule.** Surfaces stay flat at rest. Do not add per-card drop shadows to invent hierarchy.

## Shapes

Soft but decisive: 12px for blocks/inputs/countdown cells (`radius-sm`), 18px for larger shells and promo boxes (`radius`), full pills for primary buttons, tabs, and nav CTA, ~10px for metric/calendar cells, circular stamp for session complete. Borders are 1–1.5px line — not thick neobrutal frames. League splits and timelines are rule-divided columns, not card grids.

## Components

Flat field, bold pills — controls stamp the action without chrome noise. Primitives are shared; shells differ in width and nesting.

### Buttons
- **Shape:** full pill (`999px`); min touch ~44–48px
- **Primary (accent):** Society Orange fill, Accent Ink text, Syne 700; site adds inset seal shadow; app accent is flat fill
- **Ink:** Ink fill, paper text — secondary strong actions
- **Ghost:** transparent + 1.5px border (cream-muted on olive hero; line on cream)
- **Nav CTA:** compact orange pill in sticky topnav
- **Focus:** 2.5px Society Orange outline, 2px offset
- **Active:** slight scale (~0.97–0.98); disabled opacity ~0.45

### Chips / Tabs / Options
- **Tabs:** pill outline on white; `.on` = ink fill + cream text (site boards + app)
- **Opt rows (app):** paper blocks with checkbox; selected = ink fill + orange mark box
- **Rank / timeline week:** Accent Text on cream

### Cards / Containers
- **App block:** white surface, 1px line, 12px radius, 14px padding
- **Invert block:** Field Olive, cream type, no border
- **Site acts:** full-bleed bands, not cards — cream acts may show paper grain + ember brush mark; lists use hairline rules
- **Launch / league (app):** paper with line border

### Inputs / Fields
- **Hero fields (app):** underline ink stroke, large Syne value
- **Meta / Find:** paper fill, 10–12px radius, 1.5px line; focus → orange + focus-visible ring
- **Placeholder:** muted, not pale gray

### Navigation
- **Site topnav:** sticky olive, cream brand (Syne 21px + Outfit Society small), uppercase link row, orange Start seal; mobile keeps brand + Start only
- **App masthead:** olive gradient, cream brand, optional logout pill
- **Link buttons:** uppercase olive-soft, underline; hover/focus → Accent Text (or Soft Ember on olive); min-height 44px
- **App ticker:** olive strip, ember “LIVE”, marquee of public board names

### Signature: Mission Poster Act
Full-bleed olive or cream band; Syne act title; one Outfit lede; proof content (countdown, league split, phases, timeline, boards); CTA only after proof. Hero is photo-plane + brand plane — not an inset media card.

### Signature: Workout Player
Full-column dark void; huge Syne timer; accent primary controls; rest state shifts to olive gradient; tip callouts use accent top/edge rule.

## Do's and Don'ts

### Do:
- **Do** keep Mission Poster Cascade (full-bleed acts) for `/` and the cream phone column for `/app`.
- **Do** use Society Orange for primary CTAs and Accent Text for orange-on-cream type; Soft Ember for light marks on olive.
- **Do** preserve Brothers / Ladies naming and dual-league parity visually.
- **Do** prioritize session clarity (timer, cues, resume) over decorative chrome on `/app`.
- **Do** keep `app/index.html` and `app/elevate-your-smoke.html` visually identical.
- **Do** keep the marketing first viewport to brand, one proof line, and Start + Watch demo.

### Don't:
- **Don't** wrap the marketing site in a phone-column device shell.
- **Don't** paint large cream regions with raw #E85D04 text.
- **Don't** introduce purple gradients, glass stacks, or dashboard card grids as the page structure.
- **Don't** invent a second accent that competes with Society Orange.
- **Don't** shrink primary controls below ~44px touch height.
- **Don't** expose private fields (phone, raw weight) in public board chrome.
- **Don't** put stats, schedules, or secondary marketing chrome in the marketing first viewport.
