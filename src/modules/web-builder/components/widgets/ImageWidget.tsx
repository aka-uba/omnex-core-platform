import React from 'react';

interface ImageWidgetProps {
    src: string;
    alt?: string;
    width?: string;
    height?: string;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
}

export const ImageWidget: React.FC<ImageWidgetProps> = ({
    src,
    alt = '',
    width = '100%',
    height = 'auto',
    align = 'center',
    style
}) => {
    return (
        <div style={{ textAlign: align }}>
            <img
                src={src}
                alt={alt}
                style={{
                    maxWidth: '100%',
                    width: width,
                    height: height,
                    objectFit: 'cover',
                    borderRadius: 'var(--wb-radius-medium)',
                    ...style
                }}
            />
        </div>
    );
};
