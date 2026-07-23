import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type {
  AgreementCandidateResponse,
  AgreementCandidateIndexSortBy,
} from '@rbx/client-content-licensing-api/v1';
import type { UniverseContentMaturity } from '@rbx/client-content-licensing-api/v1';
import { AgreementCandidateIndexSortDirection } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { makeStyles, CircularProgress, Button, Tooltip, FilterListIcon } from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import IpLoadError from '../../../components/error/IpLoadError';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { IP_FAMILIES_HREF, IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import { useMatchesQuery } from '../hooks/useMatchesQuery';
import ContentMaturityFilterChip from './ContentMaturityFilterChip';
import DauRangeFilterChip, { DauRange } from './DauRangeFilterChip';
import IpFamilyFilterChip from './IpFamilyFilterChip';
import LifetimeVisitsRangeFilterChip, {
  LifetimeVisitsRange,
} from './LifetimeVisitsRangeFilterChip';
import MatchCandidateOfferStatusFilterChip, {
  MatchCandidateOfferStatusFilter,
} from './MatchCandidateOfferStatusFilterChip';
import MatchDetailsPanelContent, {
  type MatchPanelAgreementStatus,
  type MatchDetailsPanelNavigation,
} from './MatchDetailsPanelContent';
import MatchesFilterPanel from './MatchesFilterPanel';
import MatchesFilterPanelContent from './MatchesFilterPanelContent';
import MatchesSidePanel from './MatchesSidePanel';
import MatchesTable from './MatchesTable';
import MatchOfferPanelContent from './MatchOfferPanelContent';

enum MatchPanelView {
  None = 'none',
  Details = 'matchDetails',
  Offer = 'agreement',
}

const useStyles = makeStyles()((theme) => ({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  mockAlert: {
    marginTop: theme.spacing(2),
  },
  filtersContainer: {
    marginBottom: theme.spacing(1.5),
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterButtonContainer: {
    marginLeft: 'auto',
  },
  filterButtonRoot: {
    fontWeight: theme.typography.body1.fontWeight,
    borderColor: theme.palette.surface.outline,
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

const NoMatchesWithFiltersContent = ({
  onResetFilters,
  openDialog,
  maxLimit,
}: {
  onResetFilters: () => void;
  openDialog?: () => void;
  maxLimit: number;
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoRequestsYet')}
        size='small'
        description={translate('Description.NoMatchesFoundWithFiltersManualScan')}
        illustration='findPeople'>
        <div className={classes.buttonContainer}>
          <Button onClick={onResetFilters} color='primaryBrand' variant='contained'>
            {translate('Action.ResetFilters')}
          </Button>
          <Tooltip
            title={translate('Label.DailyLimitReached', {
              maxLimit: maxLimit.toString(),
            })}
            arrow
            placement='bottom'
            disableHoverListener={!!openDialog}
            disableFocusListener={!!openDialog}
            disableTouchListener={!!openDialog}>
            <div>
              <Button
                size='medium'
                variant='contained'
                color='secondary'
                onClick={openDialog}
                disabled={!openDialog}>
                {translate('Action.RequestMatch')}
              </Button>
            </div>
          </Tooltip>
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
};

const NoMatchesContent = ({
  openDialog,
  maxLimit,
}: {
  openDialog?: () => void;
  maxLimit: number;
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoMatchResultsYet')}
        size='small'
        description={translate('Description.NoMatches')}
        illustration='findPeople'>
        <div className={classes.buttonContainer}>
          <Button component={Link} href={IP_FAMILIES_HREF} color='primaryBrand' variant='contained'>
            {translate('Action.UpdateIpLibrary')}
          </Button>
          <Tooltip
            title={translate('Label.DailyLimitReached', {
              maxLimit: maxLimit.toString(),
            })}
            arrow
            placement='bottom'
            disableHoverListener={!!openDialog}
            disableFocusListener={!!openDialog}
            disableTouchListener={!!openDialog}>
            <div>
              <Button
                size='medium'
                variant='contained'
                color='secondary'
                onClick={openDialog}
                disabled={!openDialog}>
                {translate('Action.RequestMatch')}
              </Button>
            </div>
          </Tooltip>
        </div>
      </EmptyState>
    </EmptyStateBorder>
  );
};

const NoIpFamiliesContent = () => {
  const { translate } = useTranslation();
  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Label.NoMatchesFound')}
        size='small'
        description={translate('Description.MatchesNoIPLibrary')}>
        <Button
          component={Link}
          href={IP_FAMILY_CREATE_HREF}
          color='primaryBrand'
          variant='contained'>
          {translate('Action.CreateIpFamily')}
        </Button>
      </EmptyState>
    </EmptyStateBorder>
  );
};

interface MatchesProps {
  openDialog?: () => void;
  maxManualRequestsLimit?: number;
}

interface MatchesFilters {
  ipFamilyId?: string;
  dauRange?: DauRange;
  lifetimeVisitsRange?: LifetimeVisitsRange;
  contentMaturities: UniverseContentMaturity[];
  offerStatusFilter?: MatchCandidateOfferStatusFilter;
}

interface MatchesSort {
  sortBy?: AgreementCandidateIndexSortBy;
  sortDirection: AgreementCandidateIndexSortDirection;
}

type MatchesTableAnalyticsContext = {
  matchesDataSource: 'indexed' | 'legacy';
  hasIpFamilyFilter: boolean;
  dauRangeFilter: string;
  lifetimeVisitsRangeFilter: string;
  contentMaturityFilters: string;
  offerStatusFilter: string;
  sortBy: string;
  sortDirection: string;
  activeFilterCount: number;
};

const getMatchesTableAnalyticsContext = (
  filters: MatchesFilters,
  sort: MatchesSort,
  isIndexedMatchesEnabled: boolean,
): MatchesTableAnalyticsContext => {
  const hasDauRangeFilter = filters.dauRange != null && filters.dauRange !== DauRange.All;
  const hasLifetimeVisitsRangeFilter =
    filters.lifetimeVisitsRange != null && filters.lifetimeVisitsRange !== LifetimeVisitsRange.All;
  const hasOfferStatusFilter =
    filters.offerStatusFilter != null &&
    filters.offerStatusFilter !== MatchCandidateOfferStatusFilter.All;
  const hasIpFamilyFilter = Boolean(filters.ipFamilyId);
  const hasContentMaturityFilters = filters.contentMaturities.length > 0;
  const hasSort = isIndexedMatchesEnabled && sort.sortBy !== undefined;

  return {
    matchesDataSource: isIndexedMatchesEnabled ? 'indexed' : 'legacy',
    hasIpFamilyFilter,
    dauRangeFilter: hasDauRangeFilter ? String(filters.dauRange) : 'All',
    lifetimeVisitsRangeFilter: hasLifetimeVisitsRangeFilter
      ? String(filters.lifetimeVisitsRange)
      : 'All',
    contentMaturityFilters: hasContentMaturityFilters
      ? [...filters.contentMaturities].sort().join('|')
      : 'All',
    offerStatusFilter: hasOfferStatusFilter ? String(filters.offerStatusFilter) : 'All',
    sortBy: hasSort ? String(sort.sortBy) : 'None',
    sortDirection: hasSort ? sort.sortDirection : 'None',
    activeFilterCount: [
      hasIpFamilyFilter,
      hasDauRangeFilter,
      hasLifetimeVisitsRangeFilter,
      hasContentMaturityFilters,
      hasOfferStatusFilter,
    ].filter(Boolean).length,
  };
};

const serializeMatchesTableAnalyticsContext = (context: MatchesTableAnalyticsContext): string =>
  JSON.stringify(context);

const Matches: React.FC<MatchesProps> = ({ maxManualRequestsLimit, openDialog }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const isIndexedMatchesEnabled = settings.enableIpPlatformMatchesTableEsIndexImprovements;
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<MatchesFilters>({
    ipFamilyId: undefined,
    dauRange: undefined,
    lifetimeVisitsRange: undefined,
    contentMaturities: [],
    offerStatusFilter: undefined,
  });
  const filtersRef = useRef(filters);
  const [sort, setSort] = useState<MatchesSort>({
    sortBy: undefined,
    sortDirection: AgreementCandidateIndexSortDirection.Asc,
  });
  const sortRef = useRef(sort);
  const analyticsContext = useMemo(
    () => getMatchesTableAnalyticsContext(filters, sort, isIndexedMatchesEnabled),
    [filters, sort, isIndexedMatchesEnabled],
  );
  const analyticsContextDedupeKey = serializeMatchesTableAnalyticsContext(analyticsContext);

  const [selectedCandidate, setSelectedCandidate] = useState<
    AgreementCandidateResponse | undefined
  >(undefined);

  const [currentMatchPanelView, setCurrentMatchPanelView] = useState<MatchPanelView>(
    MatchPanelView.None,
  );

  const isMatchPanelOpen = currentMatchPanelView !== MatchPanelView.None;
  const isSidePanelOpen = isMatchPanelOpen || filterDrawerOpen;

  const ipFamiliesReq = useIpFamiliesQuery();
  const candidatesQuery = useMatchesQuery({
    pageSize: 50,
    ipFamilyId: filters.ipFamilyId,
    dauRange: filters.dauRange,
    lifetimeVisitsRange: filters.lifetimeVisitsRange,
    contentMaturityRatings:
      filters.contentMaturities.length === 0 ? undefined : filters.contentMaturities,
    offerStatusFilter: filters.offerStatusFilter,
    sortBy: isIndexedMatchesEnabled ? sort.sortBy : undefined,
    sortDirection:
      isIndexedMatchesEnabled && sort.sortBy !== undefined ? sort.sortDirection : undefined,
    loadAgreementStatuses: true,
  });

  const { allAgreementCandidates, agreementStatusesColumn } = candidatesQuery;

  const matchPanelAgreementStatus = useMemo((): MatchPanelAgreementStatus | undefined => {
    if (!selectedCandidate?.agreementId) {
      return undefined;
    }
    const col = agreementStatusesColumn;
    if (!col) {
      return undefined;
    }
    const aid = selectedCandidate.agreementId;
    return {
      status: col.statusByAgreementId?.[aid],
      rowError: col.errorsByAgreementId?.[aid],
      isPending: col.isPending,
      isError: col.isError,
    };
  }, [selectedCandidate?.agreementId, agreementStatusesColumn]);

  const hasActiveFilters =
    Boolean(filters.ipFamilyId) ||
    filters.dauRange != null ||
    filters.lifetimeVisitsRange != null ||
    filters.contentMaturities.length > 0 ||
    filters.offerStatusFilter != null;
  const hasNoMatches = allAgreementCandidates.length === 0;
  const hasNoIpFamilies = ipFamiliesReq.data?.ipFamilies.length === 0;

  const handleIpFamilyFilterChange = (selectedId: string | undefined) => {
    const nextFilters = { ...filtersRef.current, ipFamilyId: selectedId };
    filtersRef.current = nextFilters;
    logEvent(
      LicenseManagerClickEvent.MatchesTableIpFamilyFilterClickEvent,
      getMatchesTableAnalyticsContext(nextFilters, sortRef.current, isIndexedMatchesEnabled),
    );
    setFilters(nextFilters);
  };

  const handleDauRangeChange = (range: DauRange | undefined) => {
    const nextFilters = { ...filtersRef.current, dauRange: range };
    filtersRef.current = nextFilters;
    logEvent(
      LicenseManagerClickEvent.MatchesTableDauRangeFilterClickEvent,
      getMatchesTableAnalyticsContext(nextFilters, sortRef.current, isIndexedMatchesEnabled),
    );
    setFilters(nextFilters);
  };

  const handleLifetimeVisitsRangeChange = (range: LifetimeVisitsRange | undefined) => {
    const nextFilters = { ...filtersRef.current, lifetimeVisitsRange: range };
    filtersRef.current = nextFilters;
    logEvent(
      LicenseManagerClickEvent.MatchesTableLifetimeVisitsRangeFilterClickEvent,
      getMatchesTableAnalyticsContext(nextFilters, sortRef.current, isIndexedMatchesEnabled),
    );
    setFilters(nextFilters);
  };

  const handleContentMaturityChange = (ratings: UniverseContentMaturity[]) => {
    const nextFilters = { ...filtersRef.current, contentMaturities: ratings };
    filtersRef.current = nextFilters;
    logEvent(
      LicenseManagerClickEvent.MatchesTableContentMaturityFilterClickEvent,
      getMatchesTableAnalyticsContext(nextFilters, sortRef.current, isIndexedMatchesEnabled),
    );
    setFilters(nextFilters);
  };

  const handleOfferStatusFilterChange = (value: MatchCandidateOfferStatusFilter | undefined) => {
    const nextFilters = { ...filtersRef.current, offerStatusFilter: value };
    filtersRef.current = nextFilters;
    logEvent(
      LicenseManagerClickEvent.MatchesTableMatchCandidateStatusFilterClickEvent,
      getMatchesTableAnalyticsContext(nextFilters, sortRef.current, isIndexedMatchesEnabled),
    );
    setFilters(nextFilters);
  };

  const handleSort = useCallback(
    (sortBy: AgreementCandidateIndexSortBy) => {
      const previousSort = sortRef.current;
      const nextSort: MatchesSort = {
        sortBy,
        sortDirection:
          previousSort.sortBy === sortBy &&
          previousSort.sortDirection === AgreementCandidateIndexSortDirection.Asc
            ? AgreementCandidateIndexSortDirection.Desc
            : AgreementCandidateIndexSortDirection.Asc,
      };
      sortRef.current = nextSort;
      logEvent(
        LicenseManagerClickEvent.MatchesTableSortClickEvent,
        getMatchesTableAnalyticsContext(filtersRef.current, nextSort, isIndexedMatchesEnabled),
      );
      setSort(nextSort);
    },
    [isIndexedMatchesEnabled, logEvent],
  );

  const handleResetFilters = () => {
    logEvent(LicenseManagerClickEvent.MatchesTableClearFiltersClickEvent, {
      ...analyticsContext,
      action: 'clear',
    });
    const resetFilters: MatchesFilters = {
      ipFamilyId: undefined,
      dauRange: undefined,
      lifetimeVisitsRange: undefined,
      contentMaturities: [],
      offerStatusFilter: undefined,
    };
    filtersRef.current = resetFilters;
    setFilters(resetFilters);
  };

  const handleLoadMore = useCallback(() => {
    logEvent(LicenseManagerClickEvent.MatchesTableLoadMoreClickEvent, {
      ...analyticsContext,
      loadedResultCount: allAgreementCandidates.length,
      hasNextPage: candidatesQuery.hasNextPage ?? false,
    });
  }, [allAgreementCandidates.length, analyticsContext, candidatesQuery.hasNextPage, logEvent]);

  const handleSelectCandidate = useCallback(
    (candidate: AgreementCandidateResponse) => {
      const candidateId = candidate.id;
      if (candidateId) {
        logEvent(LicenseManagerClickEvent.ViewAgreementCandidateClickEvent, {
          candidate: candidateId,
          ...analyticsContext,
          rowPosition:
            allAgreementCandidates.findIndex(
              (agreementCandidate) => agreementCandidate.id === candidateId,
            ) + 1,
        });
      }
      setFilterDrawerOpen(false);
      setSelectedCandidate(candidate);
      setCurrentMatchPanelView(MatchPanelView.Details);
    },
    [allAgreementCandidates, analyticsContext, logEvent],
  );

  const selectedMatchIndex = useMemo(() => {
    const selectedId = selectedCandidate?.id;
    if (selectedId == null) {
      return -1;
    }
    return allAgreementCandidates.findIndex((match) => match.id === selectedId);
  }, [allAgreementCandidates, selectedCandidate?.id]);

  const matchDetailsNavigation = useMemo((): MatchDetailsPanelNavigation | undefined => {
    if (selectedMatchIndex < 0) {
      return undefined;
    }

    return {
      onPrevious: () => {
        const previousMatch = allAgreementCandidates[selectedMatchIndex - 1];
        if (previousMatch) {
          handleSelectCandidate(previousMatch);
        }
      },
      onNext: () => {
        const nextMatch = allAgreementCandidates[selectedMatchIndex + 1];
        if (nextMatch) {
          handleSelectCandidate(nextMatch);
        }
      },
      canGoPrevious: selectedMatchIndex > 0,
      canGoNext: selectedMatchIndex < allAgreementCandidates.length - 1,
    };
  }, [allAgreementCandidates, handleSelectCandidate, selectedMatchIndex]);

  const handleCloseMatchPanel = useCallback(() => {
    setCurrentMatchPanelView(MatchPanelView.None);
  }, []);

  const openFilterDrawer = useCallback(() => {
    setCurrentMatchPanelView(MatchPanelView.None);
    setFilterDrawerOpen(true);
  }, []);

  const closeFilterDrawer = useCallback(() => {
    setFilterDrawerOpen(false);
    filterButtonRef.current?.focus();
  }, []);

  const handleOfferLicense = () => {
    setCurrentMatchPanelView(MatchPanelView.Offer);
  };

  const handleAgreementSuccess = () => {
    setCurrentMatchPanelView(MatchPanelView.None);
  };

  const matchPanelAriaLabel =
    currentMatchPanelView === MatchPanelView.Offer
      ? translate('Heading.NewLicenseOffer')
      : translate('Heading.ViewMatch');

  useEffect(() => {
    if (
      !candidatesQuery.isSuccess ||
      candidatesQuery.isFetching ||
      candidatesQuery.isPlaceholderData ||
      hasNoMatches ||
      hasNoIpFamilies
    ) {
      return;
    }

    logOnce(
      LicenseManagerImpressionEvent.MatchesTableResultsImpressionEvent,
      {
        ...analyticsContext,
        loadedResultCount: allAgreementCandidates.length,
        hasNextPage: candidatesQuery.hasNextPage ?? false,
      },
      analyticsContextDedupeKey,
    );
  }, [
    allAgreementCandidates.length,
    analyticsContext,
    analyticsContextDedupeKey,
    candidatesQuery.hasNextPage,
    candidatesQuery.isFetching,
    candidatesQuery.isPlaceholderData,
    candidatesQuery.isSuccess,
    hasNoIpFamilies,
    hasNoMatches,
    logOnce,
  ]);

  useEffect(() => {
    if (
      !candidatesQuery.isSuccess ||
      candidatesQuery.isFetching ||
      candidatesQuery.isPlaceholderData ||
      !hasNoMatches
    ) {
      return;
    }

    const eventName = hasActiveFilters
      ? LicenseManagerImpressionEvent.EmptyStateMatchesTableNoMatchesWithAppliedFiltersImpressionEvent
      : LicenseManagerImpressionEvent.EmptyStateMatchesTableNoMatchesImpressionEvent;
    logOnce(eventName, analyticsContext, analyticsContextDedupeKey);
  }, [
    analyticsContext,
    analyticsContextDedupeKey,
    candidatesQuery.isFetching,
    candidatesQuery.isPlaceholderData,
    candidatesQuery.isSuccess,
    hasActiveFilters,
    hasNoMatches,
    logOnce,
  ]);

  let content;
  if (candidatesQuery.isPending || ipFamiliesReq.isPending || !isSettingsFetched) {
    content = (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  } else if (candidatesQuery.error != null || ipFamiliesReq.error != null) {
    const loadError = candidatesQuery.error ?? ipFamiliesReq.error;
    content = <IpLoadError error={loadError} />;
  } else if (hasNoMatches) {
    if (hasActiveFilters) {
      content = (
        <NoMatchesWithFiltersContent
          onResetFilters={handleResetFilters}
          openDialog={openDialog}
          maxLimit={maxManualRequestsLimit ?? 0}
        />
      );
    } else {
      content = <NoMatchesContent openDialog={openDialog} maxLimit={maxManualRequestsLimit ?? 0} />;
    }
  } else if (hasNoIpFamilies) {
    logOnce(LicenseManagerImpressionEvent.EmptyStateMatchesTableCreateIpFamilyImpressionEvent);
    content = <NoIpFamiliesContent />;
  } else {
    content = (
      <MatchesTable
        dataReq={candidatesQuery}
        onSelectMatch={handleSelectCandidate}
        agreementStatusesColumn={agreementStatusesColumn}
        selectedMatchId={isMatchPanelOpen ? (selectedCandidate?.id ?? undefined) : undefined}
        sortingEnabled={isIndexedMatchesEnabled}
        sortBy={sort.sortBy}
        sortDirection={sort.sortDirection}
        onSort={handleSort}
        onLoadMore={handleLoadMore}
      />
    );
  }

  return (
    <div>
      <div className={classes.filtersContainer}>
        <IpFamilyFilterChip
          selectedIpFamilyId={filters.ipFamilyId}
          onFilterChange={handleIpFamilyFilterChange}
        />
        <MatchCandidateOfferStatusFilterChip
          selected={filters.offerStatusFilter}
          onFilterChange={handleOfferStatusFilterChange}
        />
        <DauRangeFilterChip
          selectedRange={filters.dauRange}
          onFilterChange={handleDauRangeChange}
        />
        <LifetimeVisitsRangeFilterChip
          selectedRange={filters.lifetimeVisitsRange}
          onFilterChange={handleLifetimeVisitsRangeChange}
        />
        <ContentMaturityFilterChip
          selectedRatings={filters.contentMaturities}
          onFilterChange={handleContentMaturityChange}
        />
        <div className={classes.filterButtonContainer}>
          <Button
            ref={filterButtonRef}
            onClick={openFilterDrawer}
            endIcon={<FilterListIcon />}
            variant='outlined'
            color='inherit'
            aria-hidden={isSidePanelOpen ? true : undefined}
            tabIndex={isSidePanelOpen ? -1 : undefined}
            classes={{ root: classes.filterButtonRoot }}>
            {translate('Action.FilterBy')}
          </Button>
        </div>
      </div>

      <MatchesSidePanel
        open={filterDrawerOpen}
        onDismiss={closeFilterDrawer}
        testId='matches-filter-side-panel'
        ariaLabel={translate('Label.FilterByCategory')}
        dismissMode='filter'
        dismissTriggerRef={filterButtonRef}>
        <MatchesFilterPanel title={translate('Label.FilterByCategory')} onClose={closeFilterDrawer}>
          <MatchesFilterPanelContent
            selectedIpFamilyId={filters.ipFamilyId}
            selectedDauRange={filters.dauRange}
            selectedLifetimeVisitsRange={filters.lifetimeVisitsRange}
            selectedContentMaturities={filters.contentMaturities}
            selectedOfferStatusFilter={filters.offerStatusFilter}
            onIpFamilyChange={handleIpFamilyFilterChange}
            onDauRangeChange={handleDauRangeChange}
            onLifetimeVisitsRangeChange={handleLifetimeVisitsRangeChange}
            onContentMaturityChange={handleContentMaturityChange}
            onOfferStatusFilterChange={handleOfferStatusFilterChange}
          />
        </MatchesFilterPanel>
      </MatchesSidePanel>

      <MatchesSidePanel
        open={isMatchPanelOpen}
        onDismiss={handleCloseMatchPanel}
        testId='matches-side-panel'
        ariaLabel={matchPanelAriaLabel}
        dismissMode='match'>
        {selectedCandidate && currentMatchPanelView === MatchPanelView.Details && (
          <MatchDetailsPanelContent
            candidate={selectedCandidate}
            onClose={handleCloseMatchPanel}
            onOfferLicense={handleOfferLicense}
            agreementStatusFromList={matchPanelAgreementStatus}
            navigation={matchDetailsNavigation}
          />
        )}
        {selectedCandidate && currentMatchPanelView === MatchPanelView.Offer && (
          <MatchOfferPanelContent
            candidate={selectedCandidate}
            onSuccess={handleAgreementSuccess}
            onClose={handleCloseMatchPanel}
          />
        )}
      </MatchesSidePanel>

      {content}
    </div>
  );
};

export default Matches;
