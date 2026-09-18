---
name: LinkedIn Scrapper
description: A dense, LinkedIn-derived operator console for paced extraction — every risk, quota, and queue state legible at a glance.
colors:
  background: "#f4f2ee"
  foreground: "rgb(0 0 0 / 90%)"
  card: "#ffffff"
  card-foreground: "rgb(0 0 0 / 90%)"
  popover: "#ffffff"
  popover-foreground: "rgb(0 0 0 / 90%)"
  surface-muted: "#f9fafb"
  muted-foreground: "rgb(0 0 0 / 60%)"
  primary: "#0a66c2"
  primary-hover: "#004182"
  primary-active: "#09223b"
  primary-foreground: "#ffffff"
  primary-subtle: "#e8f3ff"
  primary-subtle-hover: "#eef3f8"
  secondary: "transparent"
  secondary-foreground: "#0a66c2"
  secondary-border: "#0a66c2"
  accent-navy: "#1d2226"
  border: "#e0dfdc"
  border-strong: "#8c8c8c"
  input: "#ffffff"
  ring: "#0a66c2"
  success: "#057642"
  success-subtle: "#e6f3ec"
  warning: "#915907"
  warning-subtle: "#fcf0db"
  danger: "#cc1016"
  danger-subtle: "#fdecec"
typography:
  display:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 2rem
    letterSpacing: "normal"
  headline:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.75rem
  metric:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 2rem
    fontFeature: "tabular-nums"
  title:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25rem
  body:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25rem
  label:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1rem
  data:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1rem
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  1.5: "0.375rem"
  2: "0.5rem"
  2.5: "0.625rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  header: "3.5rem"
  sidebar: "15rem"
  sidebar-rail: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.secondary-foreground}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.25rem"
  button-ghost-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0 1rem"
    height: "2.25rem"
  button-sm:
    height: "1.75rem"
    padding: "0 0.75rem"
    typography: "{typography.data}"
    rounded: "{rounded.full}"
  button-icon:
    height: "2.25rem"
    width: "2.25rem"
    padding: "0"
    rounded: "{rounded.md}"
  badge-neutral:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
    typography: "{typography.data}"
  badge-accent:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
  badge-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
  badge-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "2.25rem"
    typography: "{typography.body}"
  table-header-cell:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.muted-foreground}"
    padding: "0.625rem 1rem"
    typography: "{typography.data}"
  table-cell:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    padding: "0.625rem 1rem"
    typography: "{typography.body}"
  nav-item-active:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
  nav-item-hover:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.625rem"
  popover-panel:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.75rem"
---

# Design System: LinkedIn Scrapper

## Overview

**Creative North Star: "The Instrument Panel"**

