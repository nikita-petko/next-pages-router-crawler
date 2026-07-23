import React, { FunctionComponent, useState, useRef, useMemo, useCallback } from 'react';
import {
  Grid,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  FilterListIcon,
  Alert,
  AlertTitle,
  Link,
} from '@rbx/ui';
import { PageResponse, PagingParameters } from '@rbx/core';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  urls,
  ClickableSearchIcon,
  Item as ItemType,
  PageLoading,
} from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import translationRoleClient from '@modules/clients/translationRoles';
import { gamesClient } from '@modules/clients';
import { useSettings } from '@modules/settings';

import { ItemGridContainer, ItemCardContainer, CreationData } from '@modules/creations/common';

import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { HubMeta } from '@rbx/creator-hub-history';
import TranslatorGamesSortingOptions from '../enums/TranslatorGamesSortingOptions';
import { formatTranslatorGames } from '../implementations/translatorPortalHelpers';
import { maxNumberOfGameToFetch } from '../constants';
import { maxRetryTimes } from '../../gameStringTranslation/constants';

const {
  creatorHub: { docs },
} = urls;

export interface TranslatorPortalPagingParameters extends PagingParameters {
  sortingOption: TranslatorGamesSortingOptions;
  searchKeyword: string;
}

const TranslatorPortalContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const currentGroup = useCurrentGroup();
  const { settings } = useSettings();
  const { translate, translateHTML } = useTranslation();
  const { error } = useMetricsMonitoring();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [shouldShowWarning, setShouldShowWarning] = useState<boolean>(false);
  const [isLoadingGameDetails, setIsLoadingGameDetails] = useState<boolean>(false);
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const [translatorGameData, setTranslatorGameData] = useState<Map<number, CreationData> | null>(
    null,
  );
  const [sortingOption, setSortingOption] = useState<TranslatorGamesSortingOptions>(
    TranslatorGamesSortingOptions.Alphabetical,
  );

  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const handleToggleMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleSelectSortingOption = useCallback((option: TranslatorGamesSortingOptions) => {
    setSortingOption(option);
    setIsMenuOpen(false);
  }, []);

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
  }, []);

  const pagingParameters = useMemo(() => {
    return {
      sortingOption,
      searchKeyword,
    } as TranslatorPortalPagingParameters;
  }, [sortingOption, searchKeyword]);

  const recursivelyLoadTranslatorGames = useCallback(
    async (
      nextPageCursor: string | undefined,
      retryTimes: number,
      groupId: number | undefined,
      newGameDetailsMap: Map<number, CreationData>,
    ) => {
      if (typeof nextPageCursor === 'undefined') {
        setTranslatorGameData(newGameDetailsMap);
        setIsLoadingGameDetails(false);
        setShouldShowWarning(true);
        return;
      }
      if (retryTimes <= 0) {
        setTranslatorGameData(newGameDetailsMap);
        setIsLoadingGameDetails(false);
        setShouldShowWarning(true);
        error('TranslatorPortalContainer - failed to load translated game data');
        throw new Error('failed to load translated game data');
      }
      try {
        setTranslatorGameData(null);
        setIsLoadingGameDetails(true);
        // fetch gameIds that translators have access to
        const response = await translationRoleClient.getCurrentTranslatorGames(
          nextPageCursor,
          maxNumberOfGameToFetch,
          groupId,
        );
        if (response?.games === undefined) {
          throw new Error('Games API returned an undefined response');
        }
        if (response.games.length > 0 || response.games !== undefined) {
          const { games } = response;
          try {
            // filter gameIds to make sure they are non-null
            // and game details have not already been fetched before
            const gameIds: number[] = games
              .map((game) => game.gameId)
              .filter(
                (gameId): gameId is number => typeof gameId !== 'undefined' && gameId !== null,
              )
              .filter((gameId) => !translatorGameData?.has(gameId));

            if (gameIds.length > 0) {
              // fetch actual game details
              const gameDetails = await gamesClient.getDetails(gameIds);
              if (typeof gameDetails.data === 'undefined') {
                setShouldShowWarning(false);
                setIsLoadingGameDetails(false);
                error('TranslatorPortalContainer - failed to load translated game data');
                throw new Error('failed to load translated game data');
              }
              gameDetails.data.forEach((gameDetail) => {
                if (gameDetail.id !== undefined) {
                  const creationData = {
                    itemType: ItemType.TranslatorGame,
                    isClickable: true,
                    universeId: gameDetail.id,
                    name: gameDetail.name,
                    creatorName: gameDetail.creator?.name,
                  };
                  newGameDetailsMap.set(gameDetail.id, creationData);
                }
              });
            }
          } catch (e) {
            setShouldShowWarning(true);
            setIsLoadingGameDetails(false);
            error('Failed to load translator games');
            throw e;
          }
          await recursivelyLoadTranslatorGames(
            response.nextPageCursor,
            maxRetryTimes,
            groupId,
            newGameDetailsMap,
          );
        } else {
          // terminate the recursive calls
          await recursivelyLoadTranslatorGames(undefined, 0, groupId, newGameDetailsMap);
        }
      } catch {
        // retry if there was an earlier error
        await recursivelyLoadTranslatorGames(
          nextPageCursor,
          retryTimes - 1,
          groupId,
          newGameDetailsMap,
        );
      }
    },
    [error, translatorGameData],
  );

  const loadTranslatorGames = useCallback(
    async (parameters: TranslatorPortalPagingParameters): Promise<PageResponse<CreationData>> => {
      if (translatorGameData === null) {
        const groupId = currentGroup?.id ?? 0;
        const isGroup =
          settings.enableResourceListNewArrakisBehavior && currentGroup != null && groupId > 0;
        await recursivelyLoadTranslatorGames(
          '',
          maxRetryTimes,
          isGroup ? groupId : undefined,
          new Map(),
        );
      }
      return Promise.resolve({
        items: formatTranslatorGames(Array.from(translatorGameData!.values()), parameters),
      });
    },
    [
      translatorGameData,
      currentGroup,
      settings.enableResourceListNewArrakisBehavior,
      recursivelyLoadTranslatorGames,
    ],
  );

  // show the spinning wheel if game details are still loading
  const content = useMemo(() => {
    return isLoadingGameDetails ? (
      <PageLoading />
    ) : (
      <ItemGridContainer
        pagingParameters={pagingParameters}
        loadItems={loadTranslatorGames}
        getItemKey={(item) => item.universeId ?? 0}
        GridItemComponent={ItemCardContainer}
        errorMessage={translate('Message.FailToLoadPage')}
        emptyMessage={
          <EmptyState
            size='large'
            illustration='localization'
            title={translate('Message.NoExperiencesAdded')}
            description={translateHTML('Message.EmptyStateDescription', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link target='_blank' href={docs.getLocalizationGuideUrl()}>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          />
        }
      />
    );
  }, [isLoadingGameDetails, loadTranslatorGames, pagingParameters, translate, translateHTML]);

  const {
    params: { enableIAM2 },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);

  return (
    <section>
      <HubMeta title={translate('Heading.Localization')} />
      <Grid container direction='row'>
        <Grid container direction='column'>
          <Grid container direction='row' alignItems='center' wrap='nowrap'>
            {!enableIAM2 && (
              <Grid item container justifyContent='flex-start'>
                <Typography variant='h1'>{translate('Heading.Localization')}</Typography>
              </Grid>
            )}
            <Grid item container justifyContent='flex-end'>
              <ClickableSearchIcon onSearch={handleSearch} />
              <IconButton
                aria-label='filter'
                onClick={handleToggleMenu}
                ref={anchorButtonRef}
                size='large'>
                <FilterListIcon color='secondary' fontSize='medium' />
              </IconButton>
              <Menu
                anchorEl={anchorButtonRef.current}
                open={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}>
                <MenuItem
                  selected={sortingOption === TranslatorGamesSortingOptions.Alphabetical}
                  onClick={() =>
                    handleSelectSortingOption(TranslatorGamesSortingOptions.Alphabetical)
                  }>
                  {translate('Label.SortOptionAlphabetical')}
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
          {shouldShowWarning && (
            <Grid>
              <Alert onClose={() => setShouldShowWarning(false)} severity='info'>
                <AlertTitle>{translate('Label.TranslatorAccessWarning')}</AlertTitle>
                {translateHTML('Message.TranslatorAccessWarning', [
                  {
                    opening: 'startLink',
                    closing: 'endLink',
                    content(chunks) {
                      return (
                        <Link
                          target='_blank'
                          href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/roadmap`}>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ])}
              </Alert>
            </Grid>
          )}
        </Grid>
        {content}
      </Grid>
    </section>
  );
};

export default withTranslation(TranslatorPortalContainer, [
  TranslationNamespace.TranslatorPortal,
  TranslationNamespace.Navigation,
]);
