import React from 'react';

interface ButtonWidgetProps {
    label: string;
    variant?: 'filled' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

export const ButtonWidget: React.FC<ButtonWidgetProps> = ({
    label,
    variant = 'filled',
    size = 'medium',
    align = 'left',
    style
}) => {
    const getBaseStyles = (): React.CSSProperties => ({
        fontFamily: 'var(--wb-font-body)',
        borderRadius: 'var(--wb-radius-button)',
        padding: size === 'small' ? '0.5rem 1rem' : size === 'large' ? '1rem 2rem' : '0.75rem 1.5rem',
        fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
        cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'all 0.2s',
        display: 'inline-block',
        ...style,
    });

    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderColor: 'var(--wb-color-primary)',
                    color: 'var(--wb-color-primary)',
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    color: 'var(--wb-color-primary)',
                };
            case 'filled':
            default:
                return {
                    backgroundColor: 'var(--wb-color-primary)',
                    color: '#ffffff', // Always white for filled buttons usually, or could be a contrast var
                };
        }
    };

    return (
        <div style={{ textAlign: align }}>
            <button style={{ ...getBaseStyles(), ...getVariantStyles() }}>
                {label}
            </button>
        </div>
    );
};
