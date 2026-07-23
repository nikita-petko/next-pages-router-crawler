import type { NextGetPageLayout, NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import TaxDocumentationFlagGate from '@modules/devex/global/taxes/components/TaxDocumentationFlagGate';
import TaxesPage from '@modules/devex/global/taxes/components/TaxesPageContainer';
import TaxesPageTitle from '@modules/devex/global/taxes/components/TaxesPageTitle';
import getFinanceLayout from '@modules/finance/getFinanceLayout';

const Taxes: NextLayoutPage = () => (
  <Authenticated>
    <TaxDocumentationFlagGate>
      <TaxesPage />
    </TaxDocumentationFlagGate>
  </Authenticated>
);

const getPageLayout: NextGetPageLayout = (page) =>
  getFinanceLayout(page, { title: <TaxesPageTitle /> });

Taxes.getPageLayout = getPageLayout;
Taxes.loggerConfig = { rosId: RosTeams.CreatorBusiness, tags: ['tax-hub'] };

export default Taxes;
