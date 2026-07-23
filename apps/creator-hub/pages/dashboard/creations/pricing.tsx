import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { getPricingConfigurationPageLayout, PricingCalculator } from '@modules/creations';

const Pricing: NextLayoutPage = () => (
  <Authenticated>
    <PricingCalculator />
  </Authenticated>
);

Pricing.getPageLayout = getPricingConfigurationPageLayout;

export default Pricing;
