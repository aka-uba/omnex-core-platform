/**
 * Maintenance Module - Maintenance Widget for Web Builder (FAZ 3)
 * Displays a list of maintenance records in a web page
 */

'use client';

import { Card, Table, Badge, Text } from '@mantine/core';
import { useMaintenanceRecords } from '@/hooks/useMaintenanceRecords';
import type { MaintenanceWidgetConfig } from './widgets.types';

interface MaintenanceWidgetProps {
  config: MaintenanceWidgetConfig;
}

export function MaintenanceWidget({ config }: MaintenanceWidgetProps) {
  const { data: recordsData, isLoading } = useMaintenanceRecords({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.status !== 'all' && config.status ? { status: config.status } : {}),
    ...(config.type !== 'all' && config.type ? { type: config.type } : {}),
  });

  const records = recordsData?.records || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'scheduled':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'scheduled':
        return 'Planlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'blue';
      case 'corrective':
        return 'orange';
      case 'emergency':
        return 'red';
      default:
        return 'gray';
    }
  };

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
        ) : records.length === 0 ? (
          <Text c="dimmed">Bakım kaydı bulunamadı</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ekipman</Table.Th>
                <Table.Th>Tip</Table.Th>
                <Table.Th>Tarih</Table.Th>
                <Table.Th>Durum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((record: any) => (
                <Table.Tr key={record.id}>
                  <Table.Td>{record.equipmentName || record.equipmentId || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={getTypeColor(record.type)} size="sm">
                      {record.type === 'preventive'
                        ? 'Önleyici'
                        : record.type === 'corrective'
                        ? 'Düzeltici'
                        : record.type === 'emergency'
                        ? 'Acil'
                        : record.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {record.scheduledDate
                      ? new Date(record.scheduledDate).toLocaleDateString('tr-TR')
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
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







