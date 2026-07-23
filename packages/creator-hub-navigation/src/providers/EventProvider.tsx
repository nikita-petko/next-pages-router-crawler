import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  PropsWithChildren,
  createContext,
  useContext,
} from 'react';
import { UnifiedLogger } from '@rbx/unified-logger';
import logEventToUnifiedLogger from '../utils/logEventToUnifiedLogger';
import { TrackerClientRequest } from '../event/eventConstants';
import { getEventBasePathV2 as getEventBasePath } from '../utils/getBasePaths';
import useNavigationConfigs from '../hooks/useNavigationConfigs';

export type TSendEvent = (clientRequest: TrackerClientRequest) => void;

type TEventContext = TSendEvent;

export const EventContext = createContext<TEventContext | null>(null);
EventContext.displayName = 'EventContext';

const EventProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { currentProduct, robloxEnvironment: environment, target } = useNavigationConfigs();
  const eventBaseUrl = getEventBasePath(target, environment);

  const unifiedLoggerClient = useMemo(() => {
    return new UnifiedLogger({
      eventBaseUrl,
      product: 'CreatorHubShell',
      sessionProductGroup: 'CreatorHub',
    });
  }, [eventBaseUrl]);

  const sendEvent = useCallback(
    (clientRequest: TrackerClientRequest) => {
      logEventToUnifiedLogger(unifiedLoggerClient, currentProduct, clientRequest);
    },
    [currentProduct, unifiedLoggerClient],
  );
  return <EventContext.Provider value={sendEvent}>{children}</EventContext.Provider>;
};

export const useEventLogger = () => {
  const context = useContext(EventContext);
  if (context === null) {
    throw new Error('useEventProvider must be used within EventProvider');
  }
  return context;
};

export default EventProvider;
