import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  EventSubscriptionApi,
  type EventSubscriptionSubscribeRequest,
} from '@rbx/client-event-subscription/v1';
import {
  RealTimeNotificationsBasePath,
  useSignalR,
  type TSignalRCallback,
} from '@rbx/signalr-userhub-client';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

type UnsubscribeFunction = () => void;
export type CreatorConfigSubscriptionsBundle = {
  subscribeToConfigUpdates: (
    universeId: number,
    callback: () => void,
  ) => { unsubscribe: UnsubscribeFunction };
  subscribeToDraftUpdates: (
    universeId: number,
    callback: () => void,
  ) => { unsubscribe: UnsubscribeFunction };
};
export const emptySubscriptionsBundle: CreatorConfigSubscriptionsBundle = {
  subscribeToConfigUpdates: () => ({ unsubscribe: () => {} }),
  subscribeToDraftUpdates: () => ({ unsubscribe: () => {} }),
};
const creatorConfigsSubscriptionsContext =
  React.createContext<CreatorConfigSubscriptionsBundle>(emptySubscriptionsBundle);

const configuration = createClientConfiguration('event-subscription', 'bedev2');

const eventSubscriptionApi = new EventSubscriptionApi(configuration);

async function makeBackendSubscription(request: {
  clientId?: string;
  events: Array<{ type: string; id: string }>;
}): Promise<void> {
  const eventSubscriptionSubscribeRequest: EventSubscriptionSubscribeRequest = {
    clientId: 'creator-hub-default-client-id',
    ...request,
  };

  await eventSubscriptionApi.eventSubscriptionSubscribe({
    eventSubscriptionSubscribeRequest,
  });
}

const SignalRProvider = ({
  children,
  callback,
}: {
  children: React.ReactNode;
  callback: TSignalRCallback;
}) => {
  const { settings, isFetched } = useSettings();
  useSignalR(callback, RealTimeNotificationsBasePath.Production, {
    crossTab: {
      enabled: settings.enableSignalRCrossTab,
      isLoading: !isFetched,
    },
  });
  return children;
};

const subscriptionType = 'ConfigUpdate';
const useClientConfigsSubscriptionEffect = () => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();

  const subscribeCallback = useCallback(async () => {
    if (isUniverseLoading || !universeId) {
      return;
    }
    try {
      await makeBackendSubscription({
        events: [{ type: subscriptionType, id: `${universeId}` }],
      });
    } catch {
      logAnalyticsError('Failed to subscribe to config updates');
    }
  }, [universeId, isUniverseLoading]);

  useEffect(() => {
    void subscribeCallback();
  }, [subscribeCallback]);
};

const addSubscriptionToSetMap = (
  setMap: Map<number, Set<() => void>>,
  universeId: number,
  callback: () => void,
): (() => void) => {
  const beforeAdding = setMap.get(universeId) ?? new Set();
  beforeAdding.add(callback);
  setMap.set(universeId, beforeAdding);
  const unsubscribe = () => {
    const beforeRemoving = setMap.get(universeId) ?? new Set();
    beforeRemoving.delete(callback);
    setMap.set(universeId, beforeRemoving);
  };
  return unsubscribe;
};

enum CreatorConfigUpdateType {
  Commit = 'Commit',
  Draft = 'Draft',
}
type CreatorConfigUpdateEventDetail = {
  updateType: CreatorConfigUpdateType;
  universeId: number;
  resourceType: 'Experience';
};

const parseEventDetail = (detail: string): CreatorConfigUpdateEventDetail | undefined => {
  try {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(detail);
    // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment
    const {
      UpdateType: updateType,
      ResourceId: universeIdStr,
      ResourceType: resourceType,
    } = parsed;
    if (resourceType !== 'Experience') {
      return undefined;
    }
    // oxlint-disable-next-line typescript-eslint/no-unsafe-return, typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-argument
    return { ...parsed, updateType, universeId: parseInt(universeIdStr, 10), resourceType };
  } catch {
    return undefined;
  }
};

const CreatorConfigsRealtimeClientProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  useClientConfigsSubscriptionEffect();

  const [configSubscriptions] = useState<Map<number, Set<() => void>>>(new Map());
  const [draftSubscriptions] = useState<Map<number, Set<() => void>>>(new Map());

  const subscribeToConfigUpdates = useCallback(
    (universeId: number, callback: () => void) => {
      const unsubscribe = addSubscriptionToSetMap(configSubscriptions, universeId, callback);
      return { unsubscribe };
    },
    [configSubscriptions],
  );
  const subscribeToDraftUpdates = useCallback(
    (universeId: number, callback: () => void) => {
      const unsubscribe = addSubscriptionToSetMap(draftSubscriptions, universeId, callback);
      return { unsubscribe };
    },
    [draftSubscriptions],
  );

  const callback = useCallback(
    (eventNamespace: string, detail: string) => {
      if (eventNamespace !== subscriptionType) {
        return;
      }
      const event = parseEventDetail(detail);
      if (!event) {
        return;
      }
      const { updateType, universeId } = event;
      if (updateType === CreatorConfigUpdateType.Draft) {
        const subscriptions = draftSubscriptions.get(universeId);
        subscriptions?.forEach((cb) => cb());
      } else if (updateType === CreatorConfigUpdateType.Commit) {
        const subscriptions = configSubscriptions.get(universeId);
        subscriptions?.forEach((cb) => cb());
      } else {
        // oxlint-disable-next-line typescript-eslint/restrict-template-expressions
        logAnalyticsError(`Unknown creator config update type: ${updateType}`);
      }
    },
    [draftSubscriptions, configSubscriptions],
  );
  const subscriptionsBundle = useMemo(
    () => ({ subscribeToConfigUpdates, subscribeToDraftUpdates }),
    [subscribeToConfigUpdates, subscribeToDraftUpdates],
  );
  return (
    <creatorConfigsSubscriptionsContext.Provider value={subscriptionsBundle}>
      <SignalRProvider callback={callback}>{children}</SignalRProvider>
    </creatorConfigsSubscriptionsContext.Provider>
  );
};
export default CreatorConfigsRealtimeClientProvider;

export const useCreatorConfigsSubscriptions = (): {
  subscribeToConfigUpdates: (
    universeId: number,
    callback: () => void,
  ) => { unsubscribe: () => void };
  subscribeToDraftUpdates: (
    universeId: number,
    callback: () => void,
  ) => { unsubscribe: () => void };
} => {
  const context = React.useContext(creatorConfigsSubscriptionsContext);
  if (!context) {
    throw new Error(
      'useCreatorConfigsSubscriptions must be used within a CreatorConfigsRealtimeClientProvider',
    );
  }
  const { subscribeToConfigUpdates, subscribeToDraftUpdates } = context;
  return useMemo(
    () => ({ subscribeToConfigUpdates, subscribeToDraftUpdates }),
    [subscribeToConfigUpdates, subscribeToDraftUpdates],
  );
};
