import React from 'react';

interface HeadingWidgetProps {
    content: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

export const HeadingWidget: React.FC<HeadingWidgetProps> = ({
    content,
    level = 2,
    align = 'left',
    style
}) => {
    const Tag = `h${level}` as React.ElementType;

    return (
        <Tag
            style={{
                fontFamily: 'var(--wb-font-heading)',
                color: 'var(--wb-color-text)',
                textAlign: align,
                lineHeight: 'var(--wb-line-height-heading)',
                marginBottom: '0.5em',
                ...style
            }}
        >
            {content}
        </Tag>
    );
};
