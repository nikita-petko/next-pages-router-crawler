import React from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Button,
  makeStyles,
  Skeleton,
} from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import type { AgreementCandidateResponse } from '@rbx/clients/contentLicensingApi/v1';
import IpTableRow from '../../../components/IpTableRow';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { UseMatchesQueryResult } from '../hooks/useMatchesQuery';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import { getContentMaturityLabelFromEnum } from '../../utils/maturityRating';
import CellError from '../../../components/error/CellError';

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

interface MatchRowProps {
  match: AgreementCandidateResponse;
  onSelectMatch: (match: AgreementCandidateResponse) => void;
}

/**
 * A row component for a single match
 */
const MatchRow: React.FC<MatchRowProps> = ({ match, onSelectMatch }) => {
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

  if (gameRequest.isPending || isMaturityPending || ipFamilyRequest.isPending) {
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
            <div>
              <Skeleton variant='text' width={80} />
              <Skeleton variant='text' width={80} />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton variant='text' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' />
        </TableCell>
      </IpTableRow>
    );
  }

  if (gameRequest.error) {
    return (
      <IpTableRow>
        <TableCell colSpan={6}>
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
            {translate('Error.ExperienceNotAvailable', { id: match.candidateId || '' })}
          </div>
        </TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>
          <Typography color='secondary'>
            {formatDate(match.discoveredAt!, locale ?? Locale.English)}
          </Typography>
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
    contentMaturity = maturityRequest.data || translate('Label.MaturityRatingNoneAvailable');
  }

  const creatorName = gameRequest.data?.creator?.name;
  const ipFamilyName = ipFamilyRequest.data?.name || translate('Label.Unknown');

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell className={classes.experienceColumn}>
        <div className={classes.experienceCell}>
          <Thumbnail2d
            alt={gameRequest.data?.name || ''}
            targetId={Number(experienceId)}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._50x50}
            skeletonVariant='square'
            containerClass={classes.thumbnailContainer}
            type={ThumbnailTypes.gameIcon}
          />
          <div>
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
      <TableCell>{translate(getCreationDauRangeLabelFromEnum(match.dau7DayBucket))}</TableCell>
      <TableCell>
        {translate(
          getLifetimeVisitsRangeLabelFromEnum(match.creatorLifetimeVisitBucket ?? undefined),
        )}
      </TableCell>
      <TableCell>{contentMaturity}</TableCell>
      <TableCell>{formatDate(match.discoveredAt!, locale ?? Locale.English)}</TableCell>
    </IpTableRow>
  );
};

interface MatchesTableProps {
  dataReq: UseMatchesQueryResult;
  onSelectMatch: (match: AgreementCandidateResponse) => void;
}

/**
 * Table showing experience matches, also know as agreement candidates, to IPH.
 */
const MatchesTable: React.FC<MatchesTableProps> = ({ dataReq, onSelectMatch }) => {
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
              <TableCell>{translate('Label.DauRange')}</TableCell>
              <TableCell>{translate('Label.LifetimeVisitsRange')}</TableCell>
              <TableCell>{translate('Label.ContentMaturity')}</TableCell>
              <TableCell>{translate('Label.DateMatched')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allAgreementCandidates.map((match) => (
              <MatchRow key={match.id} match={match} onSelectMatch={onSelectMatch} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasNextPage && (
        <div className={classes.loadMoreContainer}>
          <Button
            onClick={() => fetchNextPage()}
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
