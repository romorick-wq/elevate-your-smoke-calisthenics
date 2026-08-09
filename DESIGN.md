---
name: Elevate Your Smoke
description: The Cigar Society’s phone-first 30-day calisthenics card — olive field, cream phone, ember orange seal.
colors:
  society-orange: "#E85D04"
  accent-text: "#A03E02"
  accent-ink: "#1A0F08"
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
    fontWeight: 800
    letterSpacing: "-0.03em"
    lineHeight: 0.95
  headline:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    letterSpacing: "-0.03em"
    lineHeight: 0.95
  title:
    fontFamily: "Syne, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, system-ui, -apple-system, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
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
components:
  button-primary:
    backgroundColor: "{colors.society-orange}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.pill}"
    padding: "15px 18px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-surface}"
    typography: "{typography.display}"
    rounded: "{rounded.pill}"
    padding: "15px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "15px 18px"
  block-card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px"
  masthead:
    backgroundColor: "{colors.field-olive}"
    textColor: "{colors.cream-on-olive}"
    padding: "16px 20px 14px"
---

# Design System: Elevate Your Smoke

## Overview

**Creative North Star: "The Field Card"**

Elevate Your Smoke reads as a military PT card issued on a dark olive field. The product lives in a cream phone column — paper-like, dense with purpose — while the viewport beyond is a soft field gradient with an ember glow. Society orange seals actions; it never paints the whole surface.

Personality is direct and Society-proud: heavy Syne headlines, tight uppercase labels, Outfit body that stays readable on a phone. Density is high but ordered — sheets stack with clear rhythm, not dashboards of competing cards. Visual rejections already confirmed by the incumbent: no purple AI defaults, no glassmorphism costume, no multi-layer card nests as page structure.

**Key Characteristics:**
- Phone-column composition (max ~430px; ~720px on wide) centered on an olive field
- Cream paper interiors with olive mastheads and dark workout player
- Ember orange for primary action and rare text accents (`accent-text` on light)
- Syne display + Outfit body; pill CTAs that stamp the next move
- Flat tonal surfaces; one soft phone shadow for lift of the whole device, not every block

## Colors

A restrained Society palette: olive field, cream paper, ink type, ember seal.

