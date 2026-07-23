import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations/common';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import ManagedPricingPageTitle from '@modules/managed-pricing/pages/ManagedPricingPageTitle';
import ManagedPricingPageContent from '@modules/managed-pricing/pages/ManagedPricingPageContent';

const ManagedPricingPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <ManagedPricingPageContent universeId={universeId} />;
};

ManagedPricingPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ManagedPricingPageTitle /> });

export default ManagedPricingPage;
