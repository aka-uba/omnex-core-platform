import { PaymentMethodsSettingsClient } from './PaymentMethodsSettingsClient';

export const dynamic = 'force-dynamic';

export default async function PaymentMethodsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PaymentMethodsSettingsClient locale={locale} />;
}