### Primary
- **Society Orange** (#E85D04): fills primary CTAs, progress bars, focus rings, demo play marks, and rare highlights. Use as fill on dark ink or alone as the action color.
- **Accent Text** (#A03E02): orange readable on cream for labels, ranks, day chips, and timeline markers. **Never** use raw Society Orange as small text on cream.

### Secondary
- **Field Olive** (#2F3B2A) / **Field Olive Soft** (#3F4F38): mastheads, inverted blocks, ticker ground, rest-state player gradients. Carries Society timber/field identity.

### Neutral
- **Cream BG** (#ECEAE4): phone shell background.
- **Paper / White surfaces** (#F7F6F2 / #FFFFFF): blocks, stats, forms.
- **Ink** (#101412): primary type and ink buttons.
- **Muted** (#5E6660): secondary copy, placeholders, fine print.
- **Cream on Olive** (#F4F7EE): type and icons on olive/player.
- **Player Void** (#0E110F): full-screen workout player ground.
- **Danger** (#C43C2C): destructive controls and errors only.

### Named Rules
**The Ember Rarity Rule.** Society Orange is the seal, not the paint. Prefer cream + olive + ink; orange marks the next action or a scarce status.

**The Readable Ember Rule.** On cream/paper, orange text uses Accent Text (#A03E02). Fill orange (#E85D04) is for buttons, bars, and marks on dark or as a large fill.

## Typography

**Display Font:** Syne (system-ui fallback)  
**Body Font:** Outfit (system-ui / -apple-system fallback)  
**Label Font:** Outfit uppercase tracking

**Character:** Syne is wide, heavy, and brief — league names and countdowns. Outfit is the working voice for cues, fine print, and forms.

### Hierarchy
- **Display / H-XL** (800, ~48px, lh 0.95): cover heroes (“Two leagues. One standard.”).
- **Headline / H-LG** (800, ~34px): screen titles.
- **Title / H-MD** (800, ~24px): section titles inside sheets.
- **Body / Lede** (400–600, ~15.5px, lh 1.55): primary reading; keep measure comfortable on the phone column.
- **Fine** (400–600, ~12.5px): supporting copy in muted.
- **Label / Eyebrow** (600, ~11px, tracking ~0.16em, uppercase): section markers and meta.

### Named Rules
**The Brief Headline Rule.** Display lines stay short and punchy; put explanation in Outfit body, not in Syne paragraphs.

## Layout

Phone-first column: `#app` max-width 430px (720px ≥900px), min-height 100vh, centered on the field. Sheet padding ~20px horizontal (28px on wide). Vertical rhythm uses 8 / 14 / 18px stacks; related groups tight, section breaks generous. Cover and plan are long vertical sheets; the workout player is a fixed full-bleed overlay within the column. Sticky user ticker sits at the column bottom and hides under the player.

## Elevation & Depth

Mostly flat. Depth comes from tonal steps (cream → white blocks → olive invert) and one ambient phone shadow on `#app` (`0 18px 50px rgba(16,20,18,.18)`). No stacked card shadows. Hairline separators use `rgba(16,20,18,.12)`. Callouts use a **2px top accent bar**, not a thick left rail.

### Shadow Vocabulary
- **Phone lift** (`box-shadow: 0 18px 50px rgba(16,20,18,.18)`): only the device column against the field.

### Named Rules
**The Flat-By-Default Rule.** Surfaces stay flat at rest. Do not add per-card drop shadows to invent hierarchy.

## Shapes

Soft but decisive: 12px for blocks/inputs (`radius-sm`), 18px for larger shells, full pills for primary buttons and tabs, ~10px for calendar cells, circular stamp for session complete. Borders are 1–1.5px line or accent left-rules for notes/tips — not thick neobrutal frames.

## Components

Flat field, bold pills — controls stamp the action without chrome noise.

### Buttons
- **Shape:** full pill (999px)
- **Primary (accent):** Society Orange fill, Accent Ink text, Syne 700, ~15×18 padding, min touch ~44–48px
- **Ink:** Ink fill, paper text — secondary strong actions
- **Ghost:** transparent + 1.5px line border
- **Focus:** 2.5px Society Orange outline, 2px offset
- **Active:** slight scale(0.98); disabled opacity ~0.45

### Chips / Tabs / Options
- **Tabs:** pill outline; `.on` = ink fill + cream text
- **Opt rows:** paper blocks with checkbox; selected = ink fill + orange mark box
- **Daychip / rank:** Accent Text on cream

### Cards / Containers
- **Block:** white surface, 1px line, 12px radius, 14px padding
- **Invert block:** Field Olive, cream type, no border
- **Launch / league cards:** paper with line border; accent-text kicker labels

### Inputs / Fields
- **Hero fields:** underline ink stroke, large Syne value
- **Meta / Find:** paper fill, 10–12px radius, 1.5px line; focus border → orange + focus-visible ring
- **Placeholder:** muted, not pale gray

### Navigation
- **Masthead:** olive gradient, cream brand, optional logout pill
- **Link buttons:** uppercase olive-soft, underline; hover/focus → Accent Text; min-height 44px
- **Ticker:** olive strip, ember “LIVE”, marquee of public board names

### Signature: Workout Player
Full-column dark void; huge Syne timer; accent primary controls; rest state shifts to olive gradient; tip callouts use 3px accent left rule.

## Do's and Don'ts

### Do:
- **Do** keep the cream phone on the olive field as the primary composition.
- **Do** use Society Orange for primary CTAs and Accent Text for orange-on-cream type.
- **Do** preserve Brothers / Ladies naming and dual-league parity visually.
- **Do** prioritize session clarity (timer, cues, resume) over decorative chrome.
- **Do** keep `app/index.html` and `app/elevate-your-smoke.html` visually identical.

### Don't:
- **Don't** paint large cream regions with raw #E85D04 text.
- **Don't** introduce purple gradients, glass stacks, or dashboard card grids as the page structure.
- **Don't** invent a second accent that competes with Society Orange.
- **Don't** shrink primary controls below ~44px touch height.
- **Don't** expose private fields (phone, raw weight) in public board chrome.
