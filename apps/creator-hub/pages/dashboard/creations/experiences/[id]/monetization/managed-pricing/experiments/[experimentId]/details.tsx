import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations/common';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useExperimentId } from '@modules/monetization-shared/route/useExperimentId';
import ExperimentDetailsPageTitle from '@modules/managed-pricing/pages/ExperimentDetailsPageTitle';
import ExperimentDetailsPageContent from '@modules/managed-pricing/pages/ExperimentDetailsPageContent';

const ManagedPricingExperimentDetailsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { experimentId } = useExperimentId();
  if (!universeId || !experimentId) return null;

  return <ExperimentDetailsPageContent universeId={universeId} experimentId={experimentId} />;
};

ManagedPricingExperimentDetailsPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <ExperimentDetailsPageTitle /> });

export default ManagedPricingExperimentDetailsPage;
