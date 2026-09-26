# PieceUp Marketing Website (Design Spec)

**Date:** 2026-09-26
**Status:** Approved in chat, implementing

## 1. Purpose

A static marketing website for PieceUp, a Shopify app that turns a discount
into a jigsaw-puzzle game on the storefront (see
[project_pieceup_app memory] / the sibling repo
`PieceUp-Puzzle-App` for full product facts). The site's job is to sell the
app to Shopify merchants browsing or considering it, and to send them to the
real Shopify App Store listing to install it.

Audience: Shopify merchants evaluating conversion/gamification apps.
Success: a visitor understands what the app does within seconds (helped by
actually playing a working demo of it), sees real pricing, and clicks
through to the App Store listing.

## 2. Scope

Plain, static HTML/CSS/vanilla JS. No build step, no framework, no backend,
no server-rendered content. Five pages, sharing two files:

- `index.html` — hero, **live playable puzzle demo**, feature highlights,
  pricing teaser, footer
- `features.html` — every feature in depth, illustrated with the real
  Shopify App Store screenshots
- `pricing.html` — Free / Pro / Premium, mirroring `app/lib/plans.ts` in the
  app repo exactly
- `about.html` — PieceUp's story and 34devs
- `contact.html` — support contact, a `mailto:`-based contact form
- `assets/style.css` — shared styles (design tokens + components)
- `assets/script.js` — shared behavior: nav, and the puzzle demo (only runs
  where the puzzle markup exists)
- `assets/screenshots/*.webp` — the five real App Store listing images,
  copied in as-is (not recreated in CSS)

Every page repeats the same header/footer markup by hand — no templating
layer, matching the "plain HTML/CSS" ask and avoiding a build tool for five
pages.

Out of scope: real backend, real contact-form submission, a language
switcher (English only), customer testimonials/reviews (the App Store
listing has zero reviews right now — inventing any would be dishonest and
against site-publishing rules).

## 3. Visual design system

Sourced directly from the five App Store listing screenshots provided.

**Color tokens:**
- `--accent: #FF1461` — primary pink/magenta (buttons, links, active states),
  taken directly from the puzzle editor's accent-color swatch in the
  screenshots
- `--accent-dark: #C81155` — hover/pressed state for accent
- `--ink: #141414` — headline text, primary (dark) buttons
- `--ink-soft: #55525c` — body copy
- `--muted: #8b8890` — captions, meta text
- `--pill-bg: #FDE3EC` / `--pill-text: #B0295A` — small pink pill badges
  (feature tags, "Recommended" markers)
- `--card-bg: #FFFFFF`, `--card-border: #F1E9EA` — white cards with a soft
  shadow, on top of the gradient backdrop
- `--bg-gradient` — a soft blurred radial gradient moving pink → orange →
  yellow (`#FFD9E8 → #FFB199 → #FFE9A8`), used behind hero/section headers,
  matching every screenshot's backdrop
- `--good: #1F9254` — success/checkmark green (setup guide "Done" states)

**Type:** Manrope (Google Fonts) everywhere — 800 weight for headlines
(large, tight tracking, matches the bold black headline style in the
screenshots), 500/600 for UI labels, 400 for body copy. Single family, no
serif/mono pairing needed for this kind of page.

**Components:** pill badge, white feature card with icon + heading + body,
stat tile (big number + label, like the analytics screenshot), primary
button (solid `--ink`, white text) and accent button (solid `--accent`),
browser-chrome mockup frame (three dots, used to frame a couple of static
screenshots the way the app store listing does).

## 4. The live puzzle demo (index.html centerpiece)

A real drag-and-drop jigsaw, not a screenshot or video — this is the
distinguishing ask.

- One demo image, cut into a 3×3 grid client-side using
  `background-image` + `background-position` per tile (no server-side image
  processing available, so CSS background slicing on a single `<img>`'s
  dimensions is the mechanism).
- Left: the empty board (9 dashed drop slots). Right: a "tray" of the 9
  pieces in shuffled order, draggable (HTML5 drag-and-drop API, no library).
- A piece dropped on its correct slot snaps in; dropped on the wrong slot,
  it bounces back to the tray (matching the app's real
  `wrongPieceBehaviour: "return"` default).
- On completion: a confetti burst (small vanilla-JS/CSS confetti, no
  library) and a reward panel appears showing a discount-style code (e.g.
  `PIECEUP10`) with copy "This is a demo — real puzzles mint a real, one-time
  Shopify code." The label makes clear it's illustrative, so the site never
  implies a real discount is being issued.
- A "Reset" control re-shuffles and lets a visitor try again.
- Keyboard/touch: HTML5 DnD covers mouse; for touch and keyboard a simple
  fallback (tap a tray piece, then tap a slot to place it) so the demo isn't
  mouse-only.

## 5. Page content outlines

**index.html:** nav; hero (headline "Turn browsing into playing", subhead,
primary CTA → real App Store URL, secondary "Try the demo below" anchor
link); the live puzzle demo section; a 3-icon "how it works" strip (build →
trigger → reward); feature highlight grid (4-5 cards: custom puzzles, reward
types, triggers & frequency, analytics & revenue, A/B testing) each linking
into `features.html`; pricing teaser (3 compact cards, "See full pricing" →
`pricing.html`); footer.

**features.html:** one detailed section per feature area, each paired with
one of the five real screenshots in a browser-chrome frame; sourced from the
app's actual README/schema, not invented.

**pricing.html:** Free/Pro/Premium cards with the exact numbers from
`plans.ts` (see memory) — 100 rewards/1 puzzle free; $9.99 1,000
rewards/unlimited puzzles/analytics; $19.99 unlimited/A/B testing/priority
support; 7-day trial note on paid plans; CTA on every card → App Store URL.

**about.html:** short narrative on why PieceUp exists (turning a discount
into something a shopper enjoys rather than just clicking a popup closed),
what it's built with (briefly, credibility, not a tech deep-dive), 34devs as
the maker, link to the app's privacy policy.

**contact.html:** support email `info@34devs.com` as a card, plus a
`mailto:`-based form (name/email/message fields) that opens the visitor's
mail client pre-filled to that address on submit — no backend involved.

## 6. Real assets used

The five App Store listing screenshots (`assets/screenshots/`) are used
verbatim as feature illustrations on `index.html`/`features.html` — no
recreation of the admin dashboard/A-B-test UI in CSS, since a pixel-accurate
copy already exists and is more honest than an approximation.

## 7. Testing

No test framework for a static site; verification is manual: open each page
in a browser, confirm the puzzle demo is actually playable end-to-end
(drag, wrong-slot bounce, completion, confetti, reset) with mouse and with
the tap-to-place fallback, check responsive layout at phone width, and check
every CTA points at the real App Store URL.
