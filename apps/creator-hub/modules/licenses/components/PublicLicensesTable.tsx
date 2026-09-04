import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useFlag } from '@rbx/flags';
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
import {
  isAvatarItemLicensingEnabled as isAvatarItemLicensingEnabledFlag,
  isInGameSalesLicensingEnabled as isInGameSalesLicensingEnabledFlag,
} from '@generated/flags/contentLicensing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import GuidelinesAndRestrictionsSummaryModal from '@modules/ip/license-manager/components/GuidelinesAndRestrictionsSummaryModal';
import { getLicenseTypeTableLabel } from '@modules/ip/license-manager/utils/licenseTypeTableLabelKeys';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';
import TranslatedFailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useListPublicLicenses, type PublicCatalogLicense } from '../hooks/useListPublicLicenses';
import { useVisibleImpression } from '../hooks/useVisibleImpression';
import { LicenseRequestCancelReturnTo } from '../urls';
import { EXPLORE_LICENSES_ACTION_TOOLBAR_HEIGHT_PX } from '../utils/constants';
import { formatRoyaltyRate } from '../utils/format';
import {
  buildPublicLicensesCatalogFilter,
  getPublicLicensesTableAnalyticsContext,
  hasActivePublicLicenseCatalogFilters,
  type PublicLicenseDurationFilter,
  type PublicLicenseTypeFilter,
} from '../utils/publicLicenseDurationFilter';
import ExploreLicensesEmptyState from './ExploreLicensesEmptyState';
import LicenseDetailsModal from './LicenseDetailsModal';
import PublicLicensesDurationFilterPills from './PublicLicensesDurationFilterPills';
import PublicLicensesFilterChip, {
  type PublicLicensesFilterOption,
} from './PublicLicensesFilterChip';

const LICENSE_TYPE_LABEL_KEYS = {
  [LicenseType.FullExperience]: 'Label.FullExperience',
  [LicenseType.CollaborationInExperienceSale]: 'Label.Collaboration',
} as const;

const DURATION_FILTER_OPTIONS: PublicLicensesFilterOption<PublicLicenseDurationFilter>[] = [
  { value: 'all', label: 'Label.All' },
  { value: LicenseDurationType.TimeLimited, label: 'Label.TimeLimited' },
  { value: LicenseDurationType.Perpetual, label: 'Label.Perpetual' },
];

