/**
 * ToastNotification Component Tests
 * 
 * Tests for:
 * - Pause on hover functionality
 * - Progress bar animation
 * - Color coding by type
 * - Auto-dismiss behavior
 */

import { render, fireEvent, waitFor } from '@testing-library/react';
import { ToastNotification } from '@/modules/notifications/components/ToastNotification';

// Mock Mantine notifications
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(() => 'mock-id'),
    hide: jest.fn(),
  },
}));

describe('ToastNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should pause progress on hover', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <ToastNotification
        id="test-1"
        type="info"
        title="Test Notification"
        message="Test message"
        duration={4000}
        onClose={onClose}
      />
    );

    const toast = container.querySelector('.toast');
    expect(toast).toBeInTheDocument();

    // Get initial progress
    const progressBar = container.querySelector('.toastProgressBar') as HTMLElement;
    const initialWidth = progressBar.style.width;

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Hover over toast
    fireEvent.mouseEnter(toast!);

    // Fast-forward more time
    jest.advanceTimersByTime(2000);

    // Progress should be paused (same width)
    await waitFor(() => {
      expect(progressBar.style.width).toBe(initialWidth);
    });

    // Leave hover
    fireEvent.mouseLeave(toast!);

    // Progress should resume
    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(parseFloat(progressBar.style.width)).toBeLessThan(parseFloat(initialWidth));
    });
  });

  it('should show correct color for success type', () => {
    const { container } = render(
      <ToastNotification
        id="test-2"
        type="success"
        title="Success"
        duration={4000}
      />
    );

    const toast = container.querySelector('.toast-success');
    expect(toast).toBeInTheDocument();
  });

  it('should show correct color for error type', () => {
    const { container } = render(
      <ToastNotification
        id="test-3"
        type="error"
        title="Error"
        duration={4000}
      />
    );

    const toast = container.querySelector('.toast-error');
    expect(toast).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ToastNotification
        id="test-4"
        type="info"
        title="Test"
        duration={4000}
        onClose={onClose}
      />
    );

    const closeButton = container.querySelector('.toastClose');
    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('should auto-dismiss after duration', async () => {
    const onClose = jest.fn();
    render(
      <ToastNotification
        id="test-5"
        type="info"
        title="Test"
        duration={4000}
        onClose={onClose}
      />
    );

    // Fast-forward past duration
    jest.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should not auto-dismiss when duration is 0', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ToastNotification
        id="test-6"
        type="info"
        title="Test"
        duration={0}
        onClose={onClose}
      />
    );

    const progressBar = container.querySelector('.toastProgress');
    expect(progressBar).not.toBeInTheDocument();

    // Fast-forward time
    jest.advanceTimersByTime(10000);

    // onClose should not be called
    expect(onClose).not.toHaveBeenCalled();
  });
});

