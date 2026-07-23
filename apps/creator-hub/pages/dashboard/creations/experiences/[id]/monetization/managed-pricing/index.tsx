import type { NextLayoutPage } from 'next';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import ManagedPricingPageContent from '@modules/managed-pricing/pages/ManagedPricingPageContent';
import ManagedPricingPageTitle from '@modules/managed-pricing/pages/ManagedPricingPageTitle';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ManagedPricingPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <ManagedPricingPageContent universeId={universeId} />;
};

ManagedPricingPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ManagedPricingPageTitle /> });
ManagedPricingPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default ManagedPricingPage;
