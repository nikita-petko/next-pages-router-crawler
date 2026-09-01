import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import getDeveloperProductLayout from '@modules/creations/developerProduct/layouts/getDeveloperProductLayout';
import ConfigureDeveloperProductContainer from '@modules/creations/developerProduct/pages/ConfigureDeveloperProductContainer';
import { useProductId } from '@modules/monetization-shared/route/useProductId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ConfigureDeveloperProductPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { productId } = useProductId();
  if (!universeId || !productId) {
    return null;
  }

  return <ConfigureDeveloperProductContainer universeId={universeId} productId={productId} />;
};

ConfigureDeveloperProductPage.getPageLayout = (page) =>
  getDeveloperProductLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Settings' />,
  });
ConfigureDeveloperProductPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };
export default ConfigureDeveloperProductPage;
