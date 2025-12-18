'use client';
'use client';

import { useDroppable } from '@dnd-kit/core';
import { PageSection } from '../../types/builder.types';

import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';

interface BuilderCanvasProps {
    sections: PageSection[];
    onSelectElement: (id: string) => void;
    selectedElementId: string | null;
}

function RenderWidget({ element }: { element: any }) {
    // Support both old format (type: 'heading') and new format (type: 'web-builder.heading')
    const widgetId = element.type;
    const widgetDef = widgetRegistry.get(widgetId);
    
    if (!widgetDef) {
        // Fallback to old WidgetRegistry for backward compatibility
        const oldRegistry = require('../widgets/WidgetRegistry').WidgetRegistry;
        const oldWidget = oldRegistry[element.type];
        
        if (oldWidget && oldWidget.component) {
            const Component = oldWidget.component;
            const props = { ...oldWidget.defaultProps, ...element.content, ...element.settings };
            return <Component {...props} />;
        }
        
        return <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
            Unknown widget: {element.type}
        </div>;
    }

    const Component = widgetDef.component;
    // Merge default config with element content/settings
    const config = { ...widgetDef.defaultConfig, ...element.content, ...element.settings };

    // Widget components expect config prop
    return <Component config={config} />;
}

export function BuilderCanvas({ sections, onSelectElement, selectedElementId }: BuilderCanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas',
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-screen p-8 transition-colors ${isOver ? 'bg-blue-50' : 'bg-gray-100'
                }`}
            onClick={() => onSelectElement('')}
        >
            {sections.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
                    <p className="text-gray-500">Drag and drop widgets here</p>
                </div>
            ) : (
                sections.map((section) => (
                    <div key={section.id} className="mb-4 bg-white p-4 shadow-sm">
                        {/* Render section content */}
                        <div className="border-b pb-2 mb-2 text-xs text-gray-400">Section {section.id}</div>
                        <div className="min-h-[50px]">
                            {section.elements.map(element => (
                                <div
                                    key={element.id}
                                    className={`p-2 border cursor-pointer relative group ${selectedElementId === element.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-blue-300'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectElement(element.id);
                                    }}
                                >
                                    <RenderWidget element={element} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
