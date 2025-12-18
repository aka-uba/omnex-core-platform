import React from 'react';

interface GradientHeadingWidgetProps {
    content: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    align?: 'left' | 'center' | 'right';
    gradientStart?: string;
    gradientEnd?: string;
    direction?: string;
    style?: React.CSSProperties;
}

export const GradientHeadingWidget: React.FC<GradientHeadingWidgetProps> = ({
    content,
    level = 2,
    align = 'center',
    gradientStart = 'var(--wb-color-primary)',
    gradientEnd = 'var(--wb-color-secondary)',
    direction = 'to right',
    style
}) => {
    const Tag = `h${level}` as React.ElementType;

    return (
        <Tag
            style={{
                fontFamily: 'var(--wb-font-heading)',
                textAlign: align,
                lineHeight: 'var(--wb-line-height-heading)',
                marginBottom: '0.5em',
                background: `linear-gradient(${direction}, ${gradientStart}, ${gradientEnd})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block', // Required for background-clip to work on some browsers with text-align
                ...style
            }}
        >
            {content}
        </Tag>
    );
};
