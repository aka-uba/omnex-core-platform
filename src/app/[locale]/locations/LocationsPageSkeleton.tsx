import { Container, Paper, Skeleton, Table } from '@mantine/core';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';

export function LocationsPageSkeleton() {
  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="title"
        description="description"
        namespace="modules/locations"
      />

      <Paper shadow="sm" p="md" radius="md" mt="md">
        <Skeleton height={40} mb="md" />
        <Skeleton height={40} mb="md" />

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
              <Table.Th>
                <Skeleton height={20} />
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[...Array(5)].map((_, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={20} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Container>
  );
}








