import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import FiatPaidAccessPageContent from '@modules/fiat-paid-access/pages/FiatPaidAccess/FiatPaidAccessPageContent';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.PaidAccessFiat' });

const PaidAccessPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <FiatPaidAccessPageContent />
    </Authenticated>
  );
};

PaidAccessPage.getPageLayout = getPageLayout;

export default PaidAccessPage;
