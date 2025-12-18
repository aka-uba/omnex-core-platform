/**
 * Web Builder - Register Default Widgets (FAZ 3)
 * Registers existing web-builder widgets to the central WidgetRegistry
 */

import { z } from 'zod';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { HeadingWidget } from '../components/widgets/HeadingWidget';
import { TextWidget } from '../components/widgets/TextWidget';
import { ButtonWidget } from '../components/widgets/ButtonWidget';
import { ImageWidget } from '../components/widgets/ImageWidget';
import { GradientHeadingWidget } from '../components/widgets/GradientHeadingWidget';
import { IconBoxWidget } from '../components/widgets/IconBoxWidget';
import { FlipCardWidget } from '../components/widgets/FlipCardWidget';
import { PricingCardWidget } from '../components/widgets/PricingCardWidget';
import { IconHeading, IconTypography, IconPhoto, IconSquare, IconStar, IconRotate3d, IconCurrencyDollar } from '@tabler/icons-react';

/**
 * Register all web-builder default widgets
 * This should be called during module initialization
 */
export function registerWebBuilderWidgets(): void {
  // Heading Widget
  widgetRegistry.register({
    id: 'web-builder.heading',
    module: 'web-builder',
    name: 'Heading',
    description: 'Add a heading to your page',
    icon: IconHeading,
    component: HeadingWidget,
    configSchema: z.object({
      content: z.string().min(1),
      level: z.number().int().min(1).max(6).default(2),
      align: z.enum(['left', 'center', 'right']).default('left'),
    }),
    defaultConfig: {
      content: 'Heading Text',
      level: 2,
      align: 'left',
    },
    category: 'content',
    tags: ['text', 'heading', 'title'],
  });

  // Gradient Heading Widget
  widgetRegistry.register({
    id: 'web-builder.gradient-heading',
    module: 'web-builder',
    name: 'Gradient Heading',
    description: 'Add a gradient heading to your page',
    icon: IconHeading,
    component: GradientHeadingWidget,
    configSchema: z.object({
      content: z.string().min(1),
      level: z.number().int().min(1).max(6).default(1),
      align: z.enum(['left', 'center', 'right']).default('center'),
      gradientStart: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
      gradientEnd: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ec4899'),
    }),
    defaultConfig: {
      content: 'Gradient Text',
      level: 1,
      align: 'center',
      gradientStart: '#3b82f6',
      gradientEnd: '#ec4899',
    },
    category: 'content',
    tags: ['text', 'heading', 'gradient'],
  });

  // Text Widget
  widgetRegistry.register({
    id: 'web-builder.text',
    module: 'web-builder',
    name: 'Text',
    description: 'Add text content to your page',
    icon: IconTypography,
    component: TextWidget,
    configSchema: z.object({
      content: z.string(),
      style: z.object({
        fontSize: z.string().optional(),
      }).optional(),
    }),
    defaultConfig: {
      content: 'Double click to edit text',
      style: {
        fontSize: '16px',
      },
    },
    category: 'content',
    tags: ['text', 'paragraph', 'content'],
  });

  // Image Widget
  widgetRegistry.register({
    id: 'web-builder.image',
    module: 'web-builder',
    name: 'Image',
    description: 'Add an image to your page',
    icon: IconPhoto,
    component: ImageWidget,
    configSchema: z.object({
      src: z.string().url(),
      alt: z.string().optional(),
    }),
    defaultConfig: {
      src: 'https://via.placeholder.com/150',
      alt: 'Placeholder Image',
    },
    category: 'media',
    tags: ['image', 'photo', 'media'],
  });

  // Button Widget
  widgetRegistry.register({
    id: 'web-builder.button',
    module: 'web-builder',
    name: 'Button',
    description: 'Add a button to your page',
    icon: IconSquare,
    component: ButtonWidget,
    configSchema: z.object({
      label: z.string().min(1),
      variant: z.enum(['filled', 'outline', 'subtle']).default('filled'),
      href: z.string().url().optional(),
    }),
    defaultConfig: {
      label: 'Click Me',
      variant: 'filled',
    },
    category: 'content',
    tags: ['button', 'action', 'link'],
  });

  // Icon Box Widget
  widgetRegistry.register({
    id: 'web-builder.icon-box',
    module: 'web-builder',
    name: 'Icon Box',
    description: 'Add an icon box with title and description',
    icon: IconStar,
    component: IconBoxWidget,
    configSchema: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
    }),
    defaultConfig: {
      title: 'Feature',
      description: 'Description here',
      icon: 'IconStar',
    },
    category: 'content',
    tags: ['icon', 'feature', 'box'],
  });

  // Flip Card Widget
  widgetRegistry.register({
    id: 'web-builder.flip-card',
    module: 'web-builder',
    name: 'Flip Card',
    description: 'Add a flip card with front and back content',
    icon: IconRotate3d,
    component: FlipCardWidget,
    configSchema: z.object({
      frontTitle: z.string().min(1),
      backTitle: z.string().min(1),
      frontContent: z.string().optional(),
      backContent: z.string().optional(),
    }),
    defaultConfig: {
      frontTitle: 'Front',
      backTitle: 'Back',
    },
    category: 'content',
    tags: ['card', 'flip', 'interactive'],
  });

  // Pricing Card Widget
  widgetRegistry.register({
    id: 'web-builder.pricing-card',
    module: 'web-builder',
    name: 'Pricing Card',
    description: 'Add a pricing card with features',
    icon: IconCurrencyDollar,
    component: PricingCardWidget,
    configSchema: z.object({
      title: z.string().min(1),
      price: z.string().min(1),
      features: z.array(z.string()).default([]),
      buttonText: z.string().default('Buy Now'),
      isPopular: z.boolean().default(false),
    }),
    defaultConfig: {
      title: 'Pro Plan',
      price: '$49',
      features: ['Feature 1', 'Feature 2'],
      buttonText: 'Buy Now',
      isPopular: true,
    },
    category: 'business',
    tags: ['pricing', 'card', 'business'],
  });
}







