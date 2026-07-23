import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';

const RemovedDevStatsForwardingPlaceholder: NextLayoutPage = () => {
  return (
    <Authenticated>
      <UrlRedirectProvider />
    </Authenticated>
  );
};

RemovedDevStatsForwardingPlaceholder.getPageLayout = getCreationsPageLayout;
RemovedDevStatsForwardingPlaceholder.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default RemovedDevStatsForwardingPlaceholder;
