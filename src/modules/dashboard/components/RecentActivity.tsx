'use client';

import { Card, Text, Group, Anchor, Stack } from '@mantine/core';
import { IconUserPlus, IconReceipt, IconUpload } from '@tabler/icons-react';

interface Activity {
  type: 'client_added' | 'invoice_sent' | 'post_published';
  message: string;
  details: string;
  time: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  {
    type: 'client_added',
    message: 'Client "Innovate Corp" was added.',
    details: '2 hours ago by Alex',
    time: '2 hours ago',
    icon: IconUserPlus,
    iconColor: 'text-green-600 dark:text-green-300',
    iconBg: 'bg-green-500/20 dark:bg-green-500/20',
  },
  {
    type: 'invoice_sent',
    message: 'Invoice #INV-0123 was sent to Innovate Corp.',
    details: '1 hour ago by Alex',
    time: '1 hour ago',
    icon: IconReceipt,
    iconColor: 'text-blue-600 dark:text-blue-300',
    iconBg: 'bg-blue-500/20 dark:bg-blue-500/20',
  },
  {
    type: 'post_published',
    message: 'Post "Q2 Financial Results" was published to LinkedIn.',
    details: '45 minutes ago by Scheduler',
    time: '45 minutes ago',
    icon: IconUpload,
    iconColor: 'text-purple-600 dark:text-purple-300',
    iconBg: 'bg-purple-500/20 dark:bg-purple-500/20',
  },
];

export function RecentActivity({ activities = defaultActivities }: RecentActivityProps) {
  return (
    <Card
      padding="lg"
      radius="xl"
      withBorder
      className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10 lg:col-span-2"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            Recent Activity
          </Text>
          <Anchor size="sm" fw={500} className="text-primary hover:underline">
            View All
          </Anchor>
        </Group>
        <Stack gap="md">
          {activities.map((activity, index) => {
            const IconComponent = activity.icon;
            // Get icon name for className
            const iconName = activity.icon === IconUserPlus ? 'user-plus' : 
                            activity.icon === IconReceipt ? 'receipt' : 
                            activity.icon === IconUpload ? 'upload' : 'user-plus';
            return (
              <Group key={index} gap="md" align="flex-start">
                <div
                  className={`flex-shrink-0 size-10 rounded-full ${activity.iconBg} ${activity.iconColor} flex items-center justify-center`}
                >
                  <IconComponent size={20} className={`tabler-icon tabler-icon-${iconName}`} />
                </div>
                <div>
                  <Text className="text-gray-900 dark:text-white">
                    {activity.message.split('"').map((part, i) =>
                      i % 2 === 1 ? (
                        <span key={i} className="font-semibold">
                          "{part}"
                        </span>
                      ) : (
                        part
                      )
                    )}
                  </Text>
                  <Text size="sm" className="text-gray-500 dark:text-gray-400">
                    {activity.details}
                  </Text>
                </div>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

