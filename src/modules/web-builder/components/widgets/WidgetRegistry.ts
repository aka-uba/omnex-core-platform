import React from 'react';
import { IconTypography, IconPhoto, IconSquare, IconVideo, IconHeading, IconStar, IconRotate3d, IconCurrencyDollar } from '@tabler/icons-react';
import { HeadingWidget } from './HeadingWidget';
import { TextWidget } from './TextWidget';
import { ButtonWidget } from './ButtonWidget';
import { ImageWidget } from './ImageWidget';
import { GradientHeadingWidget } from './GradientHeadingWidget';
import { IconBoxWidget } from './IconBoxWidget';
import { FlipCardWidget } from './FlipCardWidget';
import { PricingCardWidget } from './PricingCardWidget';

export interface WidgetDefinition {
    type: string;
    label: string;
    icon: any;
    defaultProps: Record<string, any>;
    component?: React.FC<any>;
}

export const WidgetRegistry: Record<string, WidgetDefinition> = {
    heading: {
        type: 'heading',
        label: 'Heading',
        icon: IconHeading,
        defaultProps: {
            content: 'Heading Text',
            level: 2,
            align: 'left',
        },
        component: HeadingWidget,
    },
    gradientHeading: {
        type: 'gradientHeading',
        label: 'Gradient Heading',
        icon: IconHeading,
        defaultProps: {
            content: 'Gradient Text',
            level: 1,
            align: 'center',
            gradientStart: '#3b82f6',
            gradientEnd: '#ec4899',
        },
        component: GradientHeadingWidget,
    },
    text: {
        type: 'text',
        label: 'Text',
        icon: IconTypography,
        defaultProps: {
            content: 'Double click to edit text',
            style: {
                fontSize: '16px',
            },
        },
        component: TextWidget,
    },
    image: {
        type: 'image',
        label: 'Image',
        icon: IconPhoto,
        defaultProps: {
            src: 'https://via.placeholder.com/150',
            alt: 'Placeholder Image',
        },
        component: ImageWidget,
    },
    button: {
        type: 'button',
        label: 'Button',
        icon: IconSquare,
        defaultProps: {
            label: 'Click Me',
            variant: 'filled',
        },
        component: ButtonWidget,
    },
    iconBox: {
        type: 'iconBox',
        label: 'Icon Box',
        icon: IconStar,
        defaultProps: {
            title: 'Feature',
            description: 'Description here',
            icon: 'IconStar',
        },
        component: IconBoxWidget,
    },
    flipCard: {
        type: 'flipCard',
        label: 'Flip Card',
        icon: IconRotate3d,
        defaultProps: {
            frontTitle: 'Front',
            backTitle: 'Back',
        },
        component: FlipCardWidget,
    },
    pricingCard: {
        type: 'pricingCard',
        label: 'Pricing Card',
        icon: IconCurrencyDollar,
        defaultProps: {
            title: 'Pro Plan',
            price: '$49',
            features: ['Feature 1', 'Feature 2'],
            buttonText: 'Buy Now',
            isPopular: true,
        },
        component: PricingCardWidget,
    },
    video: {
        type: 'video',
        label: 'Video',
        icon: IconVideo,
        defaultProps: {
            url: '',
        },
        // component: VideoWidget, // To be implemented
    },
};
