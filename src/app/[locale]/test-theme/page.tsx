/**
 * Theme Configurator Test Page
 * Tema özelleştirici test sayfası
 */

'use client';

import { useEffect } from 'react';
import { Button, Stack, Text, Code, Paper, Group } from '@mantine/core';
import { IconPlayerPlay, IconCheck, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function TestThemePage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Test scriptini inline olarak yükle
    const loadTestScript = async () => {
      try {
        const response = await fetch('/scripts/test-theme-configurator.js');
        const scriptContent = await response.text();
        const script = document.createElement('script');
        script.textContent = scriptContent;
        document.body.appendChild(script);
      } catch (error) {
        console.error('Test scripti yüklenemedi:', error);
      }
    };
    
    loadTestScript();
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      // Test scriptini çalıştır
      if (typeof (window as any).testThemeConfigurator === 'function') {
        const results = await (window as any).testThemeConfigurator();
        setTestResults(results);
      } else {
        setTestResults({
          error: 'Test scripti yüklenemedi. Sayfayı yenileyin.',
        });
      }
    } catch (error) {
      setTestResults({
        error: `Test hatası: ${error}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Stack gap="lg">
        <div>
          <h1>Tema Özelleştirici Test Sayfası</h1>
          <Text c="dimmed">
            Bu sayfa tema özelleştiricinin tüm seçeneklerini test eder.
          </Text>
        </div>

        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Test Kontrolleri</Text>
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              onClick={runTests}
              loading={isRunning}
              disabled={isRunning}
            >
              Testleri Çalıştır
            </Button>
          </Group>

          <Text size="sm" c="dimmed" mb="md">
            Test scripti tema özelleştiricinin tüm seçeneklerini kontrol eder:
          </Text>

          <Stack gap="xs">
            <Text size="sm">• Layout Type (Sidebar/Top)</Text>
            <Text size="sm">• Theme Mode (Light/Dark/Auto)</Text>
            <Text size="sm">• Direction (LTR/RTL)</Text>
            <Text size="sm">• Sidebar Ayarları (Genişlik, Collapsed, Arka Plan, Renk)</Text>
            <Text size="sm">• Top Layout Ayarları (Yükseklik, Arka Plan, Scroll Behavior)</Text>
            <Text size="sm">• Mobil Ayarları (Header Height, Icon Size)</Text>
            <Text size="sm">• Content Area Ayarları (Genişlik, Padding)</Text>
            <Text size="sm">• Footer Görünürlüğü</Text>
          </Stack>
        </Paper>

        {testResults && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconCheck size={20} color="green" />
                <Text fw={600}>Test Sonuçları</Text>
              </Group>

              {testResults.error ? (
                <Code block color="red">
                  {testResults.error}
                </Code>
              ) : (
                <>
                  <Group>
                    <Text>
                      <IconCheck size={16} color="green" style={{ marginRight: '8px' }} />
                      Başarılı: {testResults.passed}
                    </Text>
                    <Text>
                      <IconX size={16} color="red" style={{ marginRight: '8px' }} />
                      Başarısız: {testResults.failed}
                    </Text>
                    <Text>
                      <IconAlertTriangle size={16} color="orange" style={{ marginRight: '8px' }} />
                      Uyarılar: {testResults.warnings}
                    </Text>
                  </Group>

                  <Text fw={600}>
                    Başarı Oranı: {testResults.successRate?.toFixed(1)}%
                  </Text>

                  {testResults.details?.failed?.length > 0 && (
                    <div>
                      <Text fw={600} mb="xs" c="red">
                        Başarısız Testler:
                      </Text>
                      <Stack gap="xs">
                        {testResults.details.failed.map((test: any, index: number) => (
                          <Text key={index} size="sm" c="red">
                            • {test.name}
                            {test.message && `: ${test.message}`}
                          </Text>
                        ))}
                      </Stack>
                    </div>
                  )}

                  {testResults.details?.warnings?.length > 0 && (
                    <div>
                      <Text fw={600} mb="xs" c="orange">
                        Uyarılar:
                      </Text>
                      <Stack gap="xs">
                        {testResults.details.warnings.map((warning: any, index: number) => (
                          <Text key={index} size="sm" c="orange">
                            • {warning.name}: {warning.message}
                          </Text>
                        ))}
                      </Stack>
                    </div>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Paper p="md" withBorder>
          <Text fw={600} mb="xs">
            Notlar:
          </Text>
          <Stack gap="xs">
            <Text size="sm">
              • Test scripti browser console'da da çalıştırılabilir: <Code>testThemeConfigurator()</Code>
            </Text>
            <Text size="sm">
              • Bazı testler modal açık olmasını gerektirir
            </Text>
            <Text size="sm">
              • Test sonuçları localStorage'daki config'i kontrol eder
            </Text>
            <Text size="sm">
              • Test sırasında tema ayarları değişebilir, test sonrası sıfırlayabilirsiniz
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </div>
  );
}

