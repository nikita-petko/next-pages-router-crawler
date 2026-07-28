import type { NextLayoutPage } from 'next';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import HardCodedPricesPageContent from '@modules/hard-coded-prices/pages/HardCodedPricesPageContent';
import HardCodedPricesPageTitle from '@modules/hard-coded-prices/pages/HardCodedPricesPageTitle';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const HardCodedPricesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <HardCodedPricesPageContent universeId={universeId} />;
};

HardCodedPricesPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <HardCodedPricesPageTitle /> });
HardCodedPricesPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default HardCodedPricesPage;
