import React, { FC, useCallback, useEffect, useRef } from 'react';
import { makeStyles } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import emptyFunction from '../emptyFunction';

const useStyles = makeStyles()(() => ({
  loggerContainer: {
    display: 'contents',
  },
}));

type LoggerProps = {
  children: React.ReactElement;
  eventName: string;
  parameters?: Record<string, string>;
};

const ImpressionLogger: FC<LoggerProps> = ({ children, eventName, parameters }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    classes: { loggerContainer },
  } = useStyles();

  const { unifiedLogger } = useUnifiedLoggerProvider();
  const hasLoggedRef = useRef(false);
  const handler = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (hasLoggedRef.current) {
        return;
      }

      if (entry.isIntersecting) {
        unifiedLogger.logImpressionEvent({ eventName, parameters });
        hasLoggedRef.current = true;
      }
    },
    [eventName, parameters, unifiedLogger],
  );

  useEffect(() => {
    if (!containerRef.current?.firstElementChild) {
      return emptyFunction;
    }

    hasLoggedRef.current = false;
    const observer = new IntersectionObserver(handler, { threshold: 0.5 });
    observer.observe(containerRef.current.firstElementChild);

    return () => {
      observer.disconnect();
    };
  }, [handler]);

  return (
    <div className={loggerContainer} ref={containerRef}>
      {children}
    </div>
  );
};

export default ImpressionLogger;
