import React from 'react';
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
} from '@rbx/ui';
import { useTranslation, withTranslation, useLocalization, Locale } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { getPrettifiedNumber, number } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ClaimItemDiscoveredFromEnum,
  SearchContentContentTypeEnum,
  Match as RightsMatch,
} from '@rbx/clients/rightsV1';
import { Pagination, PaginationProps } from '@modules/miscellaneous/common';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';

import useCart from './useCart';
import Match from './Match';
import ExperienceContentTile from './ExperienceContentTile';
import useVisitCount from './useVisitCount';
import { SearchSource } from './SearchEnums';

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
}));

interface ExperienceRowProps {
  match: RightsMatch;
  cart: ReturnType<typeof useCart>;
  experienceContent: Match;
  handleRowSelect: (rowContent: Match) => void;
  gameDetails: RobloxGamesApiModelsResponsePlaceDetails;
}

// ExperienceRow is a row in the experiences table
const ExperienceRow = ({
  match,
  experienceContent,
  cart,
  handleRowSelect,
  gameDetails,
}: ExperienceRowProps) => {
  const { classes } = useStyles();
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
    </TableRow>
  );
};

interface ExperiencesTableProps {
  cart: ReturnType<typeof useCart>;
  matches: RightsMatch[];
  placeToGameDetailsMap: Map<string, RobloxGamesApiModelsResponsePlaceDetails>;
  paginationProps: PaginationProps;
}

// ExperiencesTable is the table of potential infringing experiences that the user can create a claim for
const ExperiencesTable = ({
  cart,
  matches,
  placeToGameDetailsMap,
  paginationProps,
}: ExperiencesTableProps) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const { hasItem, add, remove, update } = cart;

  const isEmpty = matches?.length === 0;

  const experienceToCartContent = (experienceId: string) => {
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
    };
  };

  const onSelectAllClick = () => {
    const currentMatches =
      matches?.map((match) => experienceToCartContent(match.infringingContentId ?? '')) ?? [];

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
                    !isEmpty &&
                    matches?.every((match) =>
                      hasItem(experienceToCartContent(match.infringingContentId ?? '')),
                    )
                  }
                  onChange={onSelectAllClick}
                />
              </TableCell>
              <TableCell className={classes.experienceColumn}>{translate('Label.Games')}</TableCell>
              <TableCell>{translate('Label.ExperienceDescription')}</TableCell>
              <TableCell>{translate('Heading.Visits')}</TableCell>
              <TableCell>{translate('Label.DateMatched')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches?.map((match) => (
              <ExperienceRow
                key={match.id}
                match={match}
                experienceContent={experienceToCartContent(match.infringingContentId ?? '')}
                gameDetails={placeToGameDetailsMap.get(match.infringingContentId ?? '') ?? {}}
                cart={cart}
                handleRowSelect={update}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!isEmpty && <Pagination {...paginationProps} />}
    </div>
  );
};

export default withTranslation(ExperiencesTable, [
  TranslationNamespace.RightsPortal,
  TranslationNamespace.Creations,
]);
