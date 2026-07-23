import { useCallback } from 'react';
import { Button, Grid, Link, Tab, Tabs, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AgreementStatus } from '@rbx/clients/contentLicensingApi/v1';
import NextLink from 'next/link';

import AmDivider from '../components/AmDivider';
import { EXPLORE_LICENSES_HREF, ROBLOX_CREATOR_DOCS_IP_GUIDELINES_HREF } from '../urls';
import { AgreementFilterKeys } from '../agreements/utils/constants';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../utils/logger';
import CreatorAgreementsTable from './components/CreatorAgreementsTable';
import useAgreementFilters from '../agreements/hooks/useAgreementFilters';

export interface EmptyStateKeys {
  headingKey: string;
  descriptionKey: string;
  button:
    | {
        href: string;
        key: string;
      }
    | undefined;
}

export interface TabProperties {
  keyName: string;
  labelKey: string;
  breadcrumbKey: string;
  statusEnums: AgreementStatus[];
  emptyTableImpressionEvent: LicenseManagerImpressionEvent;
  translationKeys: EmptyStateKeys;
}

export const creatorAgreementTabsConfig: TabProperties[] = [
  {
    keyName: AgreementFilterKeys.Offers,
    labelKey: 'Label.OffersWithCount',
    breadcrumbKey: 'Label.Offers',
    statusEnums: [AgreementStatus.Pending, AgreementStatus.Disputed],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoOffersYet',
      descriptionKey: 'Description.NoOffersYetCreator',
      button: undefined,
    },
  },
  {
    keyName: AgreementFilterKeys.Requests,
    labelKey: 'Label.MyRequestsWithCount',
    breadcrumbKey: 'Label.MyRequests',
    statusEnums: [AgreementStatus.Inquired, AgreementStatus.Accepted],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoRequestsYet',
      descriptionKey: 'Description.NoRequestsYetCreator',
      button: {
        href: EXPLORE_LICENSES_HREF,
        key: 'Button.ExploreLicenses',
      },
    },
  },
  {
    keyName: AgreementFilterKeys.Active,
    labelKey: 'Label.ActiveWithCount',
    breadcrumbKey: 'Label.Active',
    statusEnums: [AgreementStatus.Active],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoActiveAgreementsYetCreator',
      descriptionKey: 'Description.NoActiveAgreementsYetCreator',
      button: undefined,
    },
  },
  {
    keyName: AgreementFilterKeys.Inactive,
    labelKey: 'Label.InactiveWithCount',
    breadcrumbKey: 'Label.Inactive',
    statusEnums: [
      AgreementStatus.Archived,
      AgreementStatus.Terminated,
      AgreementStatus.Unsuccessful,
      AgreementStatus.Cancelled,
      AgreementStatus.Expired,
    ],
    emptyTableImpressionEvent:
      LicenseManagerImpressionEvent.EmptyStateCreatorAgreementsTableNoOffersImpressionEvent,
    translationKeys: {
      headingKey: 'Heading.NoInactiveAgreementsYetCreator',
      descriptionKey: 'Description.NoInactiveAgreementsYetCreator',
      button: undefined,
    },
  },
];

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
