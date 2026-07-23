import type { NextLayoutPage } from 'next';
import { getCreationsPageLayout } from '@modules/creations';
import PriceOptimizationPageContent from '@modules/price-optimization/pages/PriceOptimization/PriceOptimizationPageContent';

const PriceOptimizationPage: NextLayoutPage = () => {
  return <PriceOptimizationPageContent />;
};

PriceOptimizationPage.getPageLayout = (page) =>
  getCreationsPageLayout(page, { title: 'Heading.PriceOptimization' });

export default PriceOptimizationPage;
