# Component Naming Conventions

## Overview

This document defines the naming conventions and organizational structure for React components in the Omnex Core Platform.

## Prefix Categories

Components are categorized by their primary function:

### Data Components
- **Prefix**: `Data*`
- **Purpose**: Display and manipulate data (tables, lists, cards)
- **Examples**: `DataTable`, `DataCard`, `DataList`, `DataGrid`

### User Components
- **Prefix**: `User*`
- **Purpose**: User-related UI (profiles, avatars, user cards)
- **Examples**: `UserProfile`, `UserAvatar`, `UserCard`, `UserList`

### Control Components
- **Prefix**: `Control*` or action-based names
- **Purpose**: Interactive controls (buttons, inputs, forms)
- **Examples**: `ControlButton`, `ControlInput`, `FormInput`, `ActionButton`

### Display Components
- **Prefix**: Descriptive names without prefix
- **Purpose**: Presentational components (badges, icons, layouts)
- **Examples**: `Badge`, `Icon`, `Layout`, `Header`, `Footer`

## File & Folder Structure

### Standard Structure
```
src/
├── components/
│   └── <domain>/
│       └── <ComponentName>/
│           ├── ComponentName.tsx
│           ├── index.ts
│           ├── ComponentName.module.css
│           └── ComponentName.test.tsx (optional)
```

### Examples

#### Domain: `notifications`
```
src/components/notifications/
└── NotificationCard/
    ├── NotificationCard.tsx
    ├── index.ts
    └── NotificationCard.module.css
```

#### Domain: `users`
```
src/components/users/
└── UserProfile/
    ├── UserProfile.tsx
    ├── index.ts
    └── UserProfile.module.css
```

#### Domain: `modals`
```
src/components/modals/
└── AlertModal/
    ├── AlertModal.tsx
    ├── index.ts
    └── AlertModal.module.css
```

## Export Rules

### index.ts Pattern
```typescript
// src/components/notifications/NotificationCard/index.ts
export { NotificationCard } from './NotificationCard';
export type { NotificationCardProps } from './NotificationCard';
```

### Usage
```typescript
// Preferred: Import from index
import { NotificationCard } from '@/components/notifications/NotificationCard';

// Also valid: Direct import
import { NotificationCard } from '@/components/notifications/NotificationCard/NotificationCard';
```

## Component File Naming

### Rules
1. **Component file**: `ComponentName.tsx` (PascalCase)
2. **CSS Module**: `ComponentName.module.css` (matches component name)
3. **Test file**: `ComponentName.test.tsx` (optional)
4. **Index file**: `index.ts` (always lowercase)

### Examples
- ✅ `NotificationCard.tsx`
- ✅ `UserProfile.tsx`
- ✅ `DataTable.tsx`
- ❌ `notificationCard.tsx` (should be PascalCase)
- ❌ `notification-card.tsx` (should be PascalCase)

## Folder Organization

### By Domain
Group related components by domain/feature:
```
src/components/
├── notifications/    # Notification-related components
├── users/            # User-related components
├── modals/           # Modal components
├── forms/            # Form components
└── layouts/          # Layout components
```

### Shared Components
Common/shared components go in root:
```
src/components/
├── Button.tsx
├── Badge.tsx
├── Icon.tsx
└── ...
```

## Storybook Naming

### Story File Naming
- **Pattern**: `ComponentName.stories.tsx`
- **Location**: Same directory as component or `__stories__/` folder

### Story Organization
```typescript
// NotificationCard.stories.tsx
export default {
  title: 'Components/Notifications/NotificationCard',
  component: NotificationCard,
};

export const Default = { ... };
export const WithLongMessage = { ... };
```

## TypeScript Naming

### Props Interface
```typescript
// ComponentName.tsx
export interface ComponentNameProps {
  // props
}

export function ComponentName(props: ComponentNameProps) {
  // implementation
}
```

### Type Exports
```typescript
// index.ts
export type { ComponentNameProps } from './ComponentName';
```

## Module-Specific Components

### Location
Module components live within their module:
```
src/modules/
└── notifications/
    └── components/
        ├── NotificationBell.tsx
        ├── NotificationForm.tsx
        └── shared/
            ├── NotificationStatusBadge.tsx
            └── NotificationTypeIcon.tsx
```

### Naming
- Module-specific components: No prefix needed
- Shared module components: In `shared/` subfolder
- Reusable across modules: Move to `src/components/`

## Best Practices

1. **Consistency**: Use the same naming pattern across the codebase
2. **Clarity**: Component names should clearly indicate their purpose
3. **Domain Grouping**: Group related components by domain/feature
4. **Export from index**: Always export from `index.ts` for cleaner imports
5. **Type Safety**: Export TypeScript types alongside components

## Examples Summary

| Component Type | Location | Naming Pattern |
|---------------|---------|---------------|
| Data Table | `components/data/DataTable/` | `DataTable.tsx` |
| User Profile | `components/users/UserProfile/` | `UserProfile.tsx` |
| Alert Modal | `components/modals/AlertModal/` | `AlertModal.tsx` |
| Notification Badge | `modules/notifications/components/shared/` | `NotificationStatusBadge.tsx` |
| Shared Button | `components/Button.tsx` | `Button.tsx` |



