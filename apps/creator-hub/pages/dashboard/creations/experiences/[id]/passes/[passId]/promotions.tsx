import type { NextLayoutPage } from 'next';
import { getPassConfigurationLayout } from '@modules/creations/pass';
import ConfigurePassPromotionsContainer from '@modules/bonus-promotions/pages/ConfigurePassPromotionsContainer';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { usePassId } from '@modules/monetization-shared/route/usePassId';

const ConfigurePassPromotionsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { passId } = usePassId();
  if (!universeId || !passId) return null;

  return <ConfigurePassPromotionsContainer universeId={universeId} passId={passId} />;
};

ConfigurePassPromotionsPage.getPageLayout = (page) =>
  getPassConfigurationLayout(page, { title: 'Heading.Promotions' });

export default ConfigurePassPromotionsPage;
