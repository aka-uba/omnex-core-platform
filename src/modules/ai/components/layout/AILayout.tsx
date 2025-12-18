'use client';

import { NavLink, Box, Text, ThemeIcon } from '@mantine/core';
import {
    IconMessageChatbot,
    IconPhoto,
    IconCode,
    IconMicrophone,
    IconVideo,
} from '@tabler/icons-react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import classes from '../../AIModule.module.css';

interface AILayoutProps {
    children: React.ReactNode;
}

export function AILayout({ children }: AILayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('modules/ai');

    const navItems = [
        { label: 'textGenerator', icon: IconMessageChatbot, link: `/${locale}/modules/ai/text`, color: 'blue' },
        { label: 'imageGenerator', icon: IconPhoto, link: `/${locale}/modules/ai/image`, color: 'pink' },
        { label: 'codeGenerator', icon: IconCode, link: `/${locale}/modules/ai/code`, color: 'green' },
        { label: 'audioGenerator', icon: IconMicrophone, link: `/${locale}/modules/ai/audio`, color: 'orange' },
        { label: 'videoGenerator', icon: IconVideo, link: `/${locale}/modules/ai/video`, color: 'red' },
    ];

    return (
        <div {...(classes.layoutContainer ? { className: classes.layoutContainer } : {})}>
            <Box {...(classes.sidebar ? { className: classes.sidebar } : {})}>
                <Text fw={700} size="sm" c="dimmed" mb="xs" px="md" tt="uppercase">
                    {t('aiStudio')}
                </Text>
                <div {...(classes.navLinks ? { className: classes.navLinks } : {})}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.link}
                            label={t(item.label)}
                            leftSection={
                                <ThemeIcon variant="light" color={item.color} size="sm" suppressHydrationWarning>
                                    <item.icon size={16} />
                                </ThemeIcon>
                            }
                            active={pathname === item.link || pathname?.startsWith(item.link + '/')}
                            onClick={() => router.push(item.link)}
                            {...(classes.navLink ? { className: classes.navLink } : {})}
                        />
                    ))}
                </div>
            </Box>
            <Box {...(classes.content ? { className: classes.content } : {})}>
                {children}
            </Box>
        </div>
    );
}
