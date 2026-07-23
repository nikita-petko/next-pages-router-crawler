import React from 'react';
import type { AgreementCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import {
  AgreementCandidateIndexSortBy,
  AgreementCandidateIndexSortDirection,
} from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Typography,
  Button,
  makeStyles,
  Skeleton,
} from '@rbx/ui';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import CellError from '../../../components/error/CellError';
import IpTableRow from '../../../components/IpTableRow';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import { getContentMaturityLabelFromEnum } from '../../utils/maturityRating';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import type { UseMatchesQueryResult } from '../hooks/useMatchesQuery';
import IphMatchStatusLabel, { type AgreementStatusesColumnProps } from './IphMatchStatusLabel';

const useStyles = makeStyles()(() => ({
  experienceColumn: {
    minWidth: 184,
    '@media (max-width: 800px)': {
      minWidth: 125,
    },
  },
  experienceCell: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    '@media (max-width: 800px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  thumbnailContainer: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: 'block',
    padding: 0,
  },
  authorName: {
    marginTop: 4,
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: 16,
  },
}));

export type { AgreementStatusesColumnProps };

/** Foundation Tailwind: flex text column so % skeleton widths resolve in `experienceCell` flex row. */
const experienceCellTextClassName =
  'grow-1 min-width-0 basis-0 max-[800px]:grow-0 max-[800px]:shrink-0 max-[800px]:width-full';

interface MatchRowProps {
  match: AgreementCandidateResponse;
  onSelectMatch: (match: AgreementCandidateResponse) => void;
  agreementStatusesColumn?: AgreementStatusesColumnProps;
  isSelected?: boolean;
}

/**
 * A row component for a single match
 */
