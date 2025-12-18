'use client';

import { Stack, Title, Text, Paper, Group, Badge, Button, CopyButton, ActionIcon, Tooltip, Alert, Code, Divider } from '@mantine/core';
import { IconCheck, IconCopy, IconExternalLink, IconKey, IconUser, IconMapPin, IconPhoto } from '@tabler/icons-react';

interface CredentialsSummaryStepProps {
    result: any;
    onFinish: () => void;
}

export function CredentialsSummaryStep({ result, onFinish }: CredentialsSummaryStepProps) {
    if (!result) {
        return (
            <Alert color="red" title="Error">
                No creation result available
            </Alert>
        );
    }

    const { credentials } = result;

    return (
        <Stack>
            <Alert icon={<IconCheck size={16} />} title="Tenant Created Successfully!" color="green">
                Your tenant has been created and is ready to use.
            </Alert>

            {/* Access URL */}
            <Paper p="md" withBorder>
                <Group justify="space-between" mb="sm">
                    <Title order={5}>Access URL</Title>
                    <Badge color="green">Active</Badge>
                </Group>
                <Group>
                    <Code style={{ flex: 1 }}>{credentials.accessUrl}</Code>
                    <CopyButton value={credentials.accessUrl}>
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'}>
                                <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                    <Tooltip label="Open in new tab">
                        <ActionIcon
                            component="a"
                            href={credentials.accessUrl}
                            target="_blank"
                            color="blue"
                        >
                            <IconExternalLink size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Paper>

            {/* SuperAdmin Credentials */}
            <Paper p="md" withBorder>
                <Group mb="sm">
                    <IconUser size={20} />
                    <Title order={5}>SuperAdmin Credentials</Title>
                </Group>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Email:</Text>
                        <Group gap="xs">
                            <Code>{credentials.superAdmin.email}</Code>
                            <CopyButton value={credentials.superAdmin.email}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Username:</Text>
                        <Group gap="xs">
                            <Code>{credentials.superAdmin.username}</Code>
                            <CopyButton value={credentials.superAdmin.username}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Password:</Text>
                        <Group gap="xs">
                            <Code>{credentials.superAdmin.password}</Code>
                            <CopyButton value={credentials.superAdmin.password}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                </Stack>
            </Paper>

            {/* Tenant Admin Credentials */}
            <Paper p="md" withBorder>
                <Group mb="sm">
                    <IconKey size={20} />
                    <Title order={5}>Tenant Admin Credentials</Title>
                </Group>
                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Email:</Text>
                        <Group gap="xs">
                            <Code>{credentials.tenantAdmin.email}</Code>
                            <CopyButton value={credentials.tenantAdmin.email}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Username:</Text>
                        <Group gap="xs">
                            <Code>{credentials.tenantAdmin.username}</Code>
                            <CopyButton value={credentials.tenantAdmin.username}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Password:</Text>
                        <Group gap="xs">
                            <Code>{credentials.tenantAdmin.password}</Code>
                            <CopyButton value={credentials.tenantAdmin.password}>
                                {({ copied, copy }) => (
                                    <ActionIcon size="sm" color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </ActionIcon>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                </Stack>
            </Paper>

            {/* Additional Info */}
            {credentials.exportTemplateId && (
                <Paper p="md" withBorder>
                    <Group mb="sm">
                        <IconPhoto size={20} />
                        <Title order={5}>Export Template</Title>
                    </Group>
                    <Text size="sm">
                        Default export template created with ID: <Code>{credentials.exportTemplateId}</Code>
                    </Text>
                </Paper>
            )}

            {credentials.locationId && (
                <Paper p="md" withBorder>
                    <Group mb="sm">
                        <IconMapPin size={20} />
                        <Title order={5}>Initial Location</Title>
                    </Group>
                    <Text size="sm">
                        Initial location created with ID: <Code>{credentials.locationId}</Code>
                    </Text>
                </Paper>
            )}

            <Divider />

            <Button size="lg" onClick={onFinish} fullWidth>
                Go to Companies Dashboard
            </Button>
        </Stack>
    );
}
