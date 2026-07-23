import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import DynamicPriceCheckPageContent from '@modules/dynamic-price-check/pages/DynamicPriceCheckPageContent';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const PriceValidationPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <DynamicPriceCheckPageContent universeId={universeId} />;
};

PriceValidationPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.DynamicPriceCheck'
      />
    ),
  });
PriceValidationPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default PriceValidationPage;
