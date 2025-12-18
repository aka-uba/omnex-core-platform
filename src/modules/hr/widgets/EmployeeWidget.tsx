/**
 * HR Module - Employee Widget for Web Builder (FAZ 3)
 * Displays a list of employees in a web page
 */

'use client';

import { Card, Table, Badge, Text, Avatar, Group } from '@mantine/core';
import { useEmployees } from '@/hooks/useEmployees';
import type { EmployeeWidgetConfig } from './widgets.types';

interface EmployeeWidgetProps {
  config: EmployeeWidgetConfig;
}

export function EmployeeWidget({ config }: EmployeeWidgetProps) {
  const { data: employeesData, isLoading } = useEmployees({
    page: 1,
    pageSize: config.limit || 10,
    ...(config.showOnlyActive ? { isActive: true } : {}),
    ...(config.department ? { department: config.department } : {}),
  });

  const employees = employeesData?.employees || [];

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
        ) : employees.length === 0 ? (
          <Text c="dimmed">Personel bulunamadı</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Personel</Table.Th>
                <Table.Th>Departman</Table.Th>
                <Table.Th>Pozisyon</Table.Th>
                <Table.Th>Durum</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employees.map((employee: any) => (
                <Table.Tr key={employee.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl">
                        {employee.firstName?.[0] || 'U'}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500}>
                          {employee.firstName} {employee.lastName}
                        </Text>
                        {employee.email && (
                          <Text size="xs" c="dimmed">
                            {employee.email}
                          </Text>
                        )}
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>{employee.department || '-'}</Table.Td>
                  <Table.Td>{employee.position || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={employee.isActive ? 'green' : 'gray'}>
                      {employee.isActive ? 'Aktif' : 'Pasif'}
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







