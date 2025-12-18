'use client';

import { useMantineColorScheme } from '@mantine/core';

interface TooltipPayload {
  name: string;
  value: number | string;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number | string, name: string) => string | [string, string];
}

/**
 * Custom Recharts Tooltip with dark mode support
 * Use this component with Recharts' Tooltip content prop:
 * <Tooltip content={<ChartTooltip />} />
 * or with formatter:
 * <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
 */
export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = (value: number | string, name: string): string => {
    if (formatter) {
      const result = formatter(value, name);
      if (Array.isArray(result)) {
        return result[0];
      }
      return result;
    }
    return String(value);
  };

  return (
    <div
      style={{
        backgroundColor: isDark ? '#1a1b1e' : '#ffffff',
        border: `1px solid ${isDark ? '#373a40' : '#e9ecef'}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {label && (
        <p
          style={{
            margin: 0,
            marginBottom: '8px',
            color: isDark ? '#c1c2c5' : '#495057',
            fontWeight: 600,
          }}
        >
          {label}
        </p>
      )}
      {payload.map((item, index) => (
        <p
          key={index}
          style={{
            margin: 0,
            color: item.color || (isDark ? '#fff' : '#212529'),
          }}
        >
          {item.name}: {formatValue(item.value, item.name)}
        </p>
      ))}
    </div>
  );
}

/**
 * Get chart axis tick style based on theme
 */
export function useChartAxisStyle() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    tick: {
      fill: isDark ? '#909296' : '#495057',
      fontSize: 12,
    },
    axisLine: {
      stroke: isDark ? '#373a40' : '#dee2e6',
    },
    gridLine: {
      stroke: isDark ? '#373a40' : '#e9ecef',
    },
  };
}
