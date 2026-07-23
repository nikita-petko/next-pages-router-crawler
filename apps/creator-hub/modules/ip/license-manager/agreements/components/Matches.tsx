import React, { useState, useRef } from 'react';
import { makeStyles, CircularProgress, Drawer, Button, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { AgreementCandidateResponse } from '@rbx/clients/contentLicensingApi/v1';
import { UniverseContentMaturity } from '@rbx/clients/contentLicensingApi/v1';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { FilterDrawerButton } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import Link from 'next/link';
import { useSettings } from '@modules/settings';

import { useMatchesQuery } from '../hooks/useMatchesQuery';
import MatchesTable from './MatchesTable';
import IpFamilyFilterChip from './IpFamilyFilterChip';
import MatchOfferDrawerContent from './MatchOfferDrawerContent';
import MatchDetailsDrawerContent from './MatchDetailsDrawerContent';
import DauRangeFilterChip, { DauRange } from './DauRangeFilterChip';
import LifetimeVisitsRangeFilterChip, {
  LifetimeVisitsRange,
} from './LifetimeVisitsRangeFilterChip';
import ContentMaturityFilterChip from './ContentMaturityFilterChip';
import MatchesFilterDrawerContent from './MatchesFilterDrawerContent';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import IpLoadError from '../../../components/error/IpLoadError';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
  useLicenseManagerLoggerLogOnce,
} from '../../utils/logger';
import { IP_FAMILIES_HREF, IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';

const TOP_NAV_HEIGHT_WITH_BORDER = 61;

enum DrawerType {
  None = 'none',
  MatchDetails = 'matchDetails',
  Agreement = 'agreement',
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
  drawer: {
    width: 'min(640px, 95vw)',
    padding: theme.spacing(3),
    paddingTop: TOP_NAV_HEIGHT_WITH_BORDER + 24,
  },
  filterButtonContainer: {
    marginLeft: 'auto',
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
}));