const LICENSE_TYPE_FILTER_OPTIONS: PublicLicensesFilterOption<PublicLicenseTypeFilter>[] = [
  { value: 'all', label: 'Label.All' },
  { value: LicenseType.FullExperience, label: LICENSE_TYPE_LABEL_KEYS[LicenseType.FullExperience] },
  {
    value: LicenseType.CollaborationInExperienceSale,
    label: LICENSE_TYPE_LABEL_KEYS[LicenseType.CollaborationInExperienceSale],
  },
];

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
    gap: theme.spacing(1),
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
  const licenseId = license.id ?? '';
  const listingId =
    'listingId' in license && typeof license.listingId === 'string' ? license.listingId : '';

  const logCatalogImpression = useCallback(() => {
    if (licenseId === '') {
      return;
    }

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
  const rowRef = useVisibleImpression<HTMLTableRowElement>(logCatalogImpression);

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
  const translation = useTranslation();
  const { translate, translateWithNamespace } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const resetFiltersLabel = tPendingTranslation(
    'Reset filters',
    'Action text shown to users when they have filters applied to their current view so that they can easily remove all actively applied filters',
    translationKey('Action.ResetFilters', TranslationNamespace.Licenses),
  );
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const authentication = useAuthentication();
  const { user, isFetched: isAuthenticationFetched } = authentication;
  const isAuthenticated = user !== null;
  const { ready: isInGameSalesLicensingFlagReady, value: inGameSalesLicensingFlagValue } = useFlag(
    isInGameSalesLicensingEnabledFlag,
  );
  const { ready: isAvatarItemLicensingFlagReady, value: avatarItemLicensingFlagValue } = useFlag(
    isAvatarItemLicensingEnabledFlag,
  );
  const isInGameSalesLicensingEnabled = inGameSalesLicensingFlagValue ?? false;
  const isAvatarItemLicensingEnabled = avatarItemLicensingFlagValue ?? false;

  const [isLicenseDetailsModalOpen, setIsLicenseDetailsModalOpen] = useState(false);
  const [isGuidelinesAndRestrictionsModalOpen, setIsGuidelinesAndRestrictionsModalOpen] =
    useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseResponse | null>(null);
  const [durationFilter, setDurationFilter] = useState<PublicLicenseDurationFilter>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<PublicLicenseTypeFilter>('all');
  const effectiveLicenseTypeFilter =
    licenseTypeFilter === LicenseType.MarketplaceSale && !isAvatarItemLicensingEnabled
      ? 'all'
      : licenseTypeFilter;
  const licenseTypeFilterOptions =
    useMemo((): PublicLicensesFilterOption<PublicLicenseTypeFilter>[] => {
      const options = LICENSE_TYPE_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: translate(option.label),
      }));
      if (isAvatarItemLicensingEnabled) {
        options.push({
          value: LicenseType.MarketplaceSale,
          label: getLicenseTypeTableLabel(
            LicenseType.MarketplaceSale,
            translate,
            tPendingTranslation,
          ),
        });
      }
      return options;
    }, [isAvatarItemLicensingEnabled, tPendingTranslation, translate]);
  const durationFilterOptions = useMemo(
    (): PublicLicensesFilterOption<PublicLicenseDurationFilter>[] =>
      DURATION_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: translate(option.label),
      })),
    [translate],
  );

  const handleDurationFilterChange = useCallback(
    (next: PublicLicenseDurationFilter) => {
      logEvent(LicenseManagerClickEvent.PublicLicensesTableDurationTypeFilterClickEvent, {
        selectedFilter: next,
      });
      setDurationFilter(next);
    },
    [logEvent],
  );

  const handleLicenseTypeFilterChange = useCallback(
    (next: PublicLicenseTypeFilter) => {
      logEvent(LicenseManagerClickEvent.PublicLicensesTableLicenseTypeFilterClickEvent, {
        selectedFilter: next,
      });
      setLicenseTypeFilter(next);
    },
    [logEvent],
  );

  const catalogFilter = useMemo(
    () =>
      buildPublicLicensesCatalogFilter({
        durationType: durationFilter,
        licenseType: isInGameSalesLicensingEnabled ? effectiveLicenseTypeFilter : 'all',
      }),
    [durationFilter, effectiveLicenseTypeFilter, isInGameSalesLicensingEnabled],
  );

  const hasActiveFilters = hasActivePublicLicenseCatalogFilters({
    durationType: durationFilter,
    licenseType: effectiveLicenseTypeFilter,
    enableLicenseTypeFilter: isInGameSalesLicensingEnabled,
  });

  const analyticsContext = useMemo(
    () =>
      getPublicLicensesTableAnalyticsContext({
        durationType: durationFilter,
        licenseType: effectiveLicenseTypeFilter,
        enableLicenseTypeFilter: isInGameSalesLicensingEnabled,
      }),
    [durationFilter, effectiveLicenseTypeFilter, isInGameSalesLicensingEnabled],
  );
  const analyticsContextDedupeKey = JSON.stringify(analyticsContext);

  const handleResetFilters = useCallback(
    (resetSource: 'toolbar' | 'empty_state') => {
      logEvent(LicenseManagerClickEvent.PublicLicensesTableClearFiltersClickEvent, {
        ...analyticsContext,
        resetSource,
      });
      setDurationFilter('all');
      setLicenseTypeFilter('all');
    },
    [analyticsContext, logEvent],
  );

  const { isPending, isError, allLicenses, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListPublicLicenses({
      limit: 30,
      filter: catalogFilter,
    });

  const showFilteredEmptyState =
    hasActiveFilters &&
    !isPending &&
    !isError &&
    !isFetchingNextPage &&
    allLicenses.length === 0 &&
    !hasNextPage;

  useEffect(() => {
    if (!showFilteredEmptyState) {
      return;
    }

    logOnce(
      LicenseManagerImpressionEvent.EmptyStatePublicLicensesTableNoMatchesWithAppliedFiltersImpressionEvent,
      analyticsContext,
      analyticsContextDedupeKey,
    );
  }, [analyticsContext, analyticsContextDedupeKey, logOnce, showFilteredEmptyState]);

  const onClickViewDetails = (license: PublicCatalogLicense, rowPosition: number) => () => {
    const licenseId = license.id;
    if (licenseId == null || licenseId === '') {
      return;
    }
    const listingId =
      'listingId' in license && typeof license.listingId === 'string' ? license.listingId : '';
    setSelectedLicense(license);
    setIsLicenseDetailsModalOpen(true);
    logEvent(LicenseManagerClickEvent.ViewLicenseDetailsClickEvent, {
      licenseId,
      source: 'list_public_licenses_table',
      viewMode: 'list',
      listingId,
      rowPosition,
      filterTab: catalogFilter || 'all',
    });
  };

  const handleGuidelinesAndRestrictionsClick = useCallback(() => {
    setIsLicenseDetailsModalOpen(false);
    setIsGuidelinesAndRestrictionsModalOpen(true);
  }, []);

  const controlsToolbar = (
    <div className={classes.controlsBar}>
      <div className={classes.controlsBarLeading}>
        {isInGameSalesLicensingEnabled ? (
          <>
            <PublicLicensesFilterChip
              filterLabel={translate('Label.LicenseType')}
              options={licenseTypeFilterOptions}
              selected={effectiveLicenseTypeFilter}
              onChange={handleLicenseTypeFilterChange}
              testId='public-licenses-license-type-filter-chip'
            />
            <PublicLicensesFilterChip
              filterLabel={translateWithNamespace(
                TranslationNamespace.AgreementsManager,
                'Label.Duration',
              )}
              options={durationFilterOptions}
              selected={durationFilter}
              onChange={handleDurationFilterChange}
              testId='public-licenses-duration-filter-chip'
            />
          </>
        ) : (
          <PublicLicensesDurationFilterPills
            selected={durationFilter}
            onChange={handleDurationFilterChange}
          />
        )}
      </div>
      {(hasActiveFilters || browseViewToolbarEndSlot != null) && (
        <div className={classes.controlsBarEnd}>
          {hasActiveFilters && (
            <Button
              variant='text'
              color='secondary'
              onClick={() => handleResetFilters('toolbar')}
              data-testid='public-licenses-reset-filters-button'>
              {resetFiltersLabel}
            </Button>
          )}
          {browseViewToolbarEndSlot}
        </div>
      )}
    </div>
  );

  if (
    !isAuthenticationFetched ||
    !isInGameSalesLicensingFlagReady ||
    !isAvatarItemLicensingFlagReady ||
    isPending
  ) {
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
        <ExploreLicensesEmptyState onResetFilters={() => handleResetFilters('empty_state')} />
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
                {isInGameSalesLicensingEnabled && (
                  <TableCell className={classes.headerCell}>
                    {translate('Label.LicenseType')}
                  </TableCell>
                )}
                <TableCell className={classes.headerCell}>
                  {translate('Label.LicenseDuration')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allLicenses.map((license, index) => (
                <PublicLicensesTableDataRow
                  key={`${license.id ?? index}-${catalogFilter}`}
                  license={license}
                  rowPosition={index + 1}
                  filterTab={catalogFilter || 'all'}
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
                  {isInGameSalesLicensingEnabled && (
                    <TableCell>
                      {getLicenseTypeTableLabel(
                        license.licenseType,
                        translate,
                        tPendingTranslation,
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
                      ? translate('Label.TimeLimited')
                      : translate('Label.Perpetual')}
                  </TableCell>
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
