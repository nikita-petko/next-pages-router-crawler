import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import AccountInformationContainer from '@modules/creator-account/pages/AccountInformationContainer';
import { AccountInformationTab } from '@modules/creator-account/types';
import getFinanceLayout from '@modules/finance/getFinanceLayout';

const AccountInformation: NextLayoutPage = () => {
  const accountInformationTabs = [
    {
      key: AccountInformationTab.CoreAccountInfo,
      translationKey: 'Heading.CoreAccountInfo',
    },
    /* TODO: Add billing tab here: https://roblox.atlassian.net/browse/BRANDPLAT-425
    // {
    //   key: AccountInformationTab.BillingAddress,
    //   translationKey: 'Heading.BillingAddress',
    // }, 
    */
    {
      key: AccountInformationTab.LegalAddress,
      translationKey: 'Heading.LegalAddress',
    },
    {
      key: AccountInformationTab.Invoicing,
      translationKey: 'Heading.Invoicing',
    },
  ];

  return (
    <Authenticated>
      <AccountInformationContainer tabs={accountInformationTabs} />
    </Authenticated>
  );
};

AccountInformation.getPageLayout = (page) =>
  getFinanceLayout(page, {
    title: (
      <Translate
        namespace='CreatorDashboard.Navigation'
        translationKey='Heading.AccountInformation'
      />
    ),
  });
AccountInformation.loggerConfig = { rosId: RosTeams.AccountInformation };

export default AccountInformation;
