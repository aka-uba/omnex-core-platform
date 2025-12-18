'use client';

import { Card, Text, Group, Anchor, Stack, RingProgress, Center } from '@mantine/core';

interface FinanceCategory {
  label: string;
  amount: string;
  color: string;
  percentage: number;
}

interface FinanceOverviewProps {
  totalIncome?: string;
  categories?: FinanceCategory[];
}

const defaultCategories: FinanceCategory[] = [
  { label: 'Consulting', amount: '$2,520', color: 'blue', percentage: 60 },
  { label: 'Subscriptions', amount: '$1,260', color: 'green', percentage: 30 },
  { label: 'Other', amount: '$420', color: 'gray', percentage: 10 },
];

export function FinanceOverview({
  totalIncome = '$4.2k',
  categories = defaultCategories,
}: FinanceOverviewProps) {
  const sections = categories.map((cat) => ({
    value: cat.percentage,
    color: cat.color,
  }));

  return (
    <Card
      padding="lg"
      radius="xl"
      withBorder
      className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10 lg:col-span-1"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            Finance Overview
          </Text>
          <Anchor size="sm" fw={500} className="text-primary hover:underline">
            View All
          </Anchor>
        </Group>
        <Center my="md">
          <div className="relative size-40">
            <RingProgress
              size={160}
              thickness={12}
              sections={sections}
              label={
                <Center>
                  <Stack gap={0} align="center">
                    <Text size="2xl" fw={700} className="text-gray-900 dark:text-white">
                      {totalIncome}
                    </Text>
                    <Text size="sm" className="text-gray-500 dark:text-gray-400">
                      Income
                    </Text>
                  </Stack>
                </Center>
              }
            />
          </div>
        </Center>
        <Stack gap="xs">
          {categories.map((category, index) => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-500',
              green: 'bg-green-500',
              gray: 'bg-gray-200 dark:bg-white/10',
            };
            return (
              <Group key={index} justify="space-between" align="center">
                <Group gap="xs">
                  <div className={`size-2 rounded-full ${colorMap[category.color] || 'bg-gray-500'}`} />
                  <Text size="sm" className="text-gray-700 dark:text-gray-300">
                    {category.label}
                  </Text>
                </Group>
                <Text size="sm" fw={500} className="text-gray-900 dark:text-white">
                  {category.amount}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

