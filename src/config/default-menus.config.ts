/**
 * Default Menu Configuration
 * 
 * WordPress-like default menu system that provides base menus for all roles
 * without requiring menu management configuration.
 * 
 * These menus are always available and merged with managed menus from menu-management.json
 */

export interface DefaultMenuItem {
    id: string;
    label: string | Record<string, string>; // Multi-language support
    href: string;
    icon: string;
    order: number;
    group?: 'user' | 'company' | 'superadmin' | 'settings';
    roles: ('SuperAdmin' | 'Admin' | 'ClientUser')[];
    children?: Omit<DefaultMenuItem, 'group' | 'roles'>[];
}

/**
 * Default menus for all roles
 * Filtered by role in useMenuItems hook
 */
export const defaultMenus: DefaultMenuItem[] = [
    // ==================== KULLANICI MENÜLERI ====================

    // Dashboard
    {
        id: 'default-dashboard',
        label: { tr: 'Genel Bakış', en: 'Overview' },
        href: '/dashboard',
        icon: 'Dashboard',
        order: 0,
        group: 'user',
        roles: ['SuperAdmin', 'Admin', 'ClientUser'],
    },

    // ==================== FİRMA YÖNETİMİ ====================

    // Firmalar (Sadece SuperAdmin)
    {
        id: 'default-companies',
        label: { tr: 'Firmalar', en: 'Companies' },
        href: '/management/companies',
        icon: 'Building',
        order: 10,
        group: 'company',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-companies-list',
                label: { tr: 'Tüm Firmalar', en: 'All Companies' },
                href: '/management/companies',
                icon: 'Building',
                order: 0
            },
            {
                id: 'default-companies-create',
                label: { tr: 'Yeni Firma Oluştur', en: 'Create New Company' },
                href: '/management/companies/create',
                icon: 'Building',
                order: 1
            },
        ],
    },


    // Kullanıcılar
    {
        id: 'default-users',
        label: { tr: 'Kullanıcılar', en: 'Users' },
        href: '/management/users',
        icon: 'Users',
        order: 12,
        group: 'company',
        roles: ['SuperAdmin', 'Admin'],
        children: [
            {
                id: 'default-users-list',
                label: { tr: 'Kullanıcı Listesi', en: 'User List' },
                href: '/management/users',
                icon: 'Users',
                order: 0
            },
            {
                id: 'default-users-roles',
                label: { tr: 'Roller', en: 'Roles' },
                href: '/management/roles',
                icon: 'Shield',
                order: 1
            },
            {
                id: 'default-users-permissions',
                label: { tr: 'İzinler', en: 'Permissions' },
                href: '/management/permissions',
                icon: 'Shield',
                order: 2
            },
        ],
    },

    // Lisansım
    {
        id: 'default-license',
        label: { tr: 'Lisansım', en: 'My License' },
        href: '/settings/license',
        icon: 'CreditCard',
        order: 13,
        group: 'company',
        roles: ['SuperAdmin', 'Admin'],
        children: [
            {
                id: 'default-license-info',
                label: { tr: 'Lisans Bilgileri', en: 'License Information' },
                href: '/settings/license',
                icon: 'CreditCard',
                order: 0
            },
            {
                id: 'default-license-history',
                label: { tr: 'Lisans Geçmişi', en: 'License History' },
                href: '/settings/license/history',
                icon: 'History',
                order: 1
            },
        ],
    },

    // Erişim Kontrolü
    {
        id: 'default-access-control',
        label: { tr: 'Erişim Kontrolü', en: 'Access Control' },
        href: '/settings/access-control',
        icon: 'Shield',
        order: 14,
        group: 'company',
        roles: ['SuperAdmin', 'Admin'],
    },

    // ==================== SUPER ADMIN (Sadece SuperAdmin) ====================

    // Tenant Yönetimi
    {
        id: 'default-tenant-management',
        label: { tr: 'Tenant Yönetimi', en: 'Tenant Management' },
        href: '/admin/tenants',
        icon: 'Database',
        order: 81,
        group: 'superadmin',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-tenant-list',
                label: { tr: 'Tenant Listesi', en: 'Tenant List' },
                href: '/admin/tenants',
                icon: 'Database',
                order: 0
            },
            {
                id: 'default-tenant-database',
                label: { tr: 'Veritabanı Yönetimi', en: 'Database Management' },
                href: '/admin/tenants/database',
                icon: 'Database',
                order: 1
            },
        ],
    },

    // Sistem Yönetimi
    {
        id: 'default-system-management',
        label: { tr: 'Sistem Yönetimi', en: 'System Management' },
        href: '/admin/system',
        icon: 'Server',
        order: 80,
        group: 'superadmin',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-system-status',
                label: { tr: 'Sistem Durumu', en: 'System Status' },
                href: '/admin/system',
                icon: 'Server',
                order: 0
            },
            {
                id: 'default-system-backups',
                label: { tr: 'Yedekleme', en: 'Backups' },
                href: '/admin/backups',
                icon: 'Database',
                order: 1
            },
            {
                id: 'default-system-logs',
                label: { tr: 'Sistem Logları', en: 'System Logs' },
                href: '/admin/logs',
                icon: 'FileText',
                order: 2
            },
        ],
    },

    // Optimizasyon
    {
        id: 'default-optimization',
        label: { tr: 'Optimizasyon', en: 'Optimization' },
        href: '/admin/optimization',
        icon: 'ChartBar',
        order: 82,
        group: 'superadmin',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-optimization-performance',
                label: { tr: 'Performans', en: 'Performance' },
                href: '/admin/optimization/performance',
                icon: 'ChartBar',
                order: 0
            },
            {
                id: 'default-optimization-cache',
                label: { tr: 'Cache Yönetimi', en: 'Cache Management' },
                href: '/admin/optimization/cache',
                icon: 'Server',
                order: 1
            },
            {
                id: 'default-optimization-database',
                label: { tr: 'Veritabanı Bakımı', en: 'Database Maintenance' },
                href: '/admin/optimization/database',
                icon: 'Database',
                order: 2
            },
        ],
    },

    // Lisans Yönetimi (SuperAdmin)
    {
        id: 'default-license-management',
        label: { tr: 'Lisans Yönetimi', en: 'License Management' },
        href: '/admin/licenses',
        icon: 'ShieldCheck',
        order: 85,
        group: 'superadmin',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-license-dashboard',
                label: { tr: 'Lisans Paneli', en: 'License Dashboard' },
                href: '/admin/licenses/dashboard',
                icon: 'ChartBar',
                order: 0
            },
            {
                id: 'default-license-packages',
                label: { tr: 'Lisans Paketleri', en: 'License Packages' },
                href: '/admin/licenses/packages',
                icon: 'Package',
                order: 1
            },
            {
                id: 'default-license-types',
                label: { tr: 'Lisans Türleri', en: 'License Types' },
                href: '/admin/licenses/types',
                icon: 'List',
                order: 2
            },
            {
                id: 'default-tenant-licenses',
                label: { tr: 'Firma Lisansları', en: 'Tenant Licenses' },
                href: '/admin/licenses/tenants',
                icon: 'Building',
                order: 3
            },
            {
                id: 'default-license-payments',
                label: { tr: 'Ödeme Takibi', en: 'Payment Tracking' },
                href: '/admin/licenses/payments',
                icon: 'CreditCard',
                order: 4
            },
        ],
    },

    // Modül Yönetimi
    {
        id: 'default-module-management',
        label: { tr: 'Modül Yönetimi', en: 'Module Management' },
        href: '/modules',
        icon: 'Apps',
        order: 90,
        group: 'superadmin',
        roles: ['SuperAdmin'],
        children: [
            {
                id: 'default-modules-list',
                label: { tr: 'Modül Listesi', en: 'Module List' },
                href: '/modules',
                icon: 'Apps',
                order: 0
            },
            {
                id: 'default-modules-upload',
                label: { tr: 'Yeni Modül Yükle', en: 'Upload New Module' },
                href: '/modules/upload',
                icon: 'Upload',
                order: 1
            },
        ],
    },

    // ==================== AYARLAR ====================

    // Ayarlar
    {
        id: 'default-settings',
        label: { tr: 'Ayarlar', en: 'Settings' },
        href: '/settings',
        icon: 'Settings',
        order: 95,
        group: 'settings',
        roles: ['SuperAdmin', 'Admin', 'ClientUser'],
        children: [
            {
                id: 'default-settings-general',
                label: { tr: 'Genel Ayarlar', en: 'General Settings' },
                href: '/settings/general',
                icon: 'Settings2',
                order: 0
            },
            {
                id: 'default-settings-notifications',
                label: { tr: 'Bildirim Ayarları', en: 'Notification Settings', de: 'Benachrichtigungseinstellungen', ar: 'إعدادات الإشعارات' },
                href: '/settings/notifications',
                icon: 'Bell',
                order: 0.5
            },
            {
                id: 'default-settings-notification-templates',
                label: { tr: 'Bildirim Şablonları', en: 'Notification Templates', de: 'Benachrichtigungsvorlagen', ar: 'قوالب الإشعارات' },
                href: '/settings/notification-templates',
                icon: 'Template',
                order: 0.6
            },
            {
                id: 'default-settings-menu',
                label: { tr: 'Menü Yönetimi', en: 'Menu Management' },
                href: '/settings/menu-management',
                icon: 'Menu2',
                order: 1
            },
            {
                id: 'default-settings-menu-footer',
                label: { tr: 'Footer Özelleştirme', en: 'Footer Customization' },
                href: '/settings/menu-management/footer',
                icon: 'LayoutFooter',
                order: 2
            },
            {
                id: 'default-settings-my-company',
                label: { tr: 'Firmam', en: 'My Company', de: 'Mein Unternehmen', ar: 'شركتي' },
                href: '/settings/my-company',
                icon: 'Building',
                order: 3
            },
            {
                id: 'default-settings-locations',
                label: { tr: 'Lokasyonlar', en: 'Locations' },
                href: '/settings/company/locations',
                icon: 'MapPin',
                order: 3.1
            },
            {
                id: 'default-settings-export',
                label: { tr: 'Export Şablonları', en: 'Export Templates' },
                href: '/settings/export-templates',
                icon: 'FileExport',
                order: 4
            },
            {
                id: 'default-settings-profile',
                label: { tr: 'Profil Ayarları', en: 'Profile Settings' },
                href: '/settings/profile',
                icon: 'UserCircle',
                order: 5
            },
        ],
    },
];

/**
 * Get default menus filtered by user role
 */
export function getDefaultMenusByRole(role: string): DefaultMenuItem[] {
    const normalizedRole = role === 'Admin' ? 'Admin' : role === 'SuperAdmin' ? 'SuperAdmin' : 'ClientUser';

    return defaultMenus.filter(menu =>
        menu.roles.includes(normalizedRole as any)
    );
}

/**
 * Filter menu children based on role (for nested permissions)
 */
export function filterMenuChildrenByRole(menu: DefaultMenuItem, role: string): DefaultMenuItem {
    if (!menu.children || menu.children.length === 0) {
        return menu;
    }

    // For now, all children inherit parent's role permissions
    // In future, we can add role-specific filtering for children
    return menu;
}
