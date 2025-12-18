import React from 'react';

interface FlipCardWidgetProps {
    frontTitle: string;
    frontDesc: string;
    backTitle: string;
    backDesc: string;
    height?: string;
    bgFront?: string;
    bgBack?: string;
    textColorFront?: string;
    textColorBack?: string;
}

export const FlipCardWidget: React.FC<FlipCardWidgetProps> = ({
    frontTitle = 'Front Side',
    frontDesc = 'Hover to flip',
    backTitle = 'Back Side',
    backDesc = 'Hidden content revealed!',
    height = '250px',
    bgFront = 'var(--wb-color-surface)',
    bgBack = 'var(--wb-color-primary)',
    textColorFront = 'var(--wb-color-text)',
    textColorBack = '#ffffff',
}) => {
    return (
        <div className="group perspective-1000" style={{ height, perspective: '1000px' }}>
            <div className="relative w-full h-full transition-transform duration-500 transform-style-3d group-hover:rotate-y-180" style={{ transformStyle: 'preserve-3d' }}>

                {/* Front */}
                <div
                    className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center shadow-md rounded-lg"
                    style={{
                        backgroundColor: bgFront,
                        color: textColorFront,
                        backfaceVisibility: 'hidden',
                        border: '1px solid var(--wb-color-border)'
                    }}
                >
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--wb-font-heading)' }}>{frontTitle}</h3>
                    <p style={{ fontFamily: 'var(--wb-font-body)' }}>{frontDesc}</p>
                </div>

                {/* Back */}
                <div
                    className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center shadow-md rounded-lg rotate-y-180"
                    style={{
                        backgroundColor: bgBack,
                        color: textColorBack,
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--wb-font-heading)' }}>{backTitle}</h3>
                    <p style={{ fontFamily: 'var(--wb-font-body)' }}>{backDesc}</p>
                </div>

            </div>
        </div>
    );
};
