# THEME_TOKENS — Vikshep site (lifted from Omnipulse/site/)

## Source of truth
`/Users/shekhawat/Desktop/omnipulse/site/` — do not modify.

---

## CSS variables (`app/globals.css`)

```css
:root {
  --bg:          #FBF1E6;   /* warm off-white page background */
  --bg-elev:     #F9F6F0;   /* slightly elevated surface (cards, code bg) */
  --ink:         #1B1B1F;   /* primary text / accent colour */
  --ink-mute:    #4A4A52;   /* secondary / muted text */
  --rule:        rgba(27,27,31,0.12);  /* hairline borders */
  --accent:      #1B1B1F;   /* same as --ink; used for eyebrow + wordmark symbol */
  --signal-warm: #C2461F;   /* warm orange-red for signals / CTAs */
  --accent-cyan: transparent; /* not used in light theme */
  --glow:        none;
}
```

No dark theme variant shipped in omnipulseid.

---

## Fonts (`app/layout.tsx` — via `next/font/google`)

| Alias       | Google Font         | Weights      | CSS variable           | Use                    |
|-------------|---------------------|--------------|------------------------|------------------------|
| sans        | Inter               | variable     | `--font-inter`         | body, nav, UI          |
| serif       | Source Serif 4      | 300, 400     | `--font-source-serif`  | h1/h2 display headings |
| mono        | JetBrains Mono      | variable     | `--font-jetbrains`     | code, eyebrow, badges  |

All three added as `variable` class on `<html>`. `display: "swap"`.

---

## Tailwind config (`tailwind.config.ts`)

### Colors (semantic aliases over CSS vars)
```
bg, bg-elev, ink, ink-mute, accent, signal-warm, accent-cyan
```

### Font families
```
sans  → var(--font-inter)
serif → var(--font-source-serif)
mono  → var(--font-jetbrains)
```

### Font sizes
| Token       | Value                    | Line-height | Letter-spacing |
|-------------|--------------------------|-------------|----------------|
| display     | clamp(56px,7.2vw,112px)  | 1.02        | -0.02em        |
| section     | clamp(36px,4.4vw,64px)   | 1.05        | —              |
| eyebrow     | 14px                     | 1.4         | 0.18em         |
| body-lg     | 19px                     | 1.55        | —              |
| body        | 16px                     | 1.6         | —              |
| mono        | 14px                     | 1.55        | —              |

### Layout
- `maxWidth.grid` = 1280px
- `spacing.section` = 96px, `spacing.section-mobile` = 56px
- `boxShadow.glow` = `var(--glow)`

### Grid pattern
`.grid-12` = `grid-template-columns: repeat(12,1fr); gap:24px; max-width:1280px; margin:0 auto; padding:0 24px;`
Mobile: 4 columns, gap 16px, padding 16px.

---

## Section padding
```css
section { padding: 96px 0; }
@media (max-width:768px) { section { padding: 56px 0; } }
```

---

## Component patterns

### Navbar (`components/Navbar.tsx`)
- Fixed, `z-50`, height 64px, border-bottom `var(--rule)`, bg `var(--bg)`
- Wordmark: `font-serif text-xl font-light` — symbol `Ω` in `var(--accent)` + product name
- Nav links: `font-mono text-[13px] uppercase tracking-[0.12em]`, color `var(--ink-mute)`, hover `opacity-60`
- Right CTA: bordered button `px-4 py-2 border`, `font-mono text-[12px] uppercase tracking-[0.12em]`

### Footer (`components/footer/SiteFooter.tsx`)
- 4-column grid (2 on mobile), padded 24px, max-w 1280px
- Wordmark col (col-span-2): serif font, muted mono subline, Apache-2.0 + email
- Nav columns: `font-mono text-[11px] uppercase tracking-[0.16em]` headings; `font-mono text-[12px]` links
- Legal row: `font-mono text-[11px]` links, `var(--ink-mute)` colour
- Copyright: same mono text

### Eyebrow (`components/primitives/Eyebrow.tsx`)
`font-mono text-[14px] uppercase tracking-[0.18em] leading-[1.4]`, color `var(--accent)`

### PackageBadge / copy button (`components/primitives/PackageBadge.tsx`)
`flex items-center gap-3 px-4 py-2 border`, bg `var(--bg-elev)`, code `font-mono text-[13px]`
"copy" / "copied" toggle in `font-mono text-[11px] uppercase tracking-[0.1em]`

### Module stack card
Border box, `font-mono text-[11px] uppercase tracking-[0.18em]` header, per-module row:
code name left, version + channel badge right; channel badge `px-1.5 py-0.5 border`

### Framer-motion entrance pattern
```tsx
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, ease: "easeOut" }}
// stagger: delay: 0.1 * index
```

---

## Dependencies (omnipulseid `package.json` key deps)
- next, react, react-dom, typescript
- tailwindcss, postcss, autoprefixer
- framer-motion
- clsx
- next/font (built-in)