This is the console of a machine that runs slowly on purpose. The palette is borrowed
wholesale from LinkedIn — the same warm paper background (#f4f2ee), the same corporate
blue (#0a66c2), the same pill-shaped buttons — because the operator spends their day
reading one system and acting in the other, and an unfamiliar skin would add a translation
step to every glance. Surfaces are white cards floating on warm paper, separated by a
hairline rather than a drop shadow. Nothing is decorative; every colored element on a
screen is reporting a state.

Density is the point. Body text is 14px, labels and metadata are 12px, and the display
sizes appear exactly twice in the whole application (the login hero and the dashboard's
stat numbers). Tables are plain server-rendered HTML with 10px vertical cell padding, so a
full page of jobs or leads fits without scrolling. The system is information-forward
admin UI, not onboarding: it assumes the reader already knows what `CHALLENGED` means and
gives them the badge, not a tour.

Status color is the system's loudest voice, and it is rationed. Five tones (neutral,
accent, success, warning, danger) each pair a subtle tinted background with its own
saturated foreground, and they appear only on badges, alerts, and the one metric that can
go bad. The chrome — sidebar, header, cards, tables — is achromatic except for the active
nav item. When something on a screen is colored, it is because it is telling the operator
about account health, quota, or a dead job.

**Key Characteristics:**

- LinkedIn-derived palette applied as semantic tokens, never as raw hex
- Hairline separation over shadow; one true elevated tier for things that float
- Pill buttons, 8px-cornered surfaces, 4px form controls
- 14px body / 12px label as the working pair; display type is rare
- Status is carried by a five-tone badge vocabulary, never by chrome color
- Fixed left rail (240px, collapsible to 64px) under a 56px sticky header

## Colors

A warm-paper neutral field with one saturated corporate blue and a four-tone status set;
every value is a CSS custom property on `:root`, surfaced as a named Tailwind utility.

### Primary

- **LinkedIn Blue** (`{colors.primary}`): The single accent. Primary buttons, active nav
  text and its 2px left spine, links inside table cells, focus rings, icon accents in stat
  cards, and the "in" brand mark. Two darker steps exist for state only — hover and active
  never appear as resting fills.
- **Blue Wash** (`{colors.primary-subtle}`): The tint behind anything selected or
  identified: active sidebar item, accent badge, avatar initials, dashboard card icon
  tiles, secondary-button hover.

### Secondary

- **Outlined Blue** (`{colors.secondary-foreground}` on `{colors.secondary}`): Not a color
  so much as a treatment — transparent fill, blue 1px border, blue label. This is the
  secondary button and the only place `secondary-border` is used.

### Tertiary

- **Deep Navy** (`{colors.accent-navy}`): Used on exactly one surface, the login brand
  panel. It is the app's only dark field and it exists to separate the unauthenticated
  world from the console.

### Neutral

- **Warm Paper** (`{colors.background}`): The page field behind every card. Never a card
  background itself.
- **Card White** (`{colors.card}`): Every raised surface — cards, tables, sidebar, header,
  form sections. The sidebar and header are white, not tinted; the rail is separated from
  content by a border, not by a fill change.
- **Cool Muted** (`{colors.surface-muted}`): The only secondary fill. Table headers, row
  hover, ghost-button hover, dialog footers, and the info alert.
- **Ink** (`{colors.foreground}`, 90% black) and **Ink Muted**
  (`{colors.muted-foreground}`, 60% black): The entire text scale. There is no third text
  weight; secondary text is achieved with opacity-derived black, not a gray hex.
- **Hairline** (`{colors.border}`) and **Strong Hairline** (`{colors.border-strong}`):
  The default border color is applied globally to `*` in the base layer, so a bare
  `border` utility is already on-system. The strong variant is reserved for checkbox
  strokes, which need to read against white.

### Status

- **Success** / **Warning** / **Danger** each ship as a saturated foreground plus a
  `-subtle` tinted background. They appear as a pair, never alone: subtle fill, saturated
  text, and (in alerts) a 20%-opacity border of the saturated tone.

### Named Rules

**The Semantic-Only Rule.** No raw hex, no `rgb()`, no arbitrary color class ever appears
in a component. Everything goes through a named utility (`bg-card`, `text-danger`,
`border-border`). ESLint enforces this with `eslint-plugin-better-tailwindcss` pointed at
`globals.css`; a raw color is a build error, not a review note.

**The Rationed Accent Rule.** Blue marks the one thing on a screen the operator would act
on next — the primary button, the active nav row, the link out. A screen with two primary
buttons has one too many.

**The Honest Status Rule.** Account health, job state, and lead stage are always rendered
as a toned Badge with the raw enum as its text (`CHALLENGED`, `DEAD`, `ENRICHED`), never
softened into prose. Danger tone is reserved for states that need a human; warning for
states that will resolve themselves (cooling down, retrying).

## Typography

**Display Font:** none — the system font stack is used at every size.
**Body Font:** the platform UI stack (`-apple-system, system-ui, BlinkMacSystemFont,
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).
**Data Font:** the platform mono stack (`ui-monospace, SFMono-Regular, Consolas,
"Liberation Mono", monospace`), applied globally to `code`, `kbd`, `pre`.

**Character:** Deliberately faceless. This is an internal instrument; the type carries no
personality of its own and spends its whole budget on hierarchy and density. Weight (400 /
500 / 600) does almost all the differentiating work, because the size ramp is only two
steps wide through most of the app.

### Hierarchy

- **Display** (600, 1.5rem, rising to 1.875rem at `lg`): The login panel headline. One
  instance in the application.
- **Headline** (600, 1.25rem): `PageHeader`'s `h1` — the page title on every dashboard
  route.
- **Metric** (600, 1.5rem, tabular-nums): Stat-card values only. Tabular figures so a
  changing count does not shift the card.
- **Title** (600, 0.875rem): Card titles, the sticky header's current-page title, form
  section legends, dialog titles. Section headings are the same size as body text and are
  distinguished by weight alone.
- **Body** (400, 0.875rem): Every paragraph, table cell, input value, and nav label.
- **Label** (600, 0.75rem): Field labels, badges, metadata lines, hints, small buttons.
  Table headers add `uppercase` plus `tracking-wide`; sidebar group headings do the same.
- **Data** (400 mono, 0.75rem): Description-list values — ids, URLs, durations, anything
  the operator might copy.

### Named Rules

**The Two-Size Rule.** Real screens are built from 14px body and 12px label. Reaching past
those two sizes means a page title, a stat number, or the login hero — and nothing else.
If a new surface wants a fourth size, it wants a different weight.

**The Copyable-Is-Mono Rule.** Any value the operator might paste elsewhere (id, URN,
URL, timestamp) renders in the mono stack at 12px. Prose never does.

## Layout

The authenticated app is a fixed left rail plus a sticky header. The rail is 240px
(`spacing.sidebar`) and collapses to a 64px icon rail (`spacing.sidebar-rail`); the
content column tracks it with `lg:ml-sidebar` / `lg:ml-sidebar-rail` and a 200ms margin
transition. The header is 56px (`spacing.header`) and the sidebar brand block matches it
exactly, so the two horizontal rules meet. Collapse state is persisted to `localStorage`
per viewer and read through an external store, so it survives navigation without a flash.

Below `lg` the rail is not present: the header exposes a hamburger and the sidebar
re-renders as an off-canvas drawer at the same 240px width, capped at 85vw, over a 40%
black scrim. Opening it locks body scroll and binds Escape.

Main content is padded `px-4 py-6`, widening to `sm:px-6 lg:px-8`. There is no max-width
container — tables are meant to use the full desktop width, and wide tables scroll
horizontally inside their own card rather than shrinking the page.

Page bodies are single-column vertical stacks with `gap-4` (16px) between blocks:
`PageHeader`, then filters, then the table or card grid. Grids are explicit and
breakpoint-stepped (stat cards `grid-cols-2 sm:grid-cols-3`; link cards
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) with `gap-3`. The internal rhythm inside a
component is 6/8/10/12px — `gap-1.5` between an icon and its label, `gap-2` in dense
rows, `gap-2.5` in nav items and popovers, `gap-3` in card content.

### Named Rules

**The Full-Bleed Table Rule.** Content is never centered in a max-width column. A table
that outgrows the viewport scrolls inside its own bordered card (`overflow-x-auto`); the
page never gains a horizontal scrollbar.

**The Stated-Ladder Rule.** Stacking is a fixed, documented ladder and nothing may invent
a rung between the existing ones. Inline dropdown `z-10` → sticky header `z-20` → desktop
sidebar `z-30` → mobile drawer and its scrim `z-40` → portaled dialog and tooltip `z-50`.
These are Tailwind's default `z-*` steps used literally; there is no z-index custom
property and no token, so a new floating surface must pick an existing rung and say which.

## Elevation & Depth

Depth is carried by hairline borders first and shadow second. Every resting surface — card,
table, stat card, form section, description list, sidebar, header — is defined by a 1px
`border-border` plus `--shadow-card`, which is itself not a drop shadow but a
20%-opacity 1px ring. The effect is a crisp edge on warm paper with no visible light
source. Nothing lifts on hover; hover changes fill (`bg-surface-muted`), never elevation.

A real drop shadow exists for exactly one class of thing: surfaces that float above the
document and must be read as temporarily on top. `--shadow-popover` adds `0 4px 12px`
black at 12% under the same ring, and it is worn by the mobile drawer, the sidebar user
menu, the typeahead results list, the tooltip bubble, and the dialog panel.

### Shadow Vocabulary

- **Card ring** (`box-shadow: 0 0 0 1px rgb(140 140 140 / 20%)`): Every resting surface.
  Applied together with `border border-border`; the two read as one crisp edge.
- **Popover lift** (`box-shadow: 0 0 0 1px rgb(140 140 140 / 20%), 0 4px 12px rgb(0 0 0 / 12%)`):
  Anything transient and overlaid — drawer, menu, dropdown, tooltip, dialog.

### Named Rules

**The Two-Shadow Rule.** There are two shadows and there will not be a third. If a surface
is part of the page, it gets the card ring; if it floats over the page and can be
dismissed, it gets the popover lift. No hover shadows, no focus shadows, no ambient glow.

**The Scrim-Is-Plain-Black Rule.** Overlay backdrops are `bg-black/40` with no blur.
Both the mobile drawer and the dialog use the same value, and the backdrop is a real
`<button>` with an accessible label, not a click-swallowing div.

## Shapes

Three corner radii and one pill, each assigned by function rather than by size.

- **Pill** (`9999px`): Buttons, badges, and filter chips — every interactive or
  status-bearing capsule. This is the strongest borrowed LinkedIn signal in the system.
- **Small** (`{rounded.sm}`, 4px): Checkboxes only.
- **Medium** (`{rounded.md}`, 8px): Controls and small chrome — inputs, selects, icon
  buttons, ghost buttons, nav items, tooltips, alerts, the brand mark, the typeahead list.
- **Large** (`{rounded.lg}`, 12px): Container surfaces — cards, tables, form sections,
  description lists, empty states, the user menu, the dialog panel.

Borders are always 1px and always `border-border` (globally defaulted in the base layer),
with three deliberate exceptions: the secondary button's blue outline, the empty state's
dashed border, and the active nav item's 2px underline in `NavTabs` / 2px left spine in
the sidebar. Table rows are separated by `divide-y divide-border`, never by alternating
fills.

### Named Rules

**The Round-What-You-Click Rule.** Anything pill-shaped is pressable or is a status
capsule. Anything with a 12px corner is a container and is not clickable as a whole —
except the dashboard link cards, which wrap a whole `Card` in a `Link` and signal it with
a `surface-muted` hover.

## Components

### Buttons

- **Shape:** Pill (`9999px`), except `ghost` and `icon`, which use the 8px control radius.
- **Sizes:** `sm` 28px tall / 12px horizontal padding / 12px text; `md` (default) 36px
  tall / 16px horizontal padding / 14px text; `icon` a 36px square with no padding.
- **Primary:** Blue fill, white label, 600 weight. Hover darkens to `primary-hover`, active
  to `primary-active`, both via `transition-colors`.
- **Secondary:** Transparent with a blue 1px border and blue label; hover fills
  `primary-subtle`.
- **Ghost:** No border or fill, foreground label, 8px corner, hover fills `surface-muted`.
  This is the chrome button (dialog close, header toggles).
- **Danger:** Solid `danger` fill with white label; hover reduces opacity to 90% rather
  than shifting hue.
- **Loading / disabled:** `loading` renders a spinning 16px `Loader2` before the label,
  sets `aria-busy`, and disables the button. Disabled is `opacity-50` plus
  `cursor-not-allowed` for every variant.
- **Links that look like buttons** use `ButtonLink`, which shares the exact `cva` recipe;
  a `next/link` styled by hand is off-system.

### Badges

- **Style:** Pill, `px-2.5 py-0.5`, 12px 500-weight text, subtle tinted background with
  matching saturated foreground. Five tones: neutral, accent, success, warning, danger.
- **Dot:** An optional 6px filled circle in the same saturated tone, for when the badge
  sits in a scannable column.
- **Usage:** Always the raw domain enum as the label.

### Filter Chips

- **Style:** Pill, 1px border, 12px 500-weight text, rendered as real `next/link`s so
  filter state lives in the URL and survives reload.
- **State:** Unselected is a hairline border with muted text and a `surface-muted` hover;
  selected inverts to a solid `primary` fill with white text and gets `aria-current`.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** `card` on the page's `background` field.
- **Shadow Strategy:** Card ring (see Elevation & Depth). Never the popover lift.
- **Border:** 1px hairline; `CardHeader` and `CardFooter` add a matching divider.
- **Internal Padding:** 16px in all three slots. `CardTitle` is 14px/600, `CardDescription`
  is 14px muted.

### Tables

- **Shell:** `Table` is a plain scroll container plus a bare `<table>` — a shell, not a
  data grid. ARCHITECTURE.md §11 forbids `@tanstack/react-table`; sorting, filtering, and
  paging are URL state resolved on the server.
- **Header:** `surface-muted` fill, bottom hairline, 12px uppercase 600-weight muted text
  with `tracking-wide`.
- **Rows:** `divide-y divide-border`, `hover:bg-surface-muted` with a color transition.
  Cells are `px-4 py-2.5`, vertically centered, and `tabular-nums` throughout so numeric
  columns align without extra classes.
- **Cell content:** The first column is usually a `text-primary` link with
  `hover:underline`; a link leaving the app appends a 12px `ExternalLink` glyph. Absent
  values render as an em dash (`—`), never as blank or "N/A". Long values get
  `max-w-48 truncate` plus a native `title`.
- **Empty:** A table with no rows is not rendered; the component returns `EmptyState`
  instead.
- **Actions column:** Today this is a trailing `Actions` header whose cells hold a
  left-aligned `flex gap-2` row of text `<Button size="sm">` controls, each wrapped in its
  own `<form>` with hidden inputs so the mutation is a real Server Action post. This is the
  current convention, recorded as built; it is the weakest part of the table language
  (text labels cost a column's worth of width) and is the place to change first.

### Inputs / Fields

- **Input / Select:** 36px tall, 8px corner, 1px hairline, `input` (white) fill, 14px text,
  muted placeholder. Select is `appearance-none` with a 16px `ChevronDown` absolutely
  positioned at right and `pointer-events-none`.
- **Focus:** Border shifts to `primary` and a 2px `primary/20` ring appears; the native
  outline is removed on the control because the ring replaces it. Everywhere else in the
  app, `:focus-visible` gets a global 2px `ring`-colored outline with 2px offset from the
  base layer.
- **Invalid:** `invalid` sets `aria-invalid` and swaps border and ring to the danger tone.
- **Disabled:** `opacity-50` and `cursor-not-allowed`, matching buttons.
- **Field:** Labels are 12px/600 muted, stacked `gap-1.5` above the control. `Field` wraps
  label, control, and hint in a single `<label>` element and relies on implicit
  association — there is no `id`/`htmlFor` plumbing at any call site, by design. A `hint`
  renders below the control in 12px muted normal weight; an `error` replaces it in the same
  slot in danger tone.
- **Checkbox:** A 16px native input with `accent-primary` and a `border-strong` stroke,
  nested in a label with its text and optional hint. This one does take an `id`/`htmlFor`
  pair, because the label wraps text that sits beside rather than under the box.
- **FormSection:** A `<fieldset>` styled as a card (12px corner, hairline, card fill, card
  ring, 16px padding) with a 12px/600 `<legend>` and an optional muted description.

### Navigation

- **Sidebar:** White, right hairline, grouped. Group headings are 11px uppercase 600-weight
  muted and disappear entirely when collapsed. Items are 8px-cornered rows,
  `px-2.5 py-2`, 14px/500, with an 18px Lucide icon. Active is `primary-subtle` fill,
  `primary` text, `aria-current="page"`, and a 2px blue spine pinned to the row's left
  edge. Inactive hover fills `surface-muted`. Collapsed items center their icon and move
  the label into a native `title`.
- **Header:** Sticky, 56px, white, bottom hairline. Left: a mobile menu button and a
  desktop collapse toggle, each a 36px ghost square. Center: the current page title derived
  from the nav table by longest-prefix match. Right: a single `sm` primary action.
- **NavTabs:** Sub-navigation inside a page (used by `/config`). A bottom-hairline row of
  14px/500 links with a 2px bottom border pulled up by `-mb-px`; active is blue border plus
  blue text, inactive is transparent border plus muted text with a foreground hover.

### Overlays

- **Dialog:** Portaled to `document.body`, `z-50`, centered with 16px viewport padding.
  Panel is `popover` fill, 12px corner, hairline, popover lift, capped at `85vh` with an
  internally scrolling body. Widths are `sm` / `md` / `lg` = `max-w-sm` / `max-w-lg` /
  `max-w-2xl`. Header is a 14px/600 title with an optional 12px muted description and a
  ghost icon close; `DialogFooter` bleeds to the panel edges with a `surface-muted` fill,
  top hairline, and right-aligned buttons. `ConfirmDialog` is the `sm` specialization:
  body copy, a secondary Cancel, and a danger confirm.
- **Mobile drawer:** The only bespoke overlay. Same scrim and lift as the dialog but slid
  to the left edge at `w-sidebar max-w-[85vw]`, with `role="dialog"` and `aria-modal`.
- **User menu:** A bottom-anchored 256px popover above the sidebar footer trigger, 12px
  corner, popover fill and lift, closed by outside pointerdown or Escape (which returns
  focus to the trigger). Contains avatar, name, email, a role badge, and the danger-tinted
  sign-out row.
- **Tooltip:** A `z-50` 12px bubble above its trigger, popover fill and lift, `max-w-64`,
  `pointer-events-none`. Opens on hover *and* focus, and exposes its `id` so a caller can
  wire `aria-describedby`.
- **Typeahead results:** An absolutely positioned `z-10` list under its input, 8px corner,
  popover fill and lift, rows are full-width left-aligned buttons with a `surface-muted`
  hover. This is the lowest rung of the ladder and is correct: it belongs to the form, not
  to the page.

### Feedback Surfaces

- **Alert:** 8px corner, 1px border, 12px padding, 14px text, with a 16px Lucide icon
  aligned to the first line. Info borrows the neutral card language; success, warning, and
  error use the subtle fill, saturated text, and a 20%-opacity border of their tone. Error
  gets `role="alert"`, everything else `role="status"`.
- **EmptyState:** A dashed-hairline 12px-cornered panel, `px-6 py-12`, centered, with a
  32px muted icon (`Inbox` by default), a 14px/500 title, an optional muted description
  capped at `max-w-sm`, and an optional action. This is what a zero-row table renders.
- **StatCard:** Card-ring surface with a 12px/600 muted label opposite a 16px icon, and a
  24px/600 tabular number below. `tone="danger"` turns both icon and number red — the one
  place a metric is allowed to change color. With `href` the whole card becomes a link with
  a `surface-muted` hover.
- **DescriptionList:** A `<dl>` card of `divide-y` rows; muted 14px term on the left,
  right-aligned 12px mono value on the right. The canonical read-only detail panel.
- **Spinner:** A 16px `Loader2` with `animate-spin`, `aria-hidden`. There is no page-level
  loading overlay and no skeleton vocabulary.
- **Avatar:** A 32px `primary-subtle` circle with 12px/600 blue initials derived from name
  or email. Always `aria-hidden` — the name is adjacent in text.

### Iconography

Lucide React, `aria-hidden` on every instance, sized in three steps: 12px inline in table
links, 16px as the default beside text, 18px in sidebar nav rows, 20px in header chrome,
32px in empty states. Icons never appear without a text label except in the 36px icon
buttons, which carry an `aria-label`.

## Do's and Don'ts

### Do:

- **Do** compose new screens from `src/components/ui/` primitives and put app chrome in
  `src/components/shared/app-shell/`; a component file stays under 150 lines
  (AGENTS.md §4.1).
- **Do** reach for a named utility for every color, radius, shadow, and layout dimension
  (`bg-card`, `rounded-lg`, `shadow-card`, `w-sidebar`, `h-header`). If a value is missing,
  add a token to `globals.css` and map it in `@theme inline`.
- **Do** give a table its `Actions` header only when there are actions, and keep each
  mutation in its own `<form>` with hidden inputs so it works as a Server Action post.
- **Do** render every domain state as a toned `Badge` with the raw enum as its label, and
  every absent value as an em dash.
- **Do** use `EmptyState` instead of an empty table, and `Alert` instead of inline red
  prose for anything that is a real error.
- **Do** pick an existing rung of the z-index ladder (10/20/30/40/50) and say which one in
  a comment when adding a floating surface.
- **Do** use `shadow-card` for anything that is part of the page and `shadow-popover` for
  anything that floats over it.
- **Do** nest the control inside `Field`'s `<label>` and let implicit association do the
  work; add `id`/`htmlFor` only where the label text sits beside the control (Checkbox).
- **Do** route new modals through `Dialog` / `ConfirmDialog` rather than building a second
  overlay.

### Don't:

- **Don't** write a raw hex, `rgb()`, or an arbitrary color class. ESLint's
  `better-tailwindcss` rule (entry point `src/app/globals.css`) makes it a hard error.
- **Don't** use Tailwind v3's `[--x]` arbitrary-value syntax, as the stylesheet header
  states. Use the named utility, or v4's `(--x)` shorthand for a genuine one-off.
- **Don't** add a third shadow, a hover elevation, or a blurred scrim. Two shadows and
  `bg-black/40`.
- **Don't** introduce a data-grid library for tables; ARCHITECTURE.md §11 forbids
  `@tanstack/react-table`, and sorting/filtering/paging belong in URL state on the server.
- **Don't** add a font size outside the ramp. Two arbitrary sizes (`text-[11px]`,
  `text-[10px]`) already exist in the build and are drift, not precedent.
- **Don't** set `data-theme` or ship a theme switcher on the assumption that dark mode
  works. The dark palette is defined and complete in `globals.css` but nothing in the
  application writes the attribute — it is dormant, and wiring it is its own change with
  its own review.
- **Don't** invent a z-index between the documented rungs, and don't add a z-index custom
  property without deciding the whole ladder at once.
- **Don't** use `window.confirm` for a destructive action. `ConfirmDialog` exists for
  exactly this.
- **Don't** use a text character as an icon. Lucide covers every case in use.
- **Don't** center page content in a max-width column or shrink a table to fit; tables
  scroll inside their own card.
