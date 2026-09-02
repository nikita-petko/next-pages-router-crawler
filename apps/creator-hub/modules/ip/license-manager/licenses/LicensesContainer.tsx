import { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, makeStyles, Tab, Tabs, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import IphAgreementsTable from '../agreements/components/IphAgreementsTable';
import IpListings from '../ipListings/components/IpListings';
import { IP_EARNINGS_ANALYTICS_HREF } from '../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';

const useStyles = makeStyles()((theme) => ({
  semanticGapLargerBottom: {
    marginBottom: 24,
  },
  headingMargin: {
    marginBottom: 16,
  },
  tabsMargin: {
    marginBottom: 16,
  },
  descriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    marginLeft: theme.spacing(2),
  },
  viewEarningsButton: {
    whiteSpace: 'nowrap',
  },
}));

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
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const handleViewEarningsClick = useCallback(() => {
    window.location.assign(IP_EARNINGS_ANALYTICS_HREF);
  }, []);

  let content;
  if (activeTab === licenseAgreementsTab) {
    content = <IphAgreementsTable />;
  } else if (activeTab === myLicensesTab) {
    content = <IpListings />;
  }
  return (
    <>
      <div className={classes.descriptionContainer}>
        <Typography variant='body1' component='div' color='secondary' gutterBottom>
          {translate('Description.IphLicensesLanding')}
        </Typography>
        <div className={classes.button}>
          <div>
            <Button
              size='medium'
              variant='contained'
              color='secondary'
              className={classes.viewEarningsButton}
              onClick={handleViewEarningsClick}>
              {tPendingTranslation(
                'View earnings',
                'Action linking from License Manager to IP earnings analytics.',
                translationKey('Action.ViewEarnings', TranslationNamespace.AgreementsManager),
              )}
            </Button>
          </div>
        </div>
      </div>
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
