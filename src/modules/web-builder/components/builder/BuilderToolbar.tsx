'use client';

import { useDraggable } from '@dnd-kit/core';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { Badge, Text } from '@mantine/core';

export function BuilderToolbar() {
  const widgets = widgetRegistry.getAll();
  
  // Group widgets by category
  const widgetsByCategory = widgets.reduce((acc, widget) => {
    const category = widget.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(widget);
    return acc;
  }, {} as Record<string, typeof widgets>);

  return (
    <div className="w-64 border-r bg-white p-4 h-full overflow-y-auto">
      <h2 className="mb-4 text-lg font-semibold">Widgets</h2>
      
      {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => (
        <div key={category} className="mb-6">
          <Text size="xs" fw={600} c="dimmed" className="mb-2 uppercase">
            {category}
          </Text>
          <div className="grid grid-cols-2 gap-2">
            {categoryWidgets.map((widget) => (
              <DraggableWidget key={widget.id} widget={widget} />
            ))}
          </div>
        </div>
      ))}
      
      {widgets.length === 0 && (
        <Text size="sm" c="dimmed" className="text-center py-8">
          No widgets available
        </Text>
      )}
    </div>
  );
}

function DraggableWidget({ widget }: { widget: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${widget.id}`,
    data: {
      type: widget.id, // Use full widget ID (e.g., 'accounting.invoices')
      widgetId: widget.id,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = widget.icon || (() => <div className="w-4 h-4 bg-gray-300 rounded" />);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all bg-white"
    >
      <div className="flex flex-col items-center gap-2">
        <Icon size={20} className="text-gray-600" />
        <Text size="xs" className="text-center" lineClamp={2}>
          {widget.name}
        </Text>
        {widget.module !== 'web-builder' && (
          <Badge size="xs" variant="light" color="blue">
            {widget.module}
          </Badge>
        )}
      </div>
    </div>
  );
}
