'use client';

import { ChatModule } from '@/modules/sohbet/ChatModule';
import { useEffect } from 'react';

export default function ChatDashboard() {
    useEffect(() => {
        // Chat sayfası için viewport height kullanarak scroll'u önle
        const contentArea = document.querySelector('main [class*="contentArea"]');
        const mainElement = document.querySelector('main');
        
        if (contentArea) {
            const element = contentArea as HTMLElement;
            element.style.padding = '0';
            element.style.paddingBottom = '0';
            element.style.margin = '0';
            element.style.height = '100vh';
            element.style.maxHeight = '100vh';
            element.style.overflow = 'hidden';
        }
        
        if (mainElement) {
            const element = mainElement as HTMLElement;
            element.style.height = '100vh';
            element.style.maxHeight = '100vh';
            element.style.overflow = 'hidden';
            element.style.paddingBottom = '0';
        }
        
        return () => {
            // Cleanup - sayfa değiştiğinde eski haline döndür
            if (contentArea) {
                const element = contentArea as HTMLElement;
                element.style.padding = '';
                element.style.margin = '';
                element.style.height = '';
                element.style.maxHeight = '';
                element.style.overflow = '';
            }
            if (mainElement) {
                const element = mainElement as HTMLElement;
                element.style.height = '';
                element.style.maxHeight = '';
                element.style.overflow = '';
            }
        };
    }, []);

    return (
        <div 
            className="w-full" 
            style={{ 
                height: '100vh', 
                maxHeight: '100vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: 0,
                paddingBottom: 0
            }}
        >
            <ChatModule />
        </div>
    );
}






