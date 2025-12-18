import React from 'react';
import { IconCheck } from '@tabler/icons-react';

interface PricingCardWidgetProps {
    title: string;
    price: string;
    period?: string;
    features: string[];
    buttonText: string;
    isPopular?: boolean;
    accentColor?: string;
}

export const PricingCardWidget: React.FC<PricingCardWidgetProps> = ({
    title = 'Basic',
    price = '$29',
    period = '/mo',
    features = ['Feature 1', 'Feature 2', 'Feature 3'],
    buttonText = 'Get Started',
    isPopular = false,
    accentColor = 'var(--wb-color-primary)',
}) => {
    return (
        <div
            className={`relative p-8 rounded-2xl border transition-all duration-300 ${isPopular ? 'shadow-xl scale-105 z-10' : 'shadow-sm hover:shadow-md'}`}
            style={{
                backgroundColor: 'var(--wb-color-surface)',
                borderColor: isPopular ? accentColor : 'var(--wb-color-border)',
            }}
        >
            {isPopular && (
                <div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide"
                    style={{ backgroundColor: accentColor }}
                >
                    Most Popular
                </div>
            )}

            <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--wb-color-secondary)' }}>{title}</h3>
                <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold" style={{ color: 'var(--wb-color-text)' }}>{price}</span>
                    <span className="text-sm ml-1" style={{ color: 'var(--wb-color-secondary)' }}>{period}</span>
                </div>
            </div>

            <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                        <IconCheck size={16} style={{ color: accentColor, marginRight: '0.5rem' }} />
                        <span style={{ color: 'var(--wb-color-text)' }}>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                className="w-full py-3 px-6 rounded-lg font-medium transition-colors"
                style={{
                    backgroundColor: isPopular ? accentColor : 'transparent',
                    color: isPopular ? '#ffffff' : accentColor,
                    border: `1px solid ${accentColor}`,
                }}
            >
                {buttonText}
            </button>
        </div>
    );
};
