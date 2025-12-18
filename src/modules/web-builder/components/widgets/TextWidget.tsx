import React from 'react';

interface TextWidgetProps {
    content: string;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

export const TextWidget: React.FC<TextWidgetProps> = ({
    content,
    align = 'left',
    style
}) => {
    return (
        <div
            style={{
                fontFamily: 'var(--wb-font-body)',
                color: 'var(--wb-color-text)',
                textAlign: align,
                lineHeight: 'var(--wb-line-height-base)',
                ...style
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};
