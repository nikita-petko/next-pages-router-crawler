import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations/common';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import HardCodedPricesPageTitle from '@modules/managed-pricing/pages/HardCodedPricesPageTitle';
import HardCodedPricesPageContent from '@modules/managed-pricing/pages/HardCodedPricesPageContent';

const HardCodedPricesPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <HardCodedPricesPageContent universeId={universeId} />;
};

HardCodedPricesPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: <HardCodedPricesPageTitle /> });

export default HardCodedPricesPage;
