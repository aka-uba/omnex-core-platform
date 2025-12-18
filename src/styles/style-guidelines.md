# Styling Strategy - Omnex Core Platform

## Canonical Rules

### 1. Mantine as Primary Styling System
- **Mantine UI v8** is the primary styling system for all component visuals
- Use Mantine theme overrides for component visuals (colors, radii, shadows, typography)
- All design tokens MUST be defined as CSS custom properties in `/src/styles/_tokens.css`
- Map CSS variables into `mantineTheme` via `src/theme.ts`
- **Disallow direct style attribute overrides on Mantine components; prefer theme override**

### 2. Tailwind CSS Usage
- **Tailwind MAY ONLY be used for layout utilities and responsive grid classes**
- Examples: `flex`, `grid`, `gap-4`, `p-4`, `m-2`, `w-full`, `h-screen`, `md:flex-row`, `lg:grid-cols-3`
- **No visual token overrides in Tailwind** (colors, shadows, borders, etc. should come from Mantine theme)
- Tailwind theme in `tailwind.config.ts` should reference CSS variables ONLY for spacing/layout tokens

### 3. CSS Modules
- **CSS Modules are used for component-level animations and complex selectors**
- Use for animations, transitions, and component-specific styling that cannot be achieved via Mantine theme
- File naming: `ComponentName.module.css`
- Import: `import styles from './ComponentName.module.css'`

### 4. Design Tokens
- **All design tokens (colors, spacing, radii, font sizes) MUST be defined as CSS custom properties in `/src/styles/_tokens.css`**
- These tokens are the single source of truth
- Mantine theme maps these tokens via `src/theme.ts`
- Tailwind config references CSS variables for layout/spacing only

### 5. Integration Pattern
```
CSS Variables (_tokens.css)
    ↓
Mantine Theme (theme.ts) → Component Visuals
    ↓
Tailwind Config (tailwind.config.ts) → Layout Utilities Only
```

## File Structure

```
src/
├── styles/
│   ├── _tokens.css          # All design tokens (CSS variables)
│   └── style-guidelines.md  # This file
├── theme.ts                 # Mantine theme (maps CSS vars)
└── app/
    └── globals.css          # Imports _tokens.css
```

## Examples

### ✅ Correct Usage

```tsx
// Mantine component with theme override
<Button 
  variant="filled" 
  color="primary"  // Uses Mantine theme color
>
  Click me
</Button>

// Tailwind for layout
<div className="flex gap-4 md:grid md:grid-cols-2">
  <Card>...</Card>
  <Card>...</Card>
</div>

// CSS Module for complex animation
import styles from './Component.module.css';
<div className={styles.animatedBox}>...</div>
```

### ❌ Incorrect Usage

```tsx
// ❌ Direct style override on Mantine component
<Button style={{ backgroundColor: '#ff0000' }}>...</Button>

// ❌ Tailwind for visual tokens
<div className="bg-red-500 text-white shadow-lg">...</div>

// ❌ Hardcoded colors
<div style={{ color: '#333' }}>...</div>
```

## Linter Rules

Add to ESLint config or README:
- Disallow direct `style` prop on Mantine components
- Prefer Mantine theme overrides
- Enforce CSS variable usage for colors



