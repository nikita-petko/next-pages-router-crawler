import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import PricingCalculator from '@modules/creations/itemConfiguration/components/PricingCalculator';
import getPricingConfigurationPageLayout from '@modules/creations/itemConfiguration/layout/getPricingConfigurationPageLayout';

const Pricing: NextLayoutPage = () => (
  <Authenticated>
    <PricingCalculator />
  </Authenticated>
);

Pricing.getPageLayout = getPricingConfigurationPageLayout;
Pricing.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default Pricing;
