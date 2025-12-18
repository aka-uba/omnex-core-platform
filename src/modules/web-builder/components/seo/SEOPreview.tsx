/**
 * Web Builder - SEO Preview (FAZ 3)
 * Shows how the page will appear in search engine results
 */

'use client';

import { Card, Stack, Text, Group, Badge } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { SEOSettings } from './SEOPanel';

interface SEOPreviewProps {
  settings: SEOSettings;
  pageUrl?: string;
}

export function SEOPreview({ settings, pageUrl = 'https://example.com/page' }: SEOPreviewProps) {
  const displayTitle = settings.metaTitle || 'Sayfa Başlığı';
  const displayDescription = settings.metaDescription || 'Sayfa açıklaması burada görünecek...';
  const displayUrl = pageUrl;

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <Group gap="xs">
          <IconSearch size={18} />
          <Text fw={600} size="sm">
            Arama Motoru Önizlemesi
          </Text>
        </Group>

        <div className="border border-gray-200 rounded p-4 bg-white">
          {/* URL */}
          <Text size="xs" c="green" className="mb-1">
            {displayUrl}
          </Text>

          {/* Title */}
          <Text
            fw={600}
            size="lg"
            className="mb-1 text-blue-600 hover:underline cursor-pointer"
            style={{
              lineHeight: 1.3,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayTitle}
          </Text>

          {/* Description */}
          <Text
            size="sm"
            c="dimmed"
            style={{
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {displayDescription}
          </Text>

          {/* Keywords Badges */}
          {settings.metaKeywords && settings.metaKeywords.length > 0 && (
            <Group gap="xs" mt="xs">
              {settings.metaKeywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} size="xs" variant="light" color="gray">
                  {keyword}
                </Badge>
              ))}
              {settings.metaKeywords.length > 5 && (
                <Badge size="xs" variant="light" color="gray">
                  +{settings.metaKeywords.length - 5} daha
                </Badge>
              )}
            </Group>
          )}
        </div>

        <Text size="xs" c="dimmed">
          Bu, sayfanızın Google gibi arama motorlarında nasıl görüneceğinin yaklaşık bir önizlemesidir.
        </Text>
      </Stack>
    </Card>
  );
}







