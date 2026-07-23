import { Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@rbx/ui';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import Link from 'next/link';
import { useSettings } from '@modules/settings';

import { useGetIphAgreementsByStatus } from '../hooks/useGetIphAgreementsByStatus';
import { useIpListingsQuery } from '../../ipListings/hooks/ipListings';
import useAgreementFilters from '../hooks/useAgreementFilters';
import IphAgreementRow from './IphAgreementRow';
import AgreementTableFilters, { getAgreementEnumsForFilter } from './AgreementTableFilters';
import { IP_LISTINGS_HREF, IP_MATCHES_HREF } from '../../urls';
import { EmptyStateKeys } from '../../creatorAgreements/CreatorAgreementsContainer';
import { AgreementFilterKeys } from '../utils/constants';
import IpLoadError from '../../../components/error/IpLoadError';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';

const filterToEmptyTableKeys: { [key in AgreementFilterKeys]: EmptyStateKeys } = {
  [AgreementFilterKeys.Requests]: {
    headingKey: 'Heading.NoRequestsYet',
    descriptionKey: 'Description.NoRequestsYetIph',
    button: undefined,
  },
  [AgreementFilterKeys.Offers]: {
    headingKey: 'Heading.NoOffersYet',
    descriptionKey: 'Description.NoOffersYetIph',
    button: {
      href: IP_MATCHES_HREF,
      key: 'Button.ViewMatches',
    },
  },
  [AgreementFilterKeys.Active]: {
    headingKey: 'Heading.NoActiveAgreementsYetIph',
    descriptionKey: 'Description.NoActiveAgreementsYetIph',
    button: undefined,
  },
  [AgreementFilterKeys.Inactive]: {
    headingKey: 'Heading.NoInactiveAgreementsYetIph',
    descriptionKey: 'Description.NoInactiveAgreementsYetIph',
    button: undefined,
  },
};

const filterToEmptyTableImpressionEvent: {
  [key in AgreementFilterKeys]: LicenseManagerImpressionEvent;
} = {
  [AgreementFilterKeys.Offers]:
    LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableNoOffersImpressionEvent,
  [AgreementFilterKeys.Requests]:
    LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableNoRequestsImpressionEvent,
  [AgreementFilterKeys.Active]:
    LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableNoActiveImpressionEvent,
  [AgreementFilterKeys.Inactive]:
    LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableNoInactiveImpressionEvent,
};

const useStyles = makeStyles()({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyState: {
    paddingTop: 24,
  },
  tableHeaders: {
    whiteSpace: 'nowrap',
  },
});

/**
 * This component displays a table of agreements for the IPH to manage.
 */

const IphAgreementsTable = () => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { filtersWithCounts, effectiveSelectedFilter, setUserSelectedFilter, countsQuery } =
    useAgreementFilters();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const ipListingsReq = useIpListingsQuery();
  const iphAgreementsRequest = useGetIphAgreementsByStatus({
    agreementStatus: effectiveSelectedFilter
      ? getAgreementEnumsForFilter(effectiveSelectedFilter)
      : undefined,
  });

  const setFilter = (filter: string | undefined) => {
    logEvent(LicenseManagerClickEvent.IphAgreementsTableSelectFilterClickEvent, {
      selectedFilter: filter ?? '',
    });
    setUserSelectedFilter(filter);
  };

  const isDataReady =
    !ipListingsReq.isPending &&
    !iphAgreementsRequest.isPending &&
    !ipListingsReq.error &&
    !iphAgreementsRequest.error;

  const ipListings = ipListingsReq.data?.listings || [];
  const agreements = iphAgreementsRequest.data?.agreements || [];
  const emptyTableKeys = filterToEmptyTableKeys[effectiveSelectedFilter as AgreementFilterKeys];

  // Check if only the agreements table is loading (filters can stay visible)
  const isTableContentLoading = iphAgreementsRequest.isPending;

  if (isDataReady) {
    if (ipListings.length === 0) {
      logOnce(
        LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableCreateLicenseImpressionEvent,
      );
    } else if (agreements.length === 0) {
      const impressionEvent =
        filterToEmptyTableImpressionEvent[effectiveSelectedFilter as AgreementFilterKeys];
      logOnce(impressionEvent);
    }
  }

  // Show full loading state only when initial data (listings, counts) is loading
  if (!isFetched || ipListingsReq.isPending || countsQuery.isPending) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  if (ipListingsReq.isError || iphAgreementsRequest.isError) {
    return <IpLoadError error={ipListingsReq.error || iphAgreementsRequest.error} />;
  }

  if (ipListings.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          size='small'
          title={translate('Heading.NoLicenseAgreementsMadeYet')}
          description={translate('Description.NoLicenseAgreementsMadeYet')}>
          <Button component={Link} href={IP_LISTINGS_HREF} variant='contained' color='primaryBrand'>
            {translate('Button.CreateLicense')}
          </Button>
        </EmptyState>
      </EmptyStateBorder>
    );
  }

  // Render table content based on loading/data state
  const renderTableContent = () => {
    if (isTableContentLoading) {
      return (
        <div className={classes.loading}>
          <CircularProgress />
        </div>
      );
    }

    if (agreements.length === 0) {
      return (
        <div className={classes.emptyState}>
          <EmptyStateBorder>
            <EmptyState
              size='small'
              title={translate(emptyTableKeys.headingKey)}
              description={translate(emptyTableKeys.descriptionKey)}>
              {emptyTableKeys.button && (
                <Button
                  component={Link}
                  href={emptyTableKeys.button.href}
                  variant='contained'
                  color='primaryBrand'>
                  {translate(emptyTableKeys.button.key)}
                </Button>
              )}
            </EmptyState>
          </EmptyStateBorder>
        </div>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow className={classes.tableHeaders}>
              <TableCell width='22%'>{translate('Label.Creation')}</TableCell>
              <TableCell width='22%'>{translate('Label.License')}</TableCell>
              <TableCell width='12%'>{translate('Label.IpFamily')}</TableCell>
              {enableIpPlatformTimeboundLicenses && (
                <TableCell width='14%'>{translate('Label.Duration')}</TableCell>
              )}
              <TableCell width='10%'>{translate('Label.RevenueShare')}</TableCell>
              <TableCell width='10%'>{translate('Label.RevenueShareTiming')}</TableCell>
              <TableCell width='10%'>{translate('Label.LifetimeVisitsRange')}</TableCell>
              <TableCell width='14%'>{translate('Label.Status')}</TableCell>
              <TableCell width='10%'>{translate('Label.LastUpdated')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agreements.map((agreement) => (
              <IphAgreementRow key={agreement.id} agreement={agreement} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Fragment>
      <AgreementTableFilters
        selectedFilter={effectiveSelectedFilter}
        onFilterChange={setFilter}
        filtersWithCounts={filtersWithCounts}
      />
      {renderTableContent()}
    </Fragment>
  );
};

export default IphAgreementsTable;
