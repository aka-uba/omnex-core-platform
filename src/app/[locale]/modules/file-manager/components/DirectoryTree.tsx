'use client';

import { useState } from 'react';
import { Box, Text, UnstyledButton, Group, Collapse } from '@mantine/core';
import { IconChevronRight, IconFolder, IconFolderOpen, IconBuilding } from '@tabler/icons-react';

interface DirectoryNode {
    id: string;
    name: string;
    path: string;
    type: 'tenant' | 'module' | 'folder';
    children?: DirectoryNode[];
}

interface DirectoryTreeProps {
    nodes: DirectoryNode[];
    onSelect: (path: string) => void;
    selectedPath?: string;
}

function TreeNode({
    node,
    level = 0,
    onSelect,
    selectedPath,
}: {
    node: DirectoryNode;
    level?: number;
    onSelect: (path: string) => void;
    selectedPath?: string;
}) {
    const [opened, setOpened] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedPath === node.path;

    const handleClick = () => {
        if (hasChildren) {
            setOpened(!opened);
        }
        onSelect(node.path);
    };

    const getIcon = () => {
        if (node.type === 'tenant') {
            return <IconBuilding size={16} />;
        }
        return opened ? <IconFolderOpen size={16} /> : <IconFolder size={16} />;
    };

    return (
        <Box>
            <UnstyledButton
                onClick={handleClick}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: `${12 + level * 20}px`,
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
                    transition: 'background-color 0.2s',
                }}
                styles={{
                    root: {
                        '&:hover': {
                            backgroundColor: isSelected
                                ? 'var(--mantine-color-blue-light)'
                                : 'var(--mantine-color-gray-1)',
                        },
                    },
                }}
            >
                <Group gap="xs" wrap="nowrap">
                    {hasChildren && (
                        <IconChevronRight
                            size={14}
                            style={{
                                transform: opened ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s',
                            }}
                        />
                    )}
                    {!hasChildren && <Box w={14} />}
                    {getIcon()}
                    <Text size="sm" fw={isSelected ? 600 : 400} truncate>
                        {node.name}
                    </Text>
                </Group>
            </UnstyledButton>

            {hasChildren && (
                <Collapse in={opened}>
                    {node.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            {...(selectedPath ? { selectedPath } : {})}
                        />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

export function DirectoryTree({ nodes, onSelect, selectedPath }: DirectoryTreeProps) {
    return (
        <Box>
            {nodes.map((node) => (
                <TreeNode key={node.id} node={node} onSelect={onSelect} {...(selectedPath ? { selectedPath } : {})} />
            ))}
        </Box>
    );
}
