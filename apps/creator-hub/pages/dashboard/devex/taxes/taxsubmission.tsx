import type { NextGetPageLayout, NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import TaxbitTaxSubmissionPage, {
  TaxbitTaxSubmissionPageTitle,
} from '@modules/devex/global/taxbit/components/TaxbitTaxSubmissionPage';
import TaxDocumentationFlagGate from '@modules/devex/global/taxes/components/TaxDocumentationFlagGate';
import getFinanceLayout from '@modules/finance/getFinanceLayout';

const TaxSubmission: NextLayoutPage = () => (
  <Authenticated>
    <TaxDocumentationFlagGate>
      <TaxbitTaxSubmissionPage />
    </TaxDocumentationFlagGate>
  </Authenticated>
);

const getPageLayout: NextGetPageLayout = (page) =>
  getFinanceLayout(page, { title: <TaxbitTaxSubmissionPageTitle /> });

TaxSubmission.getPageLayout = getPageLayout;
TaxSubmission.loggerConfig = { rosId: RosTeams.CreatorBusiness, tags: ['tax-hub'] };

export default TaxSubmission;
