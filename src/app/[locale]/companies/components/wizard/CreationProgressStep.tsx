'use client';

import { Stack, Title, Text, Progress, Timeline, ThemeIcon } from '@mantine/core';
import { IconCheck, IconDatabase, IconFolder, IconFileText, IconMapPin, IconLoader } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function CreationProgressStep() {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { icon: IconDatabase, label: 'Creating database', description: 'Setting up PostgreSQL database' },
        { icon: IconFileText, label: 'Running migrations', description: 'Applying database schema' },
        { icon: IconFolder, label: 'Creating storage', description: 'Setting up file directories' },
        { icon: IconFileText, label: 'Seeding data', description: 'Creating default users and roles' },
        { icon: IconFileText, label: 'Creating export template', description: 'Setting up company template' },
        { icon: IconMapPin, label: 'Creating location', description: 'Setting up initial location' },
    ];

    useEffect(() => {
        // Simulate progress
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < steps.length - 1) {
                    return prev + 1;
                }
                clearInterval(interval);
                return prev;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <Stack>
            <Title order={4}>Creating Tenant...</Title>
            <Text size="sm" c="dimmed">
                Please wait while we set up your tenant. This may take a minute.
            </Text>

            <Progress value={progress} size="lg" radius="xl" animated />

            <Timeline active={currentStep} bulletSize={32} lineWidth={2}>
                {steps.map((step, index) => (
                    <Timeline.Item
                        key={index}
                        bullet={
                            index < currentStep ? (
                                <ThemeIcon size={32} variant="filled" color="green" radius="xl">
                                    <IconCheck size={16} />
                                </ThemeIcon>
                            ) : index === currentStep ? (
                                <ThemeIcon size={32} variant="filled" color="blue" radius="xl">
                                    <IconLoader size={16} className="animate-spin" />
                                </ThemeIcon>
                            ) : (
                                <step.icon size={16} />
                            )
                        }
                        title={step.label}
                    >
                        <Text size="xs" c="dimmed">{step.description}</Text>
                    </Timeline.Item>
                ))}
            </Timeline>
        </Stack>
    );
}
