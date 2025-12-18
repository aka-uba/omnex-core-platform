# Module Settings Page System

## Overview

A comprehensive module settings management system with three main tabs:
1. **Summary (Özet)** - Module overview with version history
2. **Settings (Ayarlar)** - Module configuration settings
3. **Menu** - Hierarchical menu management with drag-and-drop

## Features

### 1. Summary Tab (Özet)
- **Module Icon & Header**: Visual module identification with avatar/icon
- **Module Information**:
  - Title and description
  - Current version
  - Last update date
  - Category badge
- **What You Can Do**: Detailed feature list
- **Change Log**: Expandable version history with accordion
  - Reads from `version.txt` in module directory
  - Shows version number, date, and changes
  - Current version highlighted

### 2. Settings Tab (Ayarlar)
- **Grouped by Category**: Settings organized in accordion groups
- **Supported Setting Types**:
  - Boolean (Switch)
  - Text (TextInput)
  - Number (NumberInput)
  - Select (Dropdown)
  - Color (ColorPicker)
- **Auto-loading**: Settings loaded from `module.config.yaml`
- **Save Functionality**: Persists settings via API

### 3. Menu Tab
- **Drag & Drop**: Reorder menu items
- **Hierarchical Structure**: Support for up to 3 levels of indentation
- **Per-Item Configuration**:
  - Title editing
  - Icon customization
  - Path/URL
  - Target (same tab / new tab)
  - Visibility toggle
- **Visual Indicators**:
  - Grip handle for dragging
  - Eye icon for visibility
  - Expand/collapse for item details
  - Indentation controls

## File Structure

```
src/
├── modules/
│   ├── module-management/
│   │   └── components/
│   │       └── ModuleSettingsPage.tsx          # Main settings component
│   └── real-estate/
│       ├── module.config.yaml                   # Module configuration
│       └── version.txt                          # Version history
├── app/
│   ├── [locale]/
│   │   └── modules/
│   │       └── [slug]/
│   │           └── settings/
│   │               └── page.tsx                 # Settings page route
│   └── api/
│       └── modules/
│           └── [slug]/
│               ├── version-history/
│               │   └── route.ts                 # Version history API
│               ├── settings/
│               │   └── route.ts                 # Settings API
│               └── menu/
│                   └── route.ts                 # Menu API
└── lib/
    └── modules/
        └── versionReader.ts                      # Version file parser
```

## Module Configuration Format

### module.config.yaml

```yaml
name: "Module Name"
slug: "module-slug"
version: "1.0.0"
description: "Module description"
icon: "IconName"
author: "Author Name"
category: "category"

# Settings Configuration
settings:
  - key: "settingKey"
    label: "Setting Label"
    description: "Setting description"
    type: "boolean"  # boolean, text, number, select, color
    defaultValue: true
    category: "General"  # Groups settings
    
  - key: "currencySetting"
    label: "Currency"
    description: "Default currency"
    type: "select"
    defaultValue: "USD"
    category: "Payments"
    options:
      - value: "USD"
        label: "US Dollar"
      - value: "EUR"
        label: "Euro"

# Menu Configuration
menu:
  main:
    label: "Module Name"
    icon: "Building"
    href: "/modules/module-slug"
    order: 10
    items:
      - title: "Dashboard"
        path: "/modules/module-slug/dashboard"
        icon: "Dashboard"
        order: 1
      - title: "Settings"
        path: "/modules/module-slug/settings"
        icon: "Settings"
        order: 2
```

### version.txt Format

```
## Module Name - Version History

### Version 1.0.0 (2025-01-28)
- ✅ Initial release
- ✅ Feature 1
- ✅ Feature 2
- ⚠️ Known issue 1

### Version 0.9.0 (2025-01-15)
- ✅ Beta release
- ✅ Added feature X
- ⚠️ Bug fix for issue Y
```

## API Endpoints

### GET /api/modules/[slug]/version-history
Returns version history from version.txt

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "version": "1.0.0",
      "date": "2025-01-28",
      "changes": [
        "Initial release",
        "Feature 1"
      ]
    }
  ]
}
```

### GET /api/modules/[slug]/settings
Returns module settings configuration

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "enableNotifications",
      "label": "Enable Notifications",
      "description": "Send notifications",
      "type": "boolean",
      "defaultValue": true,
      "category": "General"
    }
  ]
}
```

### POST /api/modules/[slug]/settings
Saves module settings

**Request Body:**
```json
[
  {
    "key": "enableNotifications",
    "value": true
  }
]
```

### GET /api/modules/[slug]/menu
Returns module menu configuration

### POST /api/modules/[slug]/menu
Saves menu configuration

## Usage

### Creating a Settings Page for a Module

1. **Create the page route:**

```typescript
// src/app/[locale]/modules/your-module/settings/page.tsx
import { ModuleSettingsPage } from '@/modules/module-management/components/ModuleSettingsPage';
import type { ModuleRecord } from '@/lib/modules/types';

const yourModule: ModuleRecord = {
  id: '1',
  slug: 'your-module',
  name: 'Your Module',
  version: '1.0.0',
  description: 'Module description',
  status: 'active',
  // ... other properties
};

export default function YourModuleSettingsPage() {
  return <ModuleSettingsPage module={yourModule} />;
}
```

2. **Add settings to module.config.yaml:**

See format above in "Module Configuration Format" section.

3. **Create version.txt:**

Add to your module directory with version history.

## Real Estate Module Example

The Real Estate module serves as a complete reference implementation:

- **Location**: `src/modules/real-estate/`
- **Settings Page**: `src/app/[locale]/modules/real-estate/settings/page.tsx`
- **Configuration**: `src/modules/real-estate/module.config.yaml`
- **Version History**: `src/modules/real-estate/version.txt`

### Features Demonstrated:

1. **10+ Settings** across multiple categories:
   - General (notifications)
   - Email (campaigns)
   - Payments (currency, reminders)
   - Contracts (auto-renewal)
   - Maintenance
   - Appearance (colors)
   - Files (upload limits)
   - Appointments
   - Properties (map view)

2. **10 Menu Items** including:
   - Dashboard
   - Properties
   - Apartments
   - Tenants
   - Contracts
   - Payments
   - Appointments
   - Email Campaigns
   - Reports
   - Staff

3. **4 Version History Entries** with detailed changelogs

## Dependencies

- **@hello-pangea/dnd**: For drag-and-drop functionality
- **@mantine/core**: UI components
- **js-yaml**: YAML parsing
- **next.js**: Routing and API

## Next Steps

To create settings pages for other modules:

1. Copy the Real Estate module structure
2. Update `module.config.yaml` with your module's settings
3. Create `version.txt` with version history
4. Create settings page route
5. Test all three tabs

## Screenshots

### Summary Tab
- Module header with icon, name, version
- Version info with last update date
- Feature list
- Expandable changelog

### Settings Tab
- Settings grouped by category in accordion
- Different control types (switches, inputs, selects, color pickers)
- Save and reset buttons

### Menu Tab
- Drag-and-drop menu items
- Hierarchical indentation
- Per-item configuration (title, icon, path, target)
- Visibility toggles






