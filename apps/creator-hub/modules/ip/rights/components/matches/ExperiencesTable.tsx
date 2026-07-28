import { useState } from 'react';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import type { Match as RightsMatch } from '@rbx/client-rights/v1';
import { ClaimItemDiscoveredFromEnum, SearchContentContentTypeEnum } from '@rbx/client-rights/v1';
import { getPrettifiedNumber, number } from '@rbx/core';
import { useTranslation, withTranslation, useLocalization, Locale } from '@rbx/intl';
import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  makeStyles,
  Checkbox,
  IconButton,
  Tooltip,
  CloseIcon,
} from '@rbx/ui';
import type { PaginationProps } from '@modules/miscellaneous/components';
import { Pagination } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import ExperienceContentTile from './ExperienceContentTile';
import type Match from './Match';
import RejectMatchDialog from './RejectMatchDialog';
import { SearchSource } from './SearchEnums';
import type useCart from './useCart';
import useVisitCount from './useVisitCount';

const useStyles = makeStyles()(() => ({
  experienceColumn: {
    minWidth: 125,
    '@media (max-width: 800px)': {
      minWidth: 125,
    },
    maxWidth: 150,
  },
  descriptionColumn: {
    minWidth: 150,
    maxWidth: 300,
  },
  descriptionText: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  selectedRow: {
    backgroundColor: 'rgba(187, 194, 209, 0.12)',
  },
  tableRow: {
    cursor: 'pointer',
  },
  actionCell: {
    width: 48,
  },
}));

interface ExperienceRowProps {
  match: RightsMatch;
  cart: ReturnType<typeof useCart>;
  experienceContent: Match;
  handleRowSelect: (rowContent: Match) => void;
  gameDetails: RobloxGamesApiModelsResponsePlaceDetails;
  onRejectMatch: (matchId: string, content: Match) => void;
}

const ExperienceRow = ({
  match,
  experienceContent,
  cart,
  handleRowSelect,
  gameDetails,
  onRejectMatch,
}: ExperienceRowProps) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { url: universeUrl, description: gameDetailsDescription } = gameDetails;
  const { visitCount } = useVisitCount(match.accountId ?? '', match.id ?? '');
  const isSelected = cart.hasItem(experienceContent);

  return (
    <TableRow className={`${isSelected ? classes.selectedRow : ''} ${classes.tableRow}`}>
      <TableCell padding='checkbox'>
        <Checkbox
          color='secondary'
          checked={isSelected}
          onChange={() => handleRowSelect(experienceContent)}
        />
      </TableCell>
      <TableCell className={classes.experienceColumn}>
        <ExperienceContentTile
          content={experienceContent.searchContent}
          url={universeUrl ?? ''}
          inRow
        />
      </TableCell>
      <TableCell className={classes.descriptionColumn}>
        <div className={classes.descriptionText}>
          <Typography variant='body2'>{gameDetailsDescription}</Typography>
        </div>
      </TableCell>
      <TableCell>{getPrettifiedNumber(visitCount, number.suffixNames.withPlus)}</TableCell>
      <TableCell>
        {match.createdAt ? formatDate(match.createdAt, locale ?? Locale.English) : ''}
      </TableCell>
      <TableCell className={classes.actionCell}>
        <Tooltip title={translate('Action.RejectMatch')}>
          <IconButton
            aria-label={translate('Action.RejectMatch')}
            color='secondary'
            onClick={(e) => {
              e.stopPropagation();
              onRejectMatch(match.id ?? '', experienceContent);
            }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

interface ExperiencesTableProps {
  cart: ReturnType<typeof useCart>;
  matches: RightsMatch[];
  placeToGameDetailsMap: Map<string, RobloxGamesApiModelsResponsePlaceDetails>;
  paginationProps: PaginationProps;
  accountId: string;
}

const ExperiencesTable = ({
  cart,
  matches,
  placeToGameDetailsMap,
  paginationProps,
  accountId,
}: ExperiencesTableProps) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { hasItem, add, remove, update } = cart;
  const [matchToReject, setMatchToReject] = useState<{
    id: string;
    content: Match;
  } | null>(null);

  const isEmpty = matches?.length === 0;

  const experienceToCartContent = (match: RightsMatch) => {
    const experienceId = match.infringingContentId ?? '';
    const gameDetails = placeToGameDetailsMap.get(experienceId);
    return {
      searchContent: {
        contentId: gameDetails?.universeRootPlaceId?.toString() ?? '',
        contentType: SearchContentContentTypeEnum.Asset,
        contentName: gameDetails?.name ?? '',
        creator: {
          displayName: gameDetails?.builder ?? '',
        },
      },
      discoveredFrom: ClaimItemDiscoveredFromEnum.Match,
      originalLink: gameDetails?.url ?? '',
      source: SearchSource.Experience,
      id: match.id ?? undefined,
    };
  };

  const onSelectAllClick = () => {
    const currentMatches = matches?.map((match) => experienceToCartContent(match)) ?? [];

    const allCurrentMatchesSelected = currentMatches.every((item) => hasItem(item));

    // If all matches on current page are selected, deselect all, otherwise select all
    if (allCurrentMatchesSelected && !isEmpty) {
      currentMatches.forEach((item) => {
        if (hasItem(item)) {
          remove(item);
        }
      });
    } else {
      currentMatches.forEach((item) => {
        if (!hasItem(item)) {
          add(item);
        }
      });
    }
  };

  return (
    <div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox'>
                <Checkbox
                  color='secondary'
                  checked={
                    !isEmpty && matches?.every((match) => hasItem(experienceToCartContent(match)))
                  }
                  onChange={onSelectAllClick}
                />
              </TableCell>
              <TableCell className={classes.experienceColumn}>{translate('Label.Games')}</TableCell>
              <TableCell>{translate('Label.ExperienceDescription')}</TableCell>
              <TableCell>{translate('Heading.Visits')}</TableCell>
              <TableCell>{translate('Label.DateMatched')}</TableCell>
              <TableCell className={classes.actionCell} />
            </TableRow>
          </TableHead>
          <TableBody>
            {matches?.map((match) => (
              <ExperienceRow
                key={match.id}
                match={match}
                experienceContent={experienceToCartContent(match)}
                gameDetails={placeToGameDetailsMap.get(match.infringingContentId ?? '') ?? {}}
                cart={cart}
                handleRowSelect={update}
                onRejectMatch={(matchId, content) => setMatchToReject({ id: matchId, content })}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!isEmpty && <Pagination {...paginationProps} />}
      {matchToReject !== null && (
        <RejectMatchDialog
          open
          onClose={() => setMatchToReject(null)}
          accountId={accountId}
          matchId={matchToReject.id}
          matchContent={matchToReject.content}
        />
      )}
    </div>
  );
};

export default withTranslation(ExperiencesTable, [
  TranslationNamespace.RightsPortal,
  TranslationNamespace.Creations,
]);
