---
kind: frontend_style
name: Single-File CSS with Design Tokens and Utility Classes for Static Site
category: frontend_style
scope:
    - '**'
source_files:
    - CSS/style.css
    - js/script.js
    - index.html
    - about.html
    - contact.html
    - learning.html
    - login.html
---

## What system/approach is used

The site uses a **plain CSS stylesheet** (`CSS/style.css`, ~247 lines) with no preprocessor, framework, or build step. Styling is organized around **CSS custom properties (design tokens)** defined in `:root`, followed by semantic class names that follow a BEM-like naming convention (e.g., `.navbar`, `.nav-links`, `.hero`, `.module-card`). There are no component libraries, no Tailwind/Bootstrap/Sass — just one flat stylesheet consumed directly by the five HTML pages.

## Key files and packages

- `CSS/style.css` — the single source of all visual styling (reset, design tokens, layout, components, responsive rules).
- `js/script.js` — provides interactivity (mobile nav toggle, scroll effects, form handling) that complements the CSS classes like `.scrolled`, `.open`, `.show`, `.loading`.
- `assets/images/` and `assets/icons/` — static image/icon assets referenced from the HTML/CSS.
- The five HTML pages (`index.html`, `about.html`, `contact.html`, `learning.html`, `login.html`) each link to the shared `CSS/style.css`.

## Architecture and conventions

1. **Design tokens via `:root` variables.** All colors, spacing, radius, shadows, and transitions are centralized:
   - Colors: `--primary` / `--primary-dark` / `--primary-light`, `--accent` / `--accent-dark`, `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--success`, `--error`.
   - Spacing & shape: `--radius: 12px`, `--shadow`, `--shadow-lg`, `--transition: 0.3s cubic-bezier(0.4,0,0.2,1)`.
   This token layer is the single source of truth; every component references these variables rather than hard-coding values.

2. **Semantic, page-scoped class names.** Classes describe the UI element they style (`.navbar`, `.hero`, `.section`, `.modules-grid`, `.module-card`, `.contact-form-card`, `.login-card`, `.toast`, `.footer`). No utility-first approach — each class carries both meaning and presentation.

3. **Layout via CSS Grid + Flexbox.** Reusable grid patterns include `.modules-grid` (`repeat(auto-fit,minmax(280px,1fr))`), `.stats-grid`, `.approach-grid`, `.beneficiaries-grid`, `.partners-grid`, `.content-split`, and `.contact-grid`. Flexbox is used for navigation, buttons, and inline layouts.

4. **Consistent card pattern.** Cards (`.module-card`, `.objective-item`, `.approach-item`, `.beneficiary-card`, `.phase-card`, `.partner-item`, `.login-card`, `.contact-form-card`) share a common visual language: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, hover `transform: translateY(-Xpx)` plus `box-shadow: var(--shadow[-lg])`.

5. **Button system.** Three button variants — `.btn-primary`, `.btn-accent`, `.btn-outline` — built on a base `.btn` class, using the same padding, border-radius, font-weight, and transition.

6. **Responsive strategy.** Two breakpoints at `968px` and `768px` (in `@media` blocks at the bottom of the file). At `768px` the navbar collapses into a hamburger menu (`.hamburger` toggles `.nav-links.open`), hero/content grids stack to single columns, and typography scales down. No mobile-first media queries — the base styles target desktop first.

7. **Shared interactive states driven by JS-toggled classes.** The JavaScript adds/removes classes such as `.scrolled` (on navbar), `.open` (on accordion/module-detail), `.show` (on toast), and `.loading` (on login button). The CSS defines the visual state transitions for each.

## Conventions and constraints

- **All colors, radii, and shadows must come from `:root` variables** — no hardcoded hex values in component rules beyond what's already in `:root`. This is enforced by the consistent use of `var(--*)` throughout the stylesheet.
- **Card components follow a uniform structure**: surface background, border, rounded corners, hover lift + shadow. New cards should mirror this pattern.
- **Grid-based layouts use `auto-fit` + `minmax()`** for responsive card grids rather than fixed column counts.
- **Transitions are unified through `--transition`**, giving consistent timing across hover/focus states.
- **Responsive breakpoints are fixed at 968px and 768px** — new responsive behavior should extend these existing media queries rather than introducing new thresholds.
- **No CSS-in-JS, no preprocessors, no build pipeline** — changes are made directly in `CSS/style.css` and served statically.