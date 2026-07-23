import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreationsPageLayout } from '@modules/creations';
import { UrlRedirectProvider } from '@modules/experience-analytics-shared';

const RemovedDevStatsForwardingPlaceholder: NextLayoutPage = () => {
  return (
    <Authenticated>
      <UrlRedirectProvider />
    </Authenticated>
  );
};

RemovedDevStatsForwardingPlaceholder.getPageLayout = getCreationsPageLayout;

export default RemovedDevStatsForwardingPlaceholder;
