import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';

export async function GET(request: Request) {
    const auth = await verifyAuth(request as any);
    if (!auth.valid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real application, this would fetch from a database or route registry
    // For now, we return a comprehensive list of available system pages and modules

    const pages = [
        { id: 'home', title: 'Home', url: '/', type: 'page' },
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard', type: 'page' },
        { id: 'profile', title: 'Profile', url: '/profile', type: 'page' },
        { id: 'settings', title: 'Settings', url: '/settings', type: 'page' },
        { id: 'login', title: 'Login', url: '/login', type: 'page' },
        { id: 'register', title: 'Register', url: '/register', type: 'page' },
        { id: 'about', title: 'About Us', url: '/about', type: 'page' },
        { id: 'contact', title: 'Contact', url: '/contact', type: 'page' },
    ];

    const modules = [
        {
            id: 'real-estate',
            title: 'Real Estate',
            url: '/modules/real-estate',
            type: 'module',
            children: [
                { id: 'real-estate-properties', title: 'Properties', url: '/modules/real-estate/properties', type: 'submodule' },
                { id: 'real-estate-tenants', title: 'Tenants', url: '/modules/real-estate/tenants', type: 'submodule' },
                { id: 'real-estate-contracts', title: 'Contracts', url: '/modules/real-estate/contracts', type: 'submodule' },
            ]
        },
        {
            id: 'crm',
            title: 'CRM',
            url: '/modules/crm',
            type: 'module',
            children: [
                { id: 'crm-customers', title: 'Customers', url: '/modules/crm/customers', type: 'submodule' },
                { id: 'crm-leads', title: 'Leads', url: '/modules/crm/leads', type: 'submodule' },
            ]
        },
        {
            id: 'hr',
            title: 'HR',
            url: '/modules/hr',
            type: 'module',
            children: [
                { id: 'hr-employees', title: 'Employees', url: '/modules/hr/employees', type: 'submodule' },
            ]
        },
        { id: 'accounting', title: 'Accounting', url: '/modules/accounting', type: 'module' },
        { id: 'web-builder', title: 'Web Builder', url: '/modules/web-builder', type: 'module' },
        { id: 'chat', title: 'Chat', url: '/modules/chat', type: 'module' },
        { id: 'file-manager', title: 'File Manager', url: '/modules/file-manager', type: 'module' },
    ];

    return NextResponse.json({
        success: true,
        data: {
            pages,
            modules
        }
    });
}
