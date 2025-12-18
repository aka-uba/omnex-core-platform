/**
 * Menu configuration for SuperAdmin role
 */
export const superAdminMenuItems = [
    {
        label: 'Dashboard',
        icon: 'IconDashboard',
        link: '/dashboard',
    },
    {
        label: 'Companies',
        icon: 'IconBuilding',
        link: '/companies',
        children: [
            {
                label: 'All Companies',
                link: '/companies',
            },
            {
                label: 'Create Company',
                link: '/companies/create',
            },
        ],
    },
    {
        label: 'File Manager',
        icon: 'IconFolder',
        link: '/modules/file-manager',
        badge: 'All Tenants',
    },
    {
        label: 'Settings',
        icon: 'IconSettings',
        children: [
            {
                label: 'System Settings',
                link: '/settings/system',
            },
            {
                label: 'Users',
                link: '/settings/users',
            },
        ],
    },
];

/**
 * Menu configuration for Tenant Admin role
 */
export const tenantAdminMenuItems = [
    {
        label: 'Dashboard',
        icon: 'IconDashboard',
        link: '/dashboard',
    },
    {
        label: 'My Company',
        icon: 'IconBuilding',
        children: [
            {
                label: 'Company Info',
                link: '/settings/company',
            },
            {
                label: 'Locations',
                link: '/settings/locations',
            },
            {
                label: 'Export Templates',
                link: '/settings/export-templates',
            },
        ],
    },
    {
        label: 'Modules',
        icon: 'IconApps',
        children: [
            {
                label: 'Accounting',
                link: '/modules/accounting',
            },
            {
                label: 'HR',
                link: '/modules/hr',
            },
            {
                label: 'Maintenance',
                link: '/modules/maintenance',
            },
            {
                label: 'Production',
                link: '/modules/production',
            },
            {
                label: 'Real Estate',
                link: '/modules/real-estate',
            },
        ],
    },
    {
        label: 'File Manager',
        icon: 'IconFolder',
        link: '/modules/file-manager',
        badge: 'My Tenant',
    },
    {
        label: 'Settings',
        icon: 'IconSettings',
        children: [
            {
                label: 'Profile',
                link: '/settings/profile',
            },
            {
                label: 'Preferences',
                link: '/settings/preferences',
            },
        ],
    },
];

/**
 * Get menu items based on user role
 */
export function getMenuItemsByRole(role: 'superadmin' | 'tenant-admin' | 'user') {
    switch (role) {
        case 'superadmin':
            return superAdminMenuItems;
        case 'tenant-admin':
            return tenantAdminMenuItems;
        default:
            return tenantAdminMenuItems; // Default to tenant admin menu
    }
}
