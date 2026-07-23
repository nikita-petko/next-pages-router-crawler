import type { NextLayoutPage } from 'next';
import {
  ConfigurePassContainer,
  EConfigurePassPageType,
  getPassConfigurationLayout,
} from '@modules/creations/pass';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { usePassId } from '@modules/monetization-shared/route/usePassId';

const ConfigurePassPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { passId } = usePassId();
  if (!universeId || !passId) return null;

  return (
    <ConfigurePassContainer
      universeId={universeId}
      passId={passId}
      pageType={EConfigurePassPageType.GeneralInfo}
    />
  );
};

ConfigurePassPage.getPageLayout = (page) =>
  getPassConfigurationLayout(page, { title: 'Heading.Settings' });

export default ConfigurePassPage;
