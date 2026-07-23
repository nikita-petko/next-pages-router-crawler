import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
import DynamicPriceCheckPageContent from '@modules/dynamic-price-check/pages/DynamicPriceCheckPageContent';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const PriceValidationPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <DynamicPriceCheckPageContent universeId={universeId} />;
};

PriceValidationPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.DynamicPriceCheck' });

export default PriceValidationPage;