const MatchRow: React.FC<MatchRowProps> = ({
  match,
  onSelectMatch,
  agreementStatusesColumn,
  isSelected,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const experienceId = Number(match.candidateId);

  // Use match prop values if available to skip API calls
  const hasContentMaturityFromMatch = match.universeContentMaturity !== undefined;

  const gameRequest = useDebouncedGameDetails(experienceId);
  const maturityRequest = useDebouncedContentMaturity(experienceId);
  const ipFamilyRequest = useIpFamilyQuery(match.ipFamilyId ?? undefined);

  const handleActivate = () => {
    onSelectMatch(match);
  };

  // Skip pending checks for data that's already available from the match prop
  const isMaturityPending = !hasContentMaturityFromMatch && maturityRequest.isPending;

  const isRevalidatingUnavailableGame =
    gameRequest.data === NO_GAME_FOUND_FOR_ID && gameRequest.isFetching;

  if (
    gameRequest.isPending ||
    isRevalidatingUnavailableGame ||
    isMaturityPending ||
    ipFamilyRequest.isPending
  ) {
    return (
      <IpTableRow>
        <TableCell className={classes.experienceColumn}>
          <div className={classes.experienceCell}>
            <Skeleton
              variant='square'
              width={42}
              height={42}
              className={classes.thumbnailContainer}
              animate
            />
            <div className={experienceCellTextClassName}>
              <Skeleton variant='text' animate width='50%' />
              <Skeleton variant='text' animate width='50%' />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        {agreementStatusesColumn && (
          <TableCell>
            <Skeleton variant='text' animate width='50%' />
          </TableCell>
        )}
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
      </IpTableRow>
    );
  }

  if (gameRequest.error) {
    return (
      <IpTableRow>
        <TableCell colSpan={agreementStatusesColumn ? 7 : 6}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  if (gameRequest.data === NO_GAME_FOUND_FOR_ID) {
    return (
      <IpTableRow>
        <TableCell className={classes.experienceColumn}>
          <div className={classes.experienceCell}>
            {translate('Error.ExperienceNotAvailable', {
              id: match.candidateId ?? '',
            })}
          </div>
        </TableCell>
        <TableCell>-</TableCell>
        {agreementStatusesColumn && <TableCell>-</TableCell>}
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>
          {match.discoveredAt ? formatDate(match.discoveredAt, locale ?? Locale.English) : '-'}
        </TableCell>
      </IpTableRow>
    );
  }

  // Use content maturity from match prop if available, otherwise fall back to API call
  let contentMaturity = '';
  if (hasContentMaturityFromMatch) {
    contentMaturity = translate(getContentMaturityLabelFromEnum(match.universeContentMaturity));
  } else if (maturityRequest.error || maturityRequest.data === NO_CONTENT_MATURITY_FOUND_FOR_ID) {
    contentMaturity = translate('Label.MaturityRatingNoneAvailable');
  } else {
    contentMaturity = maturityRequest.data ?? translate('Label.MaturityRatingNoneAvailable');
  }

  const creatorName = gameRequest.data?.creator?.name;
  const ipFamilyName = ipFamilyRequest.data?.name ?? translate('Label.Unknown');

  return (
    <IpTableRow onActivate={handleActivate} isSelected={isSelected}>
      <TableCell className={classes.experienceColumn}>
        <div className={classes.experienceCell}>
          <Thumbnail2d
            alt={gameRequest.data?.name ?? ''}
            targetId={experienceId}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._50x50}
            skeletonVariant='square'
            containerClass={classes.thumbnailContainer}
            type={ThumbnailTypes.gameIcon}
          />
          <div className={experienceCellTextClassName}>
            <Typography component='div' variant='body2'>
              {gameRequest.data?.name}
            </Typography>
            <Typography
              variant='caption'
              color='secondary'
              className={classes.authorName}
              component='div'>
              {creatorName ? `@${creatorName}` : ''}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell>{ipFamilyName}</TableCell>
      {agreementStatusesColumn && (
        <IphMatchStatusLabel agreementId={match.agreementId} column={agreementStatusesColumn} />
      )}
      <TableCell>{translate(getCreationDauRangeLabelFromEnum(match.dau7DayBucket))}</TableCell>
      <TableCell>
        {translate(
          getLifetimeVisitsRangeLabelFromEnum(match.creatorLifetimeVisitBucket ?? undefined),
        )}
      </TableCell>
      <TableCell>{contentMaturity}</TableCell>
      <TableCell>
        {match.discoveredAt
          ? formatDate(match.discoveredAt, locale ?? Locale.English)
          : translate('Label.Unknown')}
      </TableCell>
    </IpTableRow>
  );
};

interface MatchesTableProps {
  dataReq: UseMatchesQueryResult;
  onSelectMatch: (match: AgreementCandidateResponse) => void;
  agreementStatusesColumn?: AgreementStatusesColumnProps;
  selectedMatchId?: string;
  sortingEnabled?: boolean;
  sortBy?: AgreementCandidateIndexSortBy;
  sortDirection?: AgreementCandidateIndexSortDirection;
  onSort?: (sortBy: AgreementCandidateIndexSortBy) => void;
  onLoadMore?: () => void;
}

interface SortableMatchesHeaderProps {
  label: string;
  sortKey: AgreementCandidateIndexSortBy;
  sortingEnabled: boolean;
  activeSortBy?: AgreementCandidateIndexSortBy;
  sortDirection?: AgreementCandidateIndexSortDirection;
  onSort?: (sortBy: AgreementCandidateIndexSortBy) => void;
}

const SortableMatchesHeader = ({
  label,
  sortKey,
  sortingEnabled,
  activeSortBy,
  sortDirection,
  onSort,
}: SortableMatchesHeaderProps) => {
  if (!sortingEnabled || !onSort) {
    return <TableCell>{label}</TableCell>;
  }

  const isActive = activeSortBy === sortKey;
  const tableSortDirection =
    isActive && sortDirection === AgreementCandidateIndexSortDirection.Desc ? 'desc' : 'asc';

  return (
    <TableCell sortDirection={isActive ? tableSortDirection : false}>
      <TableSortLabel
        active={isActive}
        direction={tableSortDirection}
        onClick={() => onSort(sortKey)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );
};

/**
 * Table showing experience matches, also know as agreement candidates, to IPH.
 */
const MatchesTable: React.FC<MatchesTableProps> = ({
  dataReq,
  onSelectMatch,
  agreementStatusesColumn,
  selectedMatchId,
  sortingEnabled = false,
  sortBy,
  sortDirection,
  onSort,
  onLoadMore,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const { allAgreementCandidates, fetchNextPage, hasNextPage, isFetchingNextPage } = dataReq;

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={classes.experienceColumn}>
                {translate('Label.Experience')}
              </TableCell>
              <TableCell>{translate('Label.IpFamily')}</TableCell>
              {agreementStatusesColumn && <TableCell>{translate('Label.Status')}</TableCell>}
              <SortableMatchesHeader
                label={translate('Label.DauRange')}
                sortKey={AgreementCandidateIndexSortBy.Dau7DayBucket}
                sortingEnabled={sortingEnabled}
                activeSortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableMatchesHeader
                label={translate('Label.LifetimeVisitsRange')}
                sortKey={AgreementCandidateIndexSortBy.CreatorLifetimeVisitBucket}
                sortingEnabled={sortingEnabled}
                activeSortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableMatchesHeader
                label={translate('Label.ContentMaturity')}
                sortKey={AgreementCandidateIndexSortBy.ContentMaturity}
                sortingEnabled={sortingEnabled}
                activeSortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableMatchesHeader
                label={translate('Label.DateMatched')}
                sortKey={AgreementCandidateIndexSortBy.DiscoveredAt}
                sortingEnabled={sortingEnabled}
                activeSortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {allAgreementCandidates.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                onSelectMatch={onSelectMatch}
                agreementStatusesColumn={agreementStatusesColumn}
                isSelected={selectedMatchId != null && match.id === selectedMatchId}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasNextPage && (
        <div className={classes.loadMoreContainer}>
          <Button
            onClick={() => {
              onLoadMore?.();
              void fetchNextPage();
            }}
            disabled={isFetchingNextPage}
            variant='outlined'
            color='secondary'>
            {isFetchingNextPage ? translate('Label.Loading') : translate('Action.LoadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchesTable;
