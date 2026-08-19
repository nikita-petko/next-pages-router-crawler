import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import ConfigurePassPromotionsContainer from '@modules/bonus-promotions/pages/ConfigurePassPromotionsContainer';
import getPassConfigurationLayout from '@modules/creations/pass/layout/getPassConfigurationLayout';
import { usePassId } from '@modules/monetization-shared/route/usePassId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ConfigurePassPromotionsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { passId } = usePassId();
  if (!universeId || !passId) {
    return null;
  }

  return <ConfigurePassPromotionsContainer universeId={universeId} passId={passId} />;
};

ConfigurePassPromotionsPage.getPageLayout = (page) =>
  getPassConfigurationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Promotions' />
    ),
  });
ConfigurePassPromotionsPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default ConfigurePassPromotionsPage;
