import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  makeStyles,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import { getMaturityRatingLabel } from '@modules/ip/license-manager/utils/maturityRating';
import TranslatedFailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { useListPublicLicenses, type PublicCatalogLicense } from '../hooks/useListPublicLicenses';
import { LicenseRequestCancelReturnTo } from '../urls';
import { EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX } from '../utils/constants';
import { formatRoyaltyRate } from '../utils/format';
import {
  buildPublicLicensesCatalogFilter,
  type PublicLicenseDurationFilter,
} from '../utils/publicLicenseDurationFilter';
import ExploreLicensesEmptyState from './ExploreLicensesEmptyState';
import LicenseDetailsModal from './LicenseDetailsModal';
import PublicLicensesDurationFilterPills from './PublicLicensesDurationFilterPills';

const LICENSE_TYPE_LABEL_KEYS: Record<LicenseType, string> = {
  FullExperience: 'Label.FullExperience',
  CollaborationInExperienceSale: 'Label.Collaboration',
  MarketplaceSale: 'Label.MarketplaceSale',
};

const useStyles = makeStyles<
  void,
  | 'controlsBar'
  | 'controlsBarEnd'
  | 'controlsBarLeading'
  | 'headerCell'
  | 'row'
  | 'loadMoreContainer'
>()((theme) => ({
  controlsBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'nowrap',
    gap: theme.spacing(1),
    boxSizing: 'border-box',
    height: EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX,
    minHeight: EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX,
  },
  controlsBarLeading: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flex: '1 1 auto',
    overflowX: 'auto',
  },
  controlsBarEnd: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerCell: {
    whiteSpace: 'nowrap',
    paddingTop: 0,
    paddingBottom: theme.spacing(1),
    verticalAlign: 'top',
  },
  row: {
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    '& td, & th': {
      cursor: 'pointer',
    },
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: 16,
  },
}));

export type PublicLicensesTableRow = {
  id: string;
  name: string;
  ipListing: string;
  revenueShare: string;
  licenseType: string;
  maximumContentMaturity: string;
  minimumAverageL7Dau: string;
};

export type PublicLicensesTableProps = {
  browseViewToolbarEndSlot?: ReactNode;
};

type PublicLicensesTableDataRowProps = {
  license: PublicCatalogLicense;
  rowPosition: number;
  filterTab: string;
  className: string;
  onClick: () => void;
  children: ReactNode;
};

const PublicLicensesTableDataRow: FunctionComponent<PublicLicensesTableDataRowProps> = ({
  license,
  rowPosition,
  filterTab,
  className,
  onClick,
  children,
}) => {
  const { logEvent } = useLicenseManagerLogger();
  const rowRef = useRef<HTMLTableRowElement>(null);
  const hasLoggedImpressionRef = useRef(false);
  const licenseId = license.id ?? '';
  const listingId =
    'listingId' in license && typeof license.listingId === 'string' ? license.listingId : '';

  const logCatalogImpression = useCallback(() => {
    if (hasLoggedImpressionRef.current || licenseId === '') {
      return;
    }

    hasLoggedImpressionRef.current = true;
    logEvent(LicenseManagerImpressionEvent.CatalogImpressionEvent, {
      requestId: '',
      universeId: '',
      viewMode: 'list',
      licenseId,
      listingId,
      rowPosition,
      filterTab,
    });
  }, [filterTab, licenseId, listingId, logEvent, rowPosition]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof IntersectionObserver === 'undefined') {
      logCatalogImpression();
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        logCatalogImpression();
        observer.disconnect();
      }
    });

    observer.observe(row);

    return () => {
      observer.disconnect();
    };
  }, [logCatalogImpression]);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <TableRow ref={rowRef} className={className} onClick={handleClick}>
      {children}
    </TableRow>
  );
};

