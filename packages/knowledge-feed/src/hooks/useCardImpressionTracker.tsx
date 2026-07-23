import React, { useEffect, useMemo, useRef } from 'react';
import type { UnifiedLogger } from '@rbx/unified-logger';
import type { KnowledgeFeedEvent } from '../constants/eventParams';
import type { TBaseEventParams } from '../types';
import debounce from '../utilities/debounce';

const outOfViewThresholdMs = 60000;

const useCardImpressionTracker = (
  id: number | string,
  title: string,
  url: string,
  position: number,
  ref: React.RefObject<HTMLDivElement | null>,
  eventName: KnowledgeFeedEvent,
  unifiedLoggerClient: UnifiedLogger,
  eventParams: TBaseEventParams,
) => {
  const viewsRef = useRef<{ [key: string]: number }>({});

  // Create a debounced logImpression function
  const [logImpression, cancelLogImpression] = useMemo(
    () =>
      debounce(
        () => {
          unifiedLoggerClient.logImpressionEvent({
            eventName,
            parameters: {
              ...eventParams,
              tileId: id.toString(),
              tileTitle: title,
              tileUrl: url,
              tilePosition: position.toString(),
            },
          });
        },
        100, // Do not fire event until the card has stayed in view for more than 100ms
      ),
    [eventName, eventParams, id, title, url, position, unifiedLoggerClient],
  );

  useEffect(() => {
    const refCurrent = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const viewKey = `${id}-${position}`;
            const lastView = viewsRef.current[viewKey];
            if (!lastView || Date.now() - lastView >= outOfViewThresholdMs) {
              // Only fire impression event first time the card is in view
              // or if it has been out of view for more than {outOfViewThresholdMs}
              logImpression();
            }
            // As long as the card is in view, keep updating the last view time
            viewsRef.current[viewKey] = Date.now();
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5, // Trigger when 50% of the element is in view
      },
    );

    if (refCurrent) {
      observer.observe(refCurrent);
    }
    return () => {
      if (refCurrent) {
        observer.unobserve(refCurrent);
        observer.disconnect();
      }
      cancelLogImpression(); // Cancel any pending debounced invocation
    };
  }, [ref, id, position, logImpression, cancelLogImpression, unifiedLoggerClient]);
};

export default useCardImpressionTracker;
