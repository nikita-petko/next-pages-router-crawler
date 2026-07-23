import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import getPassConfigurationLayout from '@modules/creations/pass/layout/getPassConfigurationLayout';
import ConfigurePassContainer, {
  EConfigurePassPageType,
} from '@modules/creations/pass/pages/ConfigurePassContainer';
import { usePassId } from '@modules/monetization-shared/route/usePassId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ConfigurePassSalesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { passId } = usePassId();
  if (!universeId || !passId) {
    return null;
  }

  return (
    <ConfigurePassContainer
      universeId={universeId}
      passId={passId}
      pageType={EConfigurePassPageType.Sales}
    />
  );
};

ConfigurePassSalesPage.getPageLayout = (page) =>
  getPassConfigurationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Sales' />,
  });
ConfigurePassSalesPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };
export default ConfigurePassSalesPage;
