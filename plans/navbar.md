### NavBar plan

- **Goal**: Create a reusable `NavBar` that matches existing styling, place it on the home page (and optionally all pages), and ensure clicking the "Texas DOGE" brand at top-left navigates to the home page (`/`).

- **Files to add/modify**:
  - `components/ui/navbar.tsx` (new)
  - `app/page.tsx` (use NavBar on home)
  - Optional: `app/layout.tsx` (to render NavBar globally across all pages)

### 1) Create `components/ui/navbar.tsx`
- Add a client component with a semantic `nav` element and a centered container.
- Left: brand link to `/` that reads "Texas DOGE" and visually matches homepage typography/colors.
- Right: simple links (e.g., Analyst) and/or a menu icon using existing design tokens.
- Use Tailwind classes aligned with current theme: `bg-stone-50`, `text-slate-900`, `border-stone-200`, `px-6 lg:px-16`, height ~64px.

Example structure (plan-only):
```tsx
'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NavBar() {
  return (
    <nav className="w-full bg-stone-50 border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6 lg:px-16">
        {/* Brand (click to go home) */}
        <Link href="/" aria-label="Go to home" className="group">
          <span className="text-xl font-bold text-slate-900 font-serif tracking-wide group-hover:opacity-80">
            Texas DOGE
          </span>
        </Link>
        {/* Right-side actions */}
        <div className="flex items-center gap-3">
          <Link href="/analyst">
            <Button variant="outline" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
              Analyst
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

Notes:
- Use `font-serif` and `text-slate-900` to match the home hero styling; keep it simple as a single-line brand in the nav.
- Keep background `bg-stone-50` to blend with the home page’s main background.
- Use existing `Button` styles for consistent look and feel.

### 2) Integrate on the home page (`app/page.tsx`)
- Remove the current header block at the top and render `NavBar` instead to keep styling/layout consistent.
- Import and render at the top of the component tree so the rest of the page content remains unchanged.

Steps:
- Import: `import { NavBar } from '@/components/ui/navbar'`
- Replace the header section with `<NavBar />`.

Minimal change example (plan-only):
```tsx
import { NavBar } from '@/components/ui/navbar'

export default function Home() {
  return (
    <div className="bg-stone-50 text-slate-900 min-h-screen">
      <NavBar />
      {/* Existing content continues here */}
    </div>
  )
}
```

### 3) Optional: Render globally via `app/layout.tsx`
- If you want the NavBar on all pages (recommended for consistency), place it in `app/layout.tsx` just inside the `<body>` tag, above `{children}`.
- Ensure there’s no duplicate per-page header once this is done.

Example (plan-only):
```tsx
import { NavBar } from '@/components/ui/navbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="...">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
```

### 4) Maintain styling parity
- Colors/typography: `bg-stone-50`, `text-slate-900`, `font-serif` for brand, `tracking-wide` for subtle spacing.
- Spacing: `px-6 lg:px-16` to match home page gutters; `max-w-7xl mx-auto` for consistent width.
- Borders: `border-b border-stone-200` like other separators in the app.
- Interaction states: Use existing `Button` variants; ensure hover/focus states visible.

### 5) Behavior: brand click navigates home
- The brand is a `Link` to `/`. This ensures clicking "Texas DOGE" always returns to the home page from any route.
- Add `aria-label="Go to home"` for accessibility.

### 6) QA checklist
- Run the app; verify the nav renders at the top of the home page and matches colors/spacing.
- Click the brand text; it should route to `/` without full page reload.
- Navigate to `/analyst`; verify appearance remains consistent and brand link still returns to `/` (if using global layout).
- Confirm no layout shift at the top of pages; nav height is consistent (~64px).
- Check dark mode (if used); colors should remain legible using token-based Tailwind classes.

### 7) Follow-ups (optional)
- Add active link styles with `usePathname()` for current route.
- Add a mobile menu (hamburger) if more links are needed.
- Extract typography into a `BrandMark` component if brand styling becomes more complex.
