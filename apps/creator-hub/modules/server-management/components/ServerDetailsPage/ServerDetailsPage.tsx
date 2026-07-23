import React, { FunctionComponent, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Divider, Tabs, TabsContent, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import ServerPlayersList from './ServerPlayersList';

enum ServerDetailsTabs {
  Players = 'Players',
}

const defaultTab = ServerDetailsTabs.Players;

const ServerDetailsPage: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();

  const { placeId: queryPlaceId, jobId: queryJobId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const rawJobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : undefined;
  const jobId = rawJobId != null && rawJobId !== '' ? rawJobId : undefined;

  const tabContents = useMemo(
    () => ({
      [ServerDetailsTabs.Players]: <ServerPlayersList placeId={placeId} jobId={jobId} />,
    }),
    [placeId, jobId],
  );

  return Object.values(tabContents).length === 1 ? (
    Object.values(tabContents)[0]
  ) : (
    <Tabs defaultValue={defaultTab} fitBehavior='Fit' size='Medium' variant='Inlined'>
      <TabsList>
        {Object.values(ServerDetailsTabs).map((type) => (
          <TabsTrigger key={type} value={type} className='padding-medium'>
            {translate(`ServerDetailsPage.Label.${type}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <Divider className='margin-bottom-small' />
      {Object.values(ServerDetailsTabs).map((type) => (
        <TabsContent key={type} value={type}>
          {tabContents[type]}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ServerDetailsPage;
