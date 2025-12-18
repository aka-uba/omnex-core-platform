import { z } from 'zod';

export const notificationSchema = z.object({
    title: z.string().min(1, 'required'),
    message: z.string().min(1, 'required'),
    type: z.enum(['info', 'warning', 'error', 'success', 'task', 'alert']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    sender_id: z.string().optional(),
    recipient_id: z.string().optional(),
    module: z.string().optional(),
    status: z.enum(['read', 'unread', 'archived']).default('unread'),
    data: z.any().optional(), // JSON object (will be stringified)
    expires_at: z.date().nullable().optional(),
    is_global: z.boolean().default(false),
    location_id: z.string().optional(),
    action_url: z.string().optional(),
    action_text: z.string().optional(),
    attachments: z.array(z.object({
        url: z.string(),
        filename: z.string(),
        contentType: z.string().optional(),
        size: z.number().optional(),
    })).optional(),
}).refine((data) => {
    if (data.is_global) return true;
    return !!data.recipient_id;
}, {
    message: "Recipient is required for non-global notifications",
    path: ["recipient_id"],
}).refine((data) => {
    if (data.type === 'task') {
        return !!data.action_url && !!data.action_text;
    }
    return true;
}, {
    message: "Action URL and Text are required for tasks",
    path: ["action_url"],
});

export type NotificationFormValues = z.infer<typeof notificationSchema>;
