import type { NextLayoutPage } from 'next';
import {
  ConfigurePassContainer,
  EConfigurePassPageType,
  getPassConfigurationLayout,
} from '@modules/creations/pass';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { usePassId } from '@modules/monetization-shared/route/usePassId';

const ConfigurePassSalesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { passId } = usePassId();
  if (!universeId || !passId) return null;

  return (
    <ConfigurePassContainer
      universeId={universeId}
      passId={passId}
      pageType={EConfigurePassPageType.Sales}
    />
  );
};

ConfigurePassSalesPage.getPageLayout = (page) =>
  getPassConfigurationLayout(page, { title: 'Heading.Sales' });

export default ConfigurePassSalesPage;
