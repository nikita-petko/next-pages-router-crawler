import NextLink from 'next/link';
import { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Link, Tab, Tabs, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAgreementFilters from '../agreements/hooks/useAgreementFilters';
import AmDivider from '../components/AmDivider';
import { EXPLORE_LICENSES_HREF, ROBLOX_CREATOR_DOCS_IP_GUIDELINES_HREF } from '../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../utils/logger';
import CreatorAgreementsTable from './components/CreatorAgreementsTable';

const CreatorAgreementsContainer = () => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();

  const { filtersWithCounts, effectiveSelectedFilter, setUserSelectedFilter } =
    useAgreementFilters(true);
  const onTabChange = useCallback(
    (event: unknown, newTabValue: string) => {
      logEvent(LicenseManagerClickEvent.CreatorAgreementsTableTabClickEvent, {
        selectedTab: newTabValue,
      });
      setUserSelectedFilter(
        newTabValue === effectiveSelectedFilter ? effectiveSelectedFilter : newTabValue,
      );
    },
    [setUserSelectedFilter, effectiveSelectedFilter, logEvent],
  );

  return (
    <Grid container direction='column' spacing={2}>
      <Grid item>
        <Typography variant='body1' component='p' color='secondary'>
          <span>{translate('Description.LicensesLandingPage')}</span>{' '}
          <Link component={NextLink} href={ROBLOX_CREATOR_DOCS_IP_GUIDELINES_HREF} target='_blank'>
            {translate('Action.LearnMore')}
          </Link>
        </Typography>
      </Grid>

      <Grid item>
        <Button
          component={NextLink}
          href={EXPLORE_LICENSES_HREF}
          variant='contained'
          color='secondary'
          onClick={() =>
            logEvent(LicenseManagerClickEvent.CreatorAgremementsTableExploreLicensesClickEvent)
          }>
          {translate('Button.ExploreLicenses')}
        </Button>
      </Grid>

      <Grid item>
        <Tabs
          onChange={onTabChange}
          orientation='horizontal'
          scrollButtons='auto'
          value={effectiveSelectedFilter}
          variant='scrollable'
          capitalize={false}>
          {filtersWithCounts.map((tab) => (
            <Tab
              key={tab.keyName}
              label={translate(tab.labelKey, { count: tab.count.toString() })}
              value={tab.keyName}
            />
          ))}
        </Tabs>

        <AmDivider />

        <CreatorAgreementsTable selectedTab={effectiveSelectedFilter} />
      </Grid>
    </Grid>
  );
};

export default withTranslation(CreatorAgreementsContainer, [
  TranslationNamespace.Controls,
  TranslationNamespace.Licenses,
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
