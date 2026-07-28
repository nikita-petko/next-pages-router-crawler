import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Divider, Tabs, TabsContent, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useServerManagementDevGate from '../../hooks/useServerManagementDevGate';
import ServerLogsList from './ServerLogsList/ServerLogsList';
import ServerPlayersList from './ServerPlayersList';

enum ServerDetailsTabs {
  Logs = 'Logs',
  Players = 'Players',
}

const isServerDetailsTab = (value: string): value is ServerDetailsTabs =>
  Object.values<string>(ServerDetailsTabs).includes(value);

const queryValueAsString = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const resolveActiveTab = (
  tabParam: string | undefined,
  showLogsTab: boolean,
): ServerDetailsTabs => {
  if (tabParam === ServerDetailsTabs.Players) {
    return ServerDetailsTabs.Players;
  }
  if (tabParam === ServerDetailsTabs.Logs && showLogsTab) {
    return ServerDetailsTabs.Logs;
  }
  return showLogsTab ? ServerDetailsTabs.Logs : ServerDetailsTabs.Players;
};

const ServerDetailsPage: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const showLogsTab = useServerManagementDevGate();

  const { placeId: queryPlaceId, jobId: queryJobId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const rawJobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : undefined;
  const jobId = rawJobId != null && rawJobId !== '' ? rawJobId : undefined;

  const activeTab = resolveActiveTab(queryValueAsString(router.query.tab), showLogsTab);

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isServerDetailsTab(value) || value === activeTab) {
        return;
      }
      void router.replace(
        { pathname: router.pathname, query: { ...router.query, tab: value } },
        undefined,
        { shallow: true },
      );
    },
    [activeTab, router],
  );

  const tabContents = useMemo(
    () => ({
      ...(showLogsTab && {
        [ServerDetailsTabs.Logs]: <ServerLogsList placeId={placeId} jobId={jobId} />,
      }),
      [ServerDetailsTabs.Players]: <ServerPlayersList placeId={placeId} jobId={jobId} />,
    }),
    [showLogsTab, placeId, jobId],
  );

  return Object.values(tabContents).length === 1 ? (
    Object.values(tabContents)[0]
  ) : (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      fitBehavior='Fit'
      size='Medium'
      variant='Inlined'>
      <TabsList>
        {Object.values(ServerDetailsTabs).map((type) => (
          <TabsTrigger key={type} value={type} className='padding-medium'>
            {translate(`ServerDetailsPage.Label.${type}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <Divider className='margin-bottom-small' />
      {Object.values(ServerDetailsTabs).map((type) => {
        // keep Players mounted so deep links still seed status/type for the header
        const keepMounted = type === ServerDetailsTabs.Players;
        return (
          <TabsContent
            key={type}
            value={type}
            forceMount={keepMounted ? true : undefined}
            hidden={keepMounted ? activeTab !== type : undefined}>
            {tabContents[type]}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default ServerDetailsPage;
