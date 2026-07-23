import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
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

const defaultTab = ServerDetailsTabs.Players;

const isServerDetailsTab = (value: string): value is ServerDetailsTabs =>
  Object.values<string>(ServerDetailsTabs).includes(value);

const ServerDetailsPage: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const showLogsTab = useServerManagementDevGate();
  const [activeTab, setActiveTab] = useState<ServerDetailsTabs>(defaultTab);

  const { placeId: queryPlaceId, jobId: queryJobId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const rawJobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : undefined;
  const jobId = rawJobId != null && rawJobId !== '' ? rawJobId : undefined;

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
      onValueChange={(value) => {
        if (isServerDetailsTab(value)) {
          setActiveTab(value);
        }
      }}
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
