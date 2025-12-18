'use client';

import { ChatModule } from '@/modules/sohbet/ChatModule';
import { useEffect } from 'react';

export default function SohbetDashboardPage() {
    useEffect(() => {
        // Chat sayfası için ContentArea ve main element'inin padding ve height'ını ayarla
        // Sadece chat sayfasındaki ContentArea'yı hedefle
        const contentArea = document.querySelector('main [class*="contentArea"]');
        const mainElement = document.querySelector('main');
        
        if (contentArea) {
            const element = contentArea as HTMLElement;
            element.style.padding = '0';
            element.style.margin = '0';
            element.style.height = '100%';
            element.style.minHeight = '100%';
        }
        
        if (mainElement) {
            const element = mainElement as HTMLElement;
            element.style.height = '100%';
            element.style.minHeight = '100%';
        }
        
        return () => {
            // Cleanup - sayfa değiştiğinde eski haline döndür
            if (contentArea) {
                const element = contentArea as HTMLElement;
                element.style.padding = '';
                element.style.margin = '';
                element.style.height = '';
                element.style.minHeight = '';
            }
            if (mainElement) {
                const element = mainElement as HTMLElement;
                element.style.height = '';
                element.style.minHeight = '';
            }
        };
    }, []);

    return (
        <div className="w-full h-full min-h-full">
            <ChatModule />
        </div>
    );
}
