import React from 'react';
import * as TablerIcons from '@tabler/icons-react';

interface IconBoxWidgetProps {
    icon: string;
    title: string;
    description: string;
    align?: 'left' | 'center' | 'right';
    iconColor?: string;
    iconBg?: string;
    style?: React.CSSProperties;
}

export const IconBoxWidget: React.FC<IconBoxWidgetProps> = ({
    icon = 'IconStar',
    title = 'Feature Title',
    description = 'Description of this amazing feature.',
    align = 'center',
    iconColor = 'var(--wb-color-primary)',
    iconBg = 'transparent',
    style
}) => {
    // Dynamic icon loading
    const IconComponent = (TablerIcons as any)[icon] || TablerIcons.IconStar;

    return (
        <div
            style={{
                textAlign: align,
                padding: '1.5rem',
                borderRadius: 'var(--wb-radius-medium)',
                backgroundColor: 'var(--wb-color-surface)',
                border: '1px solid var(--wb-color-border)',
                transition: 'transform 0.2s',
                ...style
            }}
            className="hover:shadow-md hover:-translate-y-1"
        >
            <div
                style={{
                    display: 'inline-flex',
                    padding: '1rem',
                    borderRadius: '50%',
                    backgroundColor: iconBg,
                    color: iconColor,
                    marginBottom: '1rem',
                }}
            >
                <IconComponent size={32} />
            </div>

            <h3 style={{
                fontFamily: 'var(--wb-font-heading)',
                color: 'var(--wb-color-text)',
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
            }}>
                {title}
            </h3>

            <p style={{
                fontFamily: 'var(--wb-font-body)',
                color: 'var(--wb-color-secondary)',
                fontSize: '1rem',
                lineHeight: 1.6,
            }}>
                {description}
            </p>
        </div>
    );
};