const PublicLicensesTable: FunctionComponent<PublicLicensesTableProps> = ({
  browseViewToolbarEndSlot,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const authentication = useAuthentication();
  const { user, isFetched: isAuthenticationFetched } = authentication;
  const isAuthenticated = user !== null;
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;

  const [isLicenseDetailsModalOpen, setIsLicenseDetailsModalOpen] = useState(false);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseResponse | null>(null);
  const [durationFilter, setDurationFilter] = useState<PublicLicenseDurationFilter>('all');

  const handleDurationFilterChange = useCallback(
    (next: PublicLicenseDurationFilter) => {
      let selectedFilter: string;
      if (next === 'all') {
        selectedFilter = 'all';
      } else if (next === LicenseDurationType.TimeLimited) {
        selectedFilter = 'TimeLimited';
      } else {
        selectedFilter = 'Perpetual';
      }
      logEvent(LicenseManagerClickEvent.PublicLicensesTableDurationTypeFilterClickEvent, {
        selectedFilter,
      });
      setDurationFilter(next);
    },
    [logEvent],
  );

  const catalogFilter = useMemo(
    () => buildPublicLicensesCatalogFilter(durationFilter),
    [durationFilter],
  );

  const { isPending, isError, allLicenses, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListPublicLicenses({
      limit: 30,
      filter: catalogFilter,
    });

  const showFilteredEmptyState =
    durationFilter !== 'all' &&
    !isPending &&
    !isFetchingNextPage &&
    allLicenses.length === 0 &&
    !hasNextPage;

  const onClickViewDetails = (license: PublicCatalogLicense, rowPosition: number) => () => {
    const licenseId = license.id;
    if (licenseId == null || licenseId === '') {
      return;
    }
    const listingId =
      'listingId' in license && typeof license.listingId === 'string' ? license.listingId : '';
    setSelectedLicense(license as LicenseResponse);
    setIsLicenseDetailsModalOpen(true);
    logEvent(LicenseManagerClickEvent.ViewLicenseDetailsClickEvent, {
      licenseId,
      source: 'list_public_licenses_table',
      viewMode: 'list',
      listingId,
      rowPosition,
      filterTab: durationFilter,
    });
  };

  const handleGuidelinesAndRestrictionsClick = useCallback(() => {
    setIsLicenseDetailsModalOpen(false);
    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, []);

  const controlsToolbar = (
    <div className={classes.controlsBar}>
      <div className={classes.controlsBarLeading}>
        <PublicLicensesDurationFilterPills
          selected={durationFilter}
          onChange={handleDurationFilterChange}
        />
      </div>
      {browseViewToolbarEndSlot != null ? (
        <div className={classes.controlsBarEnd}>{browseViewToolbarEndSlot}</div>
      ) : null}
    </div>
  );

  if (!isAuthenticationFetched || loadingFrontendFlags || isPending) {
    return (
      <>
        {controlsToolbar}
        <CircularProgress />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {controlsToolbar}
        <TranslatedFailureView
          title={translate('Heading.FailedToLoadPage')}
          message={translate('Message.FailedToLoadPage')}
        />
      </>
    );
  }

  return (
    <>
      {controlsToolbar}
      {showFilteredEmptyState ? (
        <ExploreLicensesEmptyState />
      ) : (
        <TableContainer data-testid='public-licenses-table'>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.headerCell}>{translate('Heading.Name')}</TableCell>
                <TableCell className={classes.headerCell}>{translate('Label.IpFamily')}</TableCell>
                {isAuthenticated && (
                  <TableCell className={classes.headerCell}>
                    {translate('Label.RevenueShare')}
                  </TableCell>
                )}
                {enableCollaborationLicensing && (
                  <TableCell className={classes.headerCell}>
                    {translate('Label.LicenseType')}
                  </TableCell>
                )}
                <TableCell className={classes.headerCell}>
                  {translate('Label.LicenseDuration')}
                </TableCell>
                <TableCell className={classes.headerCell}>
                  {translate('Label.MaxMaturityRating')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allLicenses.map((license, index) => (
                <PublicLicensesTableDataRow
                  key={`${license.id ?? index}-${durationFilter}`}
                  license={license}
                  rowPosition={index + 1}
                  filterTab={durationFilter}
                  className={classes.row}
                  onClick={
                    isAuthenticated
                      ? onClickViewDetails(license, index + 1)
                      : () => {
                          void authentication.login();
                        }
                  }>
                  <TableCell>{license.name}</TableCell>
                  <TableCell>{license.listingName}</TableCell>
                  {isAuthenticated && 'royaltyRate' in license && (
                    <TableCell>{formatRoyaltyRate(license.royaltyRate)}</TableCell>
                  )}
                  {enableCollaborationLicensing && (
                    <TableCell>
                      {translate(
                        LICENSE_TYPE_LABEL_KEYS[license.licenseType ?? LicenseType.FullExperience],
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
                      ? translate('Label.TimeLimited')
                      : translate('Label.Perpetual')}
                  </TableCell>
                  <TableCell>{translate(getMaturityRatingLabel(license.maxAgeRating))}</TableCell>
                </PublicLicensesTableDataRow>
              ))}
            </TableBody>
          </Table>
          {hasNextPage && (
            <div className={classes.loadMoreContainer}>
              <Button
                onClick={() => {
                  void fetchNextPage();
                }}
                disabled={isFetchingNextPage}
                variant='outlined'
                color='secondary'>
                {isFetchingNextPage ? translate('Label.Loading') : translate('Action.LoadMore')}
              </Button>
            </div>
          )}
        </TableContainer>
      )}
      <LicenseDetailsModal
        isOpen={isLicenseDetailsModalOpen}
        setOpen={setIsLicenseDetailsModalOpen}
        license={selectedLicense}
        handleGuidelinesAndRestrictionsClick={handleGuidelinesAndRestrictionsClick}
        licenseRequestCancelReturnTo={LicenseRequestCancelReturnTo.LicensesCatalog}
      />
      <GuidelinesAndRestrictionsSummaryModal
        isOpen={isGuidelinesAndRestrictionsModalOpen}
        setOpen={setIsGuidelinesAndRestrictionsModalOpen}
        license={selectedLicense}
        isCreator
      />
    </>
  );
};

export default withTranslation(PublicLicensesTable, [
  TranslationNamespace.Licenses,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
]);
