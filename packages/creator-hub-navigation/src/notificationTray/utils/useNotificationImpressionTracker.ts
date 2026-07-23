import { useEffect, useMemo, useRef } from 'react';
import type { CreatorStreamNotification } from '@rbx/client-creator-notification-streams-api/v1';
import { notificationItemImpressionEventModel } from '../../event/eventConstants';
import type { TSendEvent } from '../../providers/EventProvider';
import type useNotificationsM2Tracking from '../hooks/useNotificationsM2Tracking';

const OUT_OF_VIEW_THRESHOLD_MS = 60000;

// NOTE (neoxu, 10/30/2025): This hook is similiar to knowledge-feed/src/hooks/useCardImpressionTracker.tsx
function useNotificationImpressionTracker(
  ref: React.RefObject<HTMLElement | null>,
  notification: CreatorStreamNotification | null | undefined,
  sendEvent: TSendEvent,
  enableNotificationsM2: boolean,
  unseenNotifFrontierIndex?: number,
  reportNewUnseenNotifFrontier?: ReturnType<
    typeof useNotificationsM2Tracking
  >['reportNewUnseenNotifFrontier'],
  notificationGroupIndex?: number,
): void {
  const lastViewByIdRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<number | null>(null);

  const debouncedLogImpression = useMemo(() => {
    const log = () => {
      if (notification) {
        sendEvent(notificationItemImpressionEventModel(notification, notificationGroupIndex));
      }
    };

    const debounced = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(log, 100);
    };

    const cancel = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    return { debounced, cancel };
  }, [notification, sendEvent, notificationGroupIndex]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !notification) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = notification.notificationId ?? '';
            const lastView = lastViewByIdRef.current[key];
            if (!lastView || Date.now() - lastView >= OUT_OF_VIEW_THRESHOLD_MS) {
              debouncedLogImpression.debounced();
            }
            lastViewByIdRef.current[key] = Date.now();
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5, // fire when 50% visible
      },
    );
    // fire when 80% of element is in view, indicating user has 'seen this'
    const seenNotificationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = notification.notificationId ?? '';
            if (
              enableNotificationsM2 &&
              notificationGroupIndex !== undefined &&
              unseenNotifFrontierIndex !== undefined &&
              notificationGroupIndex < unseenNotifFrontierIndex
            ) {
              reportNewUnseenNotifFrontier?.(key);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.8, // fire when 80% visible
      },
    );

    observer.observe(node);
    seenNotificationObserver.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
      seenNotificationObserver.unobserve(node);
      seenNotificationObserver.disconnect();
      debouncedLogImpression.cancel();
    };
  }, [
    ref,
    notification,
    debouncedLogImpression,
    notificationGroupIndex,
    reportNewUnseenNotifFrontier,
    enableNotificationsM2,
    unseenNotifFrontierIndex,
  ]);
}

export default useNotificationImpressionTracker;
