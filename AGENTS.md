# Workspace Agent Rules & Standards

## Frontend Aesthetics & Anti-AI UI Standards

### <frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.

- **No generic cards**: Do not use plain white cards with a subtle gray border, a tiny muted subtitle, and a generic icon in the top corner.
- **Reject AI color palettes**: Avoid default monochromatic slop, excessive soft pastel glows, random floating background blur orbs, and generic indigo-to-purple gradients.
- **Stop fake data**: Never use cliché placeholder names like "Acme Corp," "Jane Doe," or generic futuristic metrics that mean nothing.
- **No generic layouts**: Avoid the predictable 3-column feature grid with centered text and an icon on top, or hero sections with a centered badge saying "v2.0 is live."
- **Design with intent**: Build high-contrast, bold, distinct layouts that match the actual product type instead of using a safe, sterile dashboard template.
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial, Roboto, and Inter. Watch for second-order convergence (e.g., defaulting to Space Grotesk across all generations).
- **Color & Theme**: Commit to a cohesive aesthetic. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
- **Backgrounds**: Create atmosphere and depth with purpose rather than defaulting to solid colors or cliché blur orbs.

### <icon_policy>
CRITICAL: Standardize on clean, purposeful vector icon components.
- Never use mismatched icon styles.
- NEVER use raw emoji characters as icons or status badges in production code.

### <no_emoji_policy>
STRICT: Never use emoji characters anywhere in generated code.
- No emoji in JSX text, button labels, placeholders
- No emoji in error messages or status indicators
- No emoji in comments or console.log statements
- Use professional SVG/vector icons for all visual indicators instead.

### <performance_best_practices>
- **Eliminating Waterfalls**: Use `Promise.all()` for independent async operations. Never sequential awaits for independent data.
- **Bundle Size**: Import directly from subpaths, not barrel files. Use dynamic imports (`next/dynamic` or `React.lazy`) for heavy components.

### <accessibility_basics>
- Interactive elements must be keyboard accessible (`<button>` instead of `<div onClick>`).
- All images must have meaningful alt text.
- Respect `prefers-reduced-motion: reduce`.
- Use semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`.
