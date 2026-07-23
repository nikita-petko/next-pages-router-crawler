import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PriceOptimizationPageContent from '@modules/price-optimization/pages/PriceOptimization/PriceOptimizationPageContent';

const PriceOptimizationPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <PriceOptimizationPageContent universeId={universeId} />;
};

PriceOptimizationPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.PriceOptimization'
      />
    ),
  });
PriceOptimizationPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default PriceOptimizationPage;
