// Accounting Module Notification Service (FAZ 2)

import { useCreateNotification } from '@/modules/notifications/hooks/useNotifications';

export interface InvoiceReminderData {
  invoiceId: string;
  invoiceNumber: string;
  dueDate: Date;
  amount: number;
  currency: string;
  recipientId: string;
}

export interface PaymentNotificationData {
  paymentId: string;
  amount: number;
  currency: string;
  invoiceId?: string;
  subscriptionId?: string;
  recipientId: string;
}

export interface SubscriptionRenewalData {
  subscriptionId: string;
  subscriptionName: string;
  renewalDate: Date;
  recipientId: string;
}

/**
 * Hook to send invoice reminder notification (Client-side)
 */
export function useSendInvoiceReminder() {
  const createNotification = useCreateNotification();
  
  return async (data: InvoiceReminderData): Promise<void> => {
    await createNotification.mutateAsync({
      title: 'Fatura Hatırlatıcısı',
      message: `Fatura ${data.invoiceNumber} için ödeme tarihi yaklaşıyor. Ödeme tarihi: ${data.dueDate.toLocaleDateString('tr-TR')}. Tutar: ${data.amount.toLocaleString('tr-TR', { style: 'currency', currency: data.currency })}`,
      type: 'warning',
      priority: 'high',
      recipientId: data.recipientId,
      module: 'accounting',
      data: {
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        dueDate: data.dueDate.toISOString(),
        amount: data.amount,
        currency: data.currency,
      },
      actionUrl: `/modules/accounting/invoices/${data.invoiceId}`,
      actionText: 'Faturayı Görüntüle',
    });
  };
}

/**
 * Hook to send payment notification (Client-side)
 */
export function useSendPaymentNotification() {
  const createNotification = useCreateNotification();
  
  return async (data: PaymentNotificationData): Promise<void> => {
    const actionUrl = data.invoiceId 
      ? `/modules/accounting/invoices/${data.invoiceId}`
      : data.subscriptionId 
      ? `/modules/accounting/subscriptions/${data.subscriptionId}`
      : undefined;

    await createNotification.mutateAsync({
      title: 'Ödeme Bildirimi',
      message: `${data.amount.toLocaleString('tr-TR', { style: 'currency', currency: data.currency })} tutarında ödeme alındı.`,
      type: 'success',
      priority: 'medium',
      recipientId: data.recipientId,
      module: 'accounting',
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
        invoiceId: data.invoiceId,
        subscriptionId: data.subscriptionId,
      },
      ...(actionUrl ? { actionUrl, actionText: 'Detayları Görüntüle' } : {}),
    });
  };
}

/**
 * Hook to send subscription renewal notification (Client-side)
 */
export function useSendSubscriptionRenewalNotification() {
  const createNotification = useCreateNotification();
  
  return async (data: SubscriptionRenewalData): Promise<void> => {
    await createNotification.mutateAsync({
      title: 'Abonelik Yenileme Hatırlatıcısı',
      message: `Abonelik "${data.subscriptionName}" için yenileme tarihi yaklaşıyor. Yenileme tarihi: ${data.renewalDate.toLocaleDateString('tr-TR')}`,
      type: 'info',
      priority: 'medium',
      recipientId: data.recipientId,
      module: 'accounting',
      data: {
        subscriptionId: data.subscriptionId,
        subscriptionName: data.subscriptionName,
        renewalDate: data.renewalDate.toISOString(),
      },
      actionUrl: `/modules/accounting/subscriptions/${data.subscriptionId}`,
      actionText: 'Aboneliği Görüntüle',
    });
  };
}

