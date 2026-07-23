import { Fragment, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { makeStyles, Tab, Tabs, Typography } from '@rbx/ui';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IphAgreementsTable from '../agreements/components/IphAgreementsTable';
import IpListings from '../ipListings/components/IpListings';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';

const useStyles = makeStyles()({
  semanticGapLargerBottom: {
    marginBottom: 24,
  },
  headingMargin: {
    marginBottom: 16,
  },
  tabsMargin: {
    marginBottom: 16,
  },
});

const licenseAgreementsTab = {
  key: 'license-agreements',
  labelKey: 'Label.MyLicenseAgreements',
};

const myLicensesTab = {
  key: 'licenses',
  labelKey: 'Label.MyLicenses',
};

const tabs = [licenseAgreementsTab, myLicensesTab];
const defaultTab = licenseAgreementsTab;

/**
 * Tabbed view showing
 * - My License Agreements
 * - My Licenses (aka IP Listings)
 */
const LicensesContainer = () => {
  const [queryParams, setQueryParams] = useQueryParams(['tab']);
  const { classes } = useStyles();
  const { logEvent } = useLicenseManagerLogger();

  const activeTab = tabs.find((tab) => tab.key === queryParams.tab) ?? defaultTab;
  const onTabChange = useCallback(
    (event: unknown, newTabValue: string) => {
      logEvent(LicenseManagerClickEvent.IphAgreementsTableSelectFilterClickEvent, {
        selectedTab: newTabValue,
      });
      const newTab = newTabValue === defaultTab.key ? undefined : newTabValue;
      setQueryParams({ tab: newTab });
    },
    [setQueryParams, logEvent],
  );
  const { translate } = useTranslation();

  let content;
  if (activeTab === licenseAgreementsTab) {
    content = <IphAgreementsTable />;
  } else if (activeTab === myLicensesTab) {
    content = <IpListings />;
  }
  return (
    <>
      <Typography
        variant='body1'
        component='p'
        color='secondary'
        className={classes.semanticGapLargerBottom}>
        {translate('Description.IphLicensesLanding')}
      </Typography>

      <Tabs
        onChange={onTabChange}
        orientation='horizontal'
        scrollButtons='auto'
        value={activeTab.key}
        variant='scrollable'
        className={classes.tabsMargin}
        capitalize={false}>
        {tabs.map((tab) => (
          <Tab key={tab.key} label={translate(tab.labelKey)} value={tab.key} />
        ))}
      </Tabs>
      {content}
    </>
  );
};

export default withTranslation(LicensesContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
