import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Divider, Grid, Tab, Tabs } from '@rbx/ui';
import CloudPricingClientProvider from '@modules/cloud-services/pricing/CloudPricingClientProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AccountInformationTabType } from '../types';
import { AccountInformationTab } from '../types';
import CoreAccountInfoContent from './tabs/CoreAccountInfoContent';
import InvoicingContent from './tabs/InvoicingContent';
import LegalAddressContent from './tabs/LegalAddressContent';

interface AccountInformationContainerProps {
  tabs: AccountInformationTabType[];
}

const AccountInformationContainer = ({ tabs }: AccountInformationContainerProps) => {
  const { translate } = useTranslation();

  const router = useRouter();
  const {
    query: { tab: urlQueryTab },
  } = router;

  const initialTab =
    typeof urlQueryTab === 'string'
      ? AccountInformationTab[urlQueryTab as keyof typeof AccountInformationTab]
      : null;
  const [activeTab, setActiveTab] = useState<AccountInformationTab>(
    initialTab ?? AccountInformationTab.CoreAccountInfo,
  );

  const onChangeTab = useCallback(
    (_event: React.SyntheticEvent, newTab: AccountInformationTab) => {
      setActiveTab(newTab);
    },
    [setActiveTab],
  );

  const getTabContentContainer = useCallback((tab: AccountInformationTab) => {
    switch (tab) {
      case AccountInformationTab.CoreAccountInfo:
        return (
          <CloudPricingClientProvider>
            <CoreAccountInfoContent />
          </CloudPricingClientProvider>
        );
      case AccountInformationTab.BillingAddress:
        return null;
      case AccountInformationTab.LegalAddress:
        return <LegalAddressContent />;
      case AccountInformationTab.Invoicing:
        return <InvoicingContent />;
      default: {
        throw new Error(`Unhandled tab type ${tab}`);
      }
    }
  }, []);

  const renderTabs = useMemo(() => {
    return (
      <Tabs onChange={onChangeTab} orientation='horizontal' value={activeTab} variant='scrollable'>
        {tabs.map((tab) => {
          return (
            <Tab
              label={
                <Grid container gap={1}>
                  <Grid item>{translate(tab.translationKey)}</Grid>
                </Grid>
              }
              key={tab.key}
              value={tab.key}
            />
          );
        })}
      </Tabs>
    );
  }, [activeTab, onChangeTab, tabs, translate]);

  return (
    <Grid container direction='column' gap={3}>
      <HubMeta
        title={buildTitle(translate('Heading.AccountInformation'))}
        breadcrumb={buildBreadcrumb(
          translate('Heading.Finances'),
          translate('Heading.AccountInformation'),
        )}
      />
      {tabs.length > 1 && (
        <Grid item width='100%'>
          {renderTabs}
          <Divider />
        </Grid>
      )}

      <Grid item width='100%' style={{ paddingTop: 0 }}>
        {getTabContentContainer(activeTab)}
      </Grid>
    </Grid>
  );
};

export default withTranslation(AccountInformationContainer, [
  TranslationNamespace.CreatorAccount,
  TranslationNamespace.Navigation,
]);
