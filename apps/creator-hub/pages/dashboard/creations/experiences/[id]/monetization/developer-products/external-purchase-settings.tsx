import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
import ExternalPurchaseSettingsContainer from '@modules/experience-store/pages/ExternalPurchaseSettingsContainer';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const ExternalPurchaseSettingsPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <ExternalPurchaseSettingsContainer universeId={universeId} />;
};

ExternalPurchaseSettingsPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.ExternalPurchaseSettings' });

export default ExternalPurchaseSettingsPage;
