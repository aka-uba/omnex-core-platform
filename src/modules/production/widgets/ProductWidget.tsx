/**
 * Production Module - Product Widget for Web Builder (FAZ 3)
 * Displays a list of products in a web page
 */

'use client';

import { Card, Table, Badge, Text, Group } from '@mantine/core';
import { useProducts } from '@/hooks/useProducts';
import type { ProductWidgetConfig } from './widgets.types';

interface ProductWidgetProps {
  config: ProductWidgetConfig;
}

export function ProductWidget({ config }: ProductWidgetProps) {
  const { data: productsData, isLoading } = useProducts({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.showOnlyActive ? { isActive: true } : {}),
  });

  const products = productsData?.products || [];

  return (
    <Card withBorder padding="md" radius="md">
      {config.title && (
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={600} size="lg">
            {config.title}
          </Text>
        </Card.Section>
      )}

      <Card.Section inheritPadding py="md">
        {isLoading ? (
          <Text c="dimmed">Yükleniyor...</Text>
        ) : products.length === 0 ? (
          <Text c="dimmed">Ürün bulunamadı</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ürün Adı</Table.Th>
                <Table.Th>Kategori</Table.Th>
                <Table.Th>Stok</Table.Th>
                <Table.Th>Durum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {products.map((product: any) => (
                <Table.Tr key={product.id}>
                  <Table.Td>{product.name || '-'}</Table.Td>
                  <Table.Td>{product.category || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm">{product.stockQuantity || 0}</Text>
                      {product.stockQuantity !== undefined && product.minStockLevel !== undefined && 
                       product.stockQuantity <= product.minStockLevel && (
                        <Badge size="xs" color="red">Düşük Stok</Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={product.isActive ? 'green' : 'gray'}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card.Section>
    </Card>
  );
}







