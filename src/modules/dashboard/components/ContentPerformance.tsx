'use client';

import { Card, Text, Group, Anchor, Stack } from '@mantine/core';

interface PostPerformance {
  label: string;
  height: number; // percentage 0-100
}

interface ContentPerformanceProps {
  posts?: PostPerformance[];
}

const defaultPosts: PostPerformance[] = [
  { label: 'Post A', height: 40 },
  { label: 'Post B', height: 100 },
  { label: 'Post C', height: 80 },
  { label: 'Post D', height: 60 },
  { label: 'Post E', height: 30 },
];

export function ContentPerformance({ posts = defaultPosts }: ContentPerformanceProps) {
  return (
    <Card
      padding="lg"
      radius="xl"
      withBorder
      className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10 lg:col-span-2"
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
            Content Performance
          </Text>
          <Anchor size="sm" fw={500} className="text-primary hover:underline">
            View All
          </Anchor>
        </Group>
        <Text size="sm" className="text-gray-500 dark:text-gray-400">
          Views of the 5 most recent posts
        </Text>
        <div className="grid grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center pt-6 px-3 min-h-[240px]">
          {posts.map((post, index) => (
            <div key={index} className="flex flex-col items-center gap-2 w-full">
              <div
                className="bg-primary/20 dark:bg-primary/30 w-full rounded-t-lg transition-all"
                style={{ height: `${post.height}%` }}
              />
              <Text size="xs" fw={700} className="text-gray-500 dark:text-gray-400">
                {post.label}
              </Text>
            </div>
          ))}
        </div>
      </Stack>
    </Card>
  );
}






