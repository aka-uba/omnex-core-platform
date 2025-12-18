/**
 * NotificationForm Validation Tests
 * 
 * Tests for:
 * - Required field validation
 * - Global notification validation (user required if not global)
 * - Task type validation (action URL/text required)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notificationSchema } from '@/modules/notifications/schemas/notification.schema';

// Mock component for testing
function TestNotificationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(notificationSchema),
  });

  const onSubmit = (data: Record<string, unknown>) => {
    // Form submitted
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('title')}
        placeholder="Title"
        data-testid="title-input"
      />
      {errors.title && (
        <span data-testid="title-error">{errors.title.message as string}</span>
      )}

      <input
        {...register('message')}
        placeholder="Message"
        data-testid="message-input"
      />
      {errors.message && (
        <span data-testid="message-error">{errors.message.message as string}</span>
      )}

      <select {...register('type')} data-testid="type-select">
        <option value="info">Info</option>
        <option value="task">Task</option>
      </select>

      <input
        {...register('action_url')}
        placeholder="Action URL"
        data-testid="action-url-input"
      />
      {errors.action_url && (
        <span data-testid="action-url-error">
          {errors.action_url.message as string}
        </span>
      )}

      <input
        type="checkbox"
        {...register('is_global')}
        data-testid="is-global-checkbox"
      />

      <input
        {...register('recipient_id')}
        placeholder="Recipient ID"
        data-testid="recipient-id-input"
      />
      {errors.recipient_id && (
        <span data-testid="recipient-id-error">{errors.recipient_id.message as string}</span>
      )}

      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
}

describe('NotificationForm Validation', () => {
  it('should show error when title is empty', async () => {
    render(<TestNotificationForm />);

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const error = screen.getByTestId('title-error');
      expect(error).toBeInTheDocument();
    });
  });

  it('should show error when message is empty', async () => {
    render(<TestNotificationForm />);

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const error = screen.getByTestId('message-error');
      expect(error).toBeInTheDocument();
    });
  });

  it('should show error when task type is selected without action URL', async () => {
    render(<TestNotificationForm />);

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const typeSelect = screen.getByTestId('type-select');
    fireEvent.change(typeSelect, { target: { value: 'task' } });

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const error = screen.getByTestId('action-url-error');
      expect(error).toBeInTheDocument();
    });
  });

  it('should show error when non-global notification has no recipient_id', async () => {
    render(<TestNotificationForm />);

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const isGlobalCheckbox = screen.getByTestId('is-global-checkbox');
    fireEvent.click(isGlobalCheckbox); // Uncheck (not global)

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const error = screen.getByTestId('recipient-id-error');
      expect(error).toBeInTheDocument();
    });
  });

  it('should submit successfully with valid data', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<TestNotificationForm />);

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const isGlobalCheckbox = screen.getByTestId('is-global-checkbox');
    fireEvent.click(isGlobalCheckbox); // Check (is global)

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Submitted:',
        expect.objectContaining({
          title: 'Test Title',
          message: 'Test message',
          is_global: true,
        })
      );
    });

    consoleSpy.mockRestore();
  });
});

