# Notifications Module - Terminology & UI Standards

## Overview

The Notifications module provides three distinct UI primitives for different notification use cases:

1. **ToastNotification** - Non-blocking, temporary notifications
2. **AlertModal** - Blocking modal for confirmations and warnings
3. **FormModal** - Standard modal for create/edit forms

## 1. ToastNotification

### Purpose
Top-center toast notifications for non-critical, temporary feedback messages.

### Behavior
- **Position**: Top-center of viewport
- **Max Visible**: Maximum 5 toasts shown simultaneously
- **Auto-dismiss**: Default 4000ms (4 seconds)
- **Pause on Hover**: Timer pauses when user hovers over toast
- **Progress Bar**: Visual indicator showing remaining time
- **Theme-aware**: Colors adapt to light/dark mode using CSS variables from `_tokens.css`

### Color Coding
- **Info**: Blue (`--toast-info-*`)
- **Success**: Green (`--toast-success-*`)
- **Warning**: Yellow/Orange (`--toast-warning-*`)
- **Error**: Red (`--toast-error-*`)

### Usage
```tsx
import { showToast } from '@/modules/notifications/components/ToastNotification';

showToast({
  type: 'success',
  title: 'Saved',
  message: 'Your changes have been saved.',
  duration: 4000,
});
```

### Implementation
- Component: `/src/modules/notifications/components/ToastNotification.tsx`
- Uses Mantine Notifications with custom styling
- CSS variables from `_tokens.css` for colors
- Pause-on-hover logic implemented

## 2. AlertModal

### Purpose
Neutral, blocking modal for confirmations, warnings, and error messages.

### Behavior
- **Blocking**: User must interact before continuing
- **No Color Accents**: Neutral styling (no colored borders/backgrounds)
- **Actions**: Primary (confirm) and secondary (cancel) buttons
- **Theme-aware**: Adapts to light/dark mode

### Usage
```tsx
import { AlertModal } from '@/components/modals/AlertModal';

<AlertModal
  opened={opened}
  onClose={onClose}
  title="Confirm Delete"
  message="Are you sure you want to delete this item?"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  variant="danger" // optional: 'danger' | 'warning' | 'info'
/>
```

### Implementation
- Component: `/src/components/modals/AlertModal.tsx`
- Uses Mantine Modal
- Neutral styling (no color accents)
- Supports variants for icon/button styling only

## 3. FormModal

### Purpose
Standard modal for create/edit forms.

### Behavior
- **Standard Card Style**: Consistent with platform design
- **Form Content**: Contains form fields and actions
- **Theme-aware**: Adapts to light/dark mode

### Usage
```tsx
import { FormModal } from '@/components/modals/FormModal';

<FormModal
  opened={opened}
  onClose={onClose}
  title="Create Notification"
  size="lg"
>
  <NotificationForm onSubmit={handleSubmit} />
</FormModal>
```

### Implementation
- Component: `/src/components/modals/FormModal.tsx`
- Uses Mantine Modal with Card styling
- Standard form layout

## Component Naming

### Status Badge
- **Component**: `NotificationStatusBadge`
- **File**: `/src/modules/notifications/components/shared/NotificationStatusBadge.tsx`
- **Purpose**: Display notification status (read, unread, archived)

### Type Icon
- **Component**: `NotificationTypeIcon
- **File**: `/src/modules/notifications/components/shared/NotificationTypeIcon.tsx`
- **Purpose**: Display icon based on notification type (info, success, warning, error, task, alert)

## Data Model

See Prisma schema for complete Notification model. Key fields:
- `id`, `title`, `message`, `type`, `priority`
- `senderId`, `recipientId`, `locationId`
- `isRead`, `readAt`, `isGlobal`, `archivedAt`
- `expiresAt`, `data` (JSON), `actionUrl`, `actionText`
- `module`, `attachments` (relation)

## i18n Keys

All UI labels use i18n keys from `/src/locales/modules/notifications/`:
- `tr.json` (default)
- `en.json`
- `de.json`
- `ar.json`

Keys structure:
- `notifications.title`, `notifications.status.*`, `notifications.type.*`
- `notifications.priority.*`, `notifications.fields.*`
- `notifications.validation.*`, `notifications.actions.*`















