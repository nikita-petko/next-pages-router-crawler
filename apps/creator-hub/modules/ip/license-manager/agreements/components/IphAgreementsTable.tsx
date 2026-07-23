import Link from 'next/link';
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
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import IpLoadError from '../../../components/error/IpLoadError';
import type { EmptyStateKeys } from '../../creatorAgreements/constants';
import { useIpListingsQuery } from '../../ipListings/hooks/ipListings';
import { IP_LISTINGS_HREF, IP_MATCHES_HREF } from '../../urls';
import { LICENSE_TYPE_TABLE_HEADER_KEY } from '../../utils/licenseTypeTableLabelKeys';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import useAgreementFilters from '../hooks/useAgreementFilters';
import { useGetIphAgreementsByStatus } from '../hooks/useGetIphAgreementsByStatus';
import { AgreementFilterKeys, isAgreementFilterKey } from '../utils/constants';
import AgreementTableFilters, { getAgreementEnumsForFilter } from './AgreementTableFilters';
import {
  IP_AGREEMENTS_TABLE_CREATION_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_DURATION_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_IP_FAMILY_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LICENSE_TYPE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LAST_UPDATED_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LICENSE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LIFETIME_VISITS_RANGE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_REVENUE_SHARE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_REVENUE_SHARE_TIMING_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_STATUS_COL_WIDTH_PX,
} from './IpAgreementsTable.style';
import IphAgreementRow from './IphAgreementRow';

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
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;

  const ipListingsReq = useIpListingsQuery();
  const iphAgreementsRequest = useGetIphAgreementsByStatus({
    agreementStatus: isAgreementFilterKey(effectiveSelectedFilter)
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

  const ipListings = ipListingsReq.data?.listings ?? [];
  const agreements = iphAgreementsRequest.data?.agreements ?? [];
  const resolvedFilter: AgreementFilterKeys = isAgreementFilterKey(effectiveSelectedFilter)
    ? effectiveSelectedFilter
    : AgreementFilterKeys.Offers;
  const emptyTableKeys = filterToEmptyTableKeys[resolvedFilter];

  // Check if only the agreements table is loading (filters can stay visible)
  const isTableContentLoading = iphAgreementsRequest.isPending || loadingFrontendFlags;

  if (isDataReady) {
    if (ipListings.length === 0) {
      logOnce(
        LicenseManagerImpressionEvent.EmptyStateIphAgreementsTableCreateLicenseImpressionEvent,
      );
    } else if (agreements.length === 0) {
      const impressionEvent = filterToEmptyTableImpressionEvent[resolvedFilter];
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
    return <IpLoadError error={ipListingsReq.error ?? iphAgreementsRequest.error} />;
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
              <TableCell width={`${IP_AGREEMENTS_TABLE_CREATION_COL_WIDTH_PX}px`}>
                {translate('Label.Creation')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_LICENSE_COL_WIDTH_PX}px`}>
                {translate('Label.License')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_IP_FAMILY_COL_WIDTH_PX}px`}>
                {translate('Label.IpFamily')}
              </TableCell>
              {enableCollaborationLicensing && (
                <TableCell width={`${IP_AGREEMENTS_TABLE_LICENSE_TYPE_COL_WIDTH_PX}px`}>
                  {translate(LICENSE_TYPE_TABLE_HEADER_KEY)}
                </TableCell>
              )}
              <TableCell width={`${IP_AGREEMENTS_TABLE_DURATION_COL_WIDTH_PX}px`}>
                {translate('Label.Duration')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_REVENUE_SHARE_COL_WIDTH_PX}px`}>
                {translate('Label.RevenueShare')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_REVENUE_SHARE_TIMING_COL_WIDTH_PX}px`}>
                {translate('Label.RevenueShareTiming')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_LIFETIME_VISITS_RANGE_COL_WIDTH_PX}px`}>
                {translate('Label.LifetimeVisitsRange')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_STATUS_COL_WIDTH_PX}px`}>
                {translate('Label.Status')}
              </TableCell>
              <TableCell width={`${IP_AGREEMENTS_TABLE_LAST_UPDATED_COL_WIDTH_PX}px`}>
                {translate('Label.LastUpdated')}
              </TableCell>
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
    <>
      <AgreementTableFilters
        selectedFilter={effectiveSelectedFilter}
        onFilterChange={setFilter}
        filtersWithCounts={filtersWithCounts}
      />
      {renderTableContent()}
    </>
  );
};

export default IphAgreementsTable;
