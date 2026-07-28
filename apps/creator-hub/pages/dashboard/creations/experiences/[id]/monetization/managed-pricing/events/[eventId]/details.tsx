import type { NextLayoutPage } from 'next';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ManagedPricingEventDetailsPageContent from '@modules/managed-pricing/pages/ManagedPricingEventDetailsPageContent';
import ManagedPricingEventDetailsPageTitle from '@modules/managed-pricing/pages/ManagedPricingEventDetailsPageTitle';
import { useEventId } from '@modules/monetization-shared/route/useEventId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ManagedPricingEventDetailsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { eventId } = useEventId();
  if (!universeId || !eventId) {
    return null;
  }

  return <ManagedPricingEventDetailsPageContent universeId={universeId} eventId={eventId} />;
};

ManagedPricingEventDetailsPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ManagedPricingEventDetailsPageTitle /> });
ManagedPricingEventDetailsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default ManagedPricingEventDetailsPage;