// TODO - aquach - clean up isManualRequestEnabled alongside settings.enableIpPlatformManualMatchRequests
const NoMatchesWithFiltersContent = ({
  onResetFilters,
  openDialog,
  maxLimit,
  isManualRequestEnabled = false,
}: {
  onResetFilters: () => void;
  openDialog?: () => void;
  maxLimit: number;
  isManualRequestEnabled?: boolean;
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return isManualRequestEnabled ? (
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
  ) : (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Label.NoMatchesFound')}
        size='small'
        description={translate('Description.NoMatchesFoundWithFilters')}>
        <Button onClick={onResetFilters} color='primaryBrand' variant='contained'>
          {translate('Action.ResetFilters')}
        </Button>
      </EmptyState>
    </EmptyStateBorder>
  );
};

// TODO - aquach - clean up isManualRequestEnabled alongside settings.enableIpPlatformManualMatchRequests
const NoMatchesContent = ({
  openDialog,
  maxLimit,
  isManualRequestEnabled = false,
}: {
  openDialog?: () => void;
  maxLimit: number;
  isManualRequestEnabled?: boolean;
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return isManualRequestEnabled ? (
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
  ) : (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Label.NoMatchesFound')}
        size='small'
        description={translate('Description.NoMatchesFound')}
      />
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

const Matches: React.FC<MatchesProps> = ({ maxManualRequestsLimit, openDialog }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    ipFamilyId: undefined as string | undefined,
    dauRange: undefined as DauRange | undefined,
    lifetimeVisitsRange: undefined as LifetimeVisitsRange | undefined,
    contentMaturities: [] as UniverseContentMaturity[],
  });

  const [selectedCandidate, setSelectedCandidate] = useState<
    AgreementCandidateResponse | undefined
  >(undefined);

  const [currentDrawer, setCurrentDrawer] = useState<DrawerType>(DrawerType.None);

  const ipFamiliesReq = useIpFamiliesQuery();
  const candidatesQuery = useMatchesQuery({
    pageSize: 50,
    ipFamilyId: filters.ipFamilyId,
    dauRange: filters.dauRange,
    lifetimeVisitsRange: filters.lifetimeVisitsRange,
    contentMaturityRatings:
      filters.contentMaturities.length === 0 ? undefined : filters.contentMaturities,
  });

  const { allAgreementCandidates } = candidatesQuery;

  const hasActiveFilters =
    filters.ipFamilyId ||
    filters.dauRange ||
    filters.lifetimeVisitsRange ||
    filters.contentMaturities.length > 0;
  const hasNoMatches = allAgreementCandidates.length === 0;
  const hasNoIpFamilies = ipFamiliesReq.data?.ipFamilies.length === 0;

  const handleIpFamilyFilterChange = (selectedId: string | undefined) => {
    logEvent(LicenseManagerClickEvent.MatchesTableIpFamilyFilterClickEvent);
    setFilters((prev) => ({ ...prev, ipFamilyId: selectedId }));
  };

  const handleDauRangeChange = (range: DauRange | undefined) => {
    logEvent(LicenseManagerClickEvent.MatchesTableDauRangeFilterClickEvent);
    setFilters((prev) => ({ ...prev, dauRange: range }));
  };

  const handleLifetimeVisitsRangeChange = (range: LifetimeVisitsRange | undefined) => {
    logEvent(LicenseManagerClickEvent.MatchesTableLifetimeVisitsRangeFilterClickEvent);
    setFilters((prev) => ({ ...prev, lifetimeVisitsRange: range }));
  };

  const handleContentMaturityChange = (ratings: UniverseContentMaturity[]) => {
    logEvent(LicenseManagerClickEvent.MatchesTableContentMaturityFilterClickEvent);
    setFilters((prev) => ({ ...prev, contentMaturities: ratings }));
  };

  const handleResetFilters = () => {
    logEvent(LicenseManagerClickEvent.MatchesTableClearFiltersClickEvent);
    setFilters({
      ipFamilyId: undefined,
      dauRange: undefined,
      lifetimeVisitsRange: undefined,
      contentMaturities: [],
    });
  };

  const handleSelectCandidate = (candidate: AgreementCandidateResponse) => {
    logEvent(LicenseManagerClickEvent.ViewAgreementCandidateClickEvent, {
      candidate: candidate.id!,
    });
    setSelectedCandidate(candidate);
    setCurrentDrawer(DrawerType.MatchDetails);
  };

  const handleCloseDrawer = () => {
    setCurrentDrawer(DrawerType.None);
  };

  const handleOfferLicense = () => {
    setCurrentDrawer(DrawerType.Agreement);
  };

  const handleAgreementSuccess = () => {
    setCurrentDrawer(DrawerType.None);
  };

  let content;
  if (candidatesQuery.isPending || ipFamiliesReq.isPending || !isSettingsFetched) {
    content = (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  } else if (candidatesQuery.error || ipFamiliesReq.error) {
    content = <IpLoadError error={candidatesQuery.error || ipFamiliesReq.error!} />;
  } else if (hasNoMatches) {
    if (hasActiveFilters) {
      logOnce(
        LicenseManagerImpressionEvent.EmptyStateMatchesTableNoMatchesWithAppliedFiltersImpressionEvent,
      );
      content = (
        <NoMatchesWithFiltersContent
          onResetFilters={handleResetFilters}
          openDialog={openDialog}
          maxLimit={maxManualRequestsLimit!}
          isManualRequestEnabled={settings.enableIpPlatformManualMatchRequests}
        />
      );
    } else {
      logOnce(LicenseManagerImpressionEvent.EmptyStateMatchesTableNoMatchesImpressionEvent);
      content = (
        <NoMatchesContent
          openDialog={openDialog}
          maxLimit={maxManualRequestsLimit!}
          isManualRequestEnabled={settings.enableIpPlatformManualMatchRequests}
        />
      );
    }
  } else if (hasNoIpFamilies) {
    logOnce(LicenseManagerImpressionEvent.EmptyStateMatchesTableCreateIpFamilyImpressionEvent);
    content = <NoIpFamiliesContent />;
  } else {
    content = <MatchesTable dataReq={candidatesQuery} onSelectMatch={handleSelectCandidate} />;
  }

  return (
    <div ref={containerRef}>
      <div className={classes.filtersContainer}>
        <IpFamilyFilterChip
          selectedIpFamilyId={filters.ipFamilyId}
          onFilterChange={handleIpFamilyFilterChange}
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
          <FilterDrawerButton
            buttonLabel={translate('Action.FilterBy') as FormattedText}
            drawerTitle={translate('Label.FilterByCategory') as FormattedText}
            getDrawerContainer={() => containerRef.current}
            filterDrawerContent={
              <MatchesFilterDrawerContent
                selectedIpFamilyId={filters.ipFamilyId}
                selectedDauRange={filters.dauRange}
                selectedLifetimeVisitsRange={filters.lifetimeVisitsRange}
                selectedContentMaturities={filters.contentMaturities}
                onIpFamilyChange={handleIpFamilyFilterChange}
                onDauRangeChange={handleDauRangeChange}
                onLifetimeVisitsRangeChange={handleLifetimeVisitsRangeChange}
                onContentMaturityChange={handleContentMaturityChange}
              />
            }
          />
        </div>
      </div>
      {content}

      <Drawer
        anchor='right'
        open={currentDrawer !== DrawerType.None}
        onClose={handleCloseDrawer}
        classes={{ paper: classes.drawer }}>
        {selectedCandidate && currentDrawer === DrawerType.MatchDetails && (
          <MatchDetailsDrawerContent
            candidate={selectedCandidate}
            onClose={handleCloseDrawer}
            onOfferLicense={handleOfferLicense}
          />
        )}
        {selectedCandidate && currentDrawer === DrawerType.Agreement && (
          <MatchOfferDrawerContent
            candidate={selectedCandidate}
            onSuccess={handleAgreementSuccess}
            onClose={handleCloseDrawer}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Matches;
