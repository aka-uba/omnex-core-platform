'use client';

import { Card, Text, Group, Anchor, Stack } from '@mantine/core';
import { IconRocket, IconBulb, IconUserStar } from '@tabler/icons-react';

interface UpcomingPost {
  title: string;
  date: string;
  time: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface UpcomingPostsProps {
  posts?: UpcomingPost[];
}

const defaultPosts: UpcomingPost[] = [
  {
    title: 'New Product Launch',
    date: 'June 28',
    time: '9:00 AM',
    icon: IconRocket,
  },
  {
    title: 'Weekly Tech Tip',
    date: 'June 30',
    time: '12:00 PM',
    icon: IconBulb,
  },
  {
    title: 'Team Spotlight: Sarah',
    date: 'July 02',
    time: '10:00 AM',
    icon: IconUserStar,
  },
];

export function UpcomingPosts({ posts = defaultPosts }: UpcomingPostsProps) {
  return (
    <Card
      padding="lg"
      radius="xl"
      withBorder
      className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            Upcoming Posts
          </Text>
          <Anchor size="sm" fw={500} className="text-primary hover:underline">
            View All
          </Anchor>
        </Group>
        <Stack gap="md">
          {posts.map((post, index) => {
            const IconComponent = post.icon;
            // Get icon name for className
            const iconName = post.icon === IconRocket ? 'rocket' : 
                            post.icon === IconBulb ? 'bulb' : 
                            post.icon === IconUserStar ? 'user-star' : 'rocket';
            return (
              <Group key={index} gap="md" align="center">
                <div className="flex-shrink-0 size-10 rounded-lg bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary">
                  <IconComponent size={20} className={`tabler-icon tabler-icon-${iconName}`} />
                </div>
                <div>
                  <Text fw={500} className="text-gray-900 dark:text-white">
                    {post.title}
                  </Text>
                  <Text size="sm" className="text-gray-500 dark:text-gray-400">
                    {post.date}, {post.time}
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

