import { FunctionComponent, useCallback, useState, useEffect } from 'react';
import { PagingParameters, SortOrder, StatusCodes } from '@rbx/core';
import { V1UniversesUniverseIdBadgesGetLimitEnum } from '@rbx/clients/badges';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  Alert,
  Grid,
  Collapse,
  Divider,
  Button,
  CircularProgress,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import { Item, Link, EmptyGrid, urls } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DropResult } from '@hello-pangea/dnd';
import { badgesClient } from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings';

import Router from 'next/router';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import useReorderBadgesContainerStyles from './ReorderBadgesContainer.style';
import Binning, { Orderable, OrderingBin } from '../../boundedBinning/BoundedBinning';
import DraggableListContainer, {
  DraggableListElementData,
} from './components/DraggableListContainer';
import badgeErrorCodeToDescription from '../../constants/badgeErrorCodesDescription';
import BadgesErrorCodes from '../../enums/BadgeErrorCodes';

const { getUrlForItemType } = urls;

export interface BadgesListPagingParameters extends PagingParameters {
  universeId: number;
}

const ReorderBadgesContainer: FunctionComponent = () => {
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();
  const [universeIsEnrolledInReordering, setUniverseEnrollment] = useState<boolean | undefined>(
    undefined,
  );

  const [loadedNextPageCursor, setLoadedNextPageCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrefetching, setIsPrefetching] = useState<boolean>(true);
  const [loadedBadges, setLoadedBadges] = useState<DraggableListElementData[] | undefined>(
    undefined,
  );

  const [binning, setBinning] = useState<Binning | undefined>(undefined);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | undefined>(undefined);
  const [isUpdatingList, setIsUpdatingList] = useState<boolean>(false);
  const [isListReordered, setIsListReordered] = useState<boolean>(false);

  const { classes: styles } = useReorderBadgesContainerStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { translate, translateHTML } = useTranslation();
  const { enqueue } = useSnackbar();
  const { settings } = useSettings();

  const maxBadgesToReorder = 50;

  const loadBadges = useCallback((parameters: BadgesListPagingParameters) => {
    (async () => {
      setIsLoading(true);

      const badgesListPagingParameters = parameters;
      const { nextPageCursor, data: badgesData } = await badgesClient.getBadges(
        badgesListPagingParameters.universeId,
        SortOrder.Asc,
        badgesListPagingParameters.count as V1UniversesUniverseIdBadgesGetLimitEnum,
        badgesListPagingParameters.cursor,
      );

      const formattedData: DraggableListElementData[] = badgesData?.map((badge) => ({
        id: badge.id,
        name: badge.name,
        isActive: badge.enabled ?? false,
      }));

      setLoadedBadges((prevLoadedBadges) => {
        const updatedBadges = prevLoadedBadges
          ? prevLoadedBadges.concat(formattedData)
          : formattedData;

        setBinning((previousBinning) => {
          let binningSystem: Binning;
          if (previousBinning) {
            binningSystem = previousBinning;
            formattedData.forEach((badge) => {
              if (!binningSystem.Original.some((item) => item.Id === badge.id)) {
                binningSystem.append({
                  id: badge.id,
                  name: badge.name,
                  isActive: badge.isActive,
                });
              }
            });
          } else {
            const orderables: Orderable[] = [];
            updatedBadges.forEach((badge) => {
              orderables.push({
                id: badge.id,
                name: badge.name,
                isActive: badge.isActive,
              });
            });
            binningSystem = new Binning({ sourceOrder: orderables });
          }

          return binningSystem;
        });

        return updatedBadges;
      });

      setLoadedNextPageCursor(nextPageCursor);
      setIsLoading(false);
    })();
  }, []);

  const fetchMoreData = useCallback(() => {
    if (!isLoading && gameDetails?.id) {
      loadBadges({
        universeId: gameDetails.id,
        cursor: loadedNextPageCursor,
        count: V1UniversesUniverseIdBadgesGetLimitEnum.NUMBER_25,
      });
    }
  }, [gameDetails, loadBadges, isLoading, loadedNextPageCursor]);

  const handleReorderList = useCallback(
    (srcIndex: number, desIndex: number) => {
      const targetElement: Orderable | undefined = binning?.Current[srcIndex];
      if (targetElement === undefined) {
        setReorderErrorMessage(translate('Error.FailedParse'));
        return;
      }

      // If moving this element would exceed the max number of badges to reorder in one commit, reject the changes.
      if (
        !binning?.Delta.filter((bin) => {
          return bin.elements.includes(targetElement.id);
        })
      ) {
        let currentNumberReordered = 0;
        binning?.Delta.forEach((bin) => {
          currentNumberReordered += bin.elements.length;
        });
        if (currentNumberReordered >= maxBadgesToReorder) {
          setReorderErrorMessage(translate('Error.TooManyBadgesToReorder'));
          return;
        }
      }

      // Track the change and update bounded binning
      setBinning((previousBinning) => {
        if (previousBinning === undefined) {
          setReorderErrorMessage(translate('Error.FailedUpdateOnDrop'));
          return previousBinning;
        }
        previousBinning.drop(targetElement?.id, desIndex);

        // Reposition the associated element in loaded badges to update visual order
        setLoadedBadges((prevListOrder) => {
          if (prevListOrder !== undefined) {
            const itemToInsert = prevListOrder.splice(srcIndex, 1);
            prevListOrder.splice(desIndex, 0, ...itemToInsert);
            return Array.from(prevListOrder);
          }
          return [];
        });

        return previousBinning;
      });

      // If bins exist, there are changes that can be committed
      setIsListReordered(() => {
        return binning?.Delta.length !== 0;
      });
    },
    [setBinning, binning, translate],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || result.source.index === result.destination.index) {
        return;
      }
      handleReorderList(result.source.index, result.destination.index);
    },
    [handleReorderList],
  );

  const updateBadgesOrder = useCallback(
    async (universeId: number, bins: OrderingBin[]) => {
      try {
        const requestBins = bins.map((bin) => ({
          UpperBound: bin.upperBound,
          Ids: bin.elements,
          LowerBound: bin.lowerBound,
        }));
        await badgesClient.updateBadgesOrder(universeId, requestBins);
        return true;
      } catch (e) {
        // set the error message based on the error code
        if (e instanceof GenericBEDEV1Error && Object.values(BadgesErrorCodes).includes(e.code)) {
          setReorderErrorMessage(
            translate(badgeErrorCodeToDescription[e.code as BadgesErrorCodes]),
          );
        } else {
          setReorderErrorMessage(translate('Error.FailedReorderTryAgain'));
        }

        // reload the badges
        setBinning(undefined);
        setLoadedBadges(undefined);
        setIsListReordered(false);
        if (gameDetails?.id !== undefined) {
          loadBadges({
            universeId: gameDetails.id,
            cursor: undefined,
            count: V1UniversesUniverseIdBadgesGetLimitEnum.NUMBER_25,
          });
        }

        return false;
      }
    },
    [loadBadges, gameDetails, translate],
  );

  const commitChanges = useCallback(() => {
    setIsUpdatingList(true);
    setReorderErrorMessage(undefined);

    if (isLoading || !gameDetails?.id || !binning) {
      setReorderErrorMessage(translate('Error.CommitBeforeLoad'));
      return false;
    }

    return updateBadgesOrder(gameDetails.id, binning.Delta).then(async (isReorderSuccess) => {
      if (isReorderSuccess) {
        await Router.push(
          `/dashboard/creations/experiences/${gameDetails?.id}/associated-items?activeTab=Badge`,
        ).then(() => {
          enqueue(
            {
              message: 'Successfully Reordered Badges',
              autoHide: true,
            },
            (reason) => reason === 'timeout',
          );
        });
      } else {
        setIsUpdatingList(false);
      }
    });
  }, [
    setIsUpdatingList,
    setReorderErrorMessage,
    gameDetails,
    binning,
    enqueue,
    updateBadgesOrder,
    isLoading,
    translate,
  ]);

  const cancelReorder = useCallback(() => {
    if (gameDetails?.id !== undefined) {
      Router.push(
        `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Badge`,
      );
    }
  }, [gameDetails]);

  const loadPage = useCallback(async () => {
    if (gameDetails?.id !== undefined) {
      const [isUniverseEnrolled] = await Promise.all([
        badgesClient.getIsUniverseEnrolledInBadgesReordering(gameDetails.id),
      ]);
      setUniverseEnrollment(isUniverseEnrolled);
    }

    if (isPrefetching && !isLoadingGame && gameDetails?.id) {
      loadBadges({
        universeId: gameDetails.id,
        cursor: loadedNextPageCursor,
        count: V1UniversesUniverseIdBadgesGetLimitEnum.NUMBER_25,
      });
      setIsPrefetching(false);
    }
  }, [isLoadingGame, gameDetails, loadBadges, loadedNextPageCursor, isPrefetching]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  if (settings.enableBadgeReordering !== true || universeIsEnrolledInReordering === false) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <section className={styles.section}>
      <Grid>
        <Collapse in={reorderErrorMessage !== undefined} mountOnEnter unmountOnExit>
          <Grid item className={styles.infoMessage}>
            <Alert severity='error'>
              <div>{reorderErrorMessage}</div>
            </Alert>
          </Grid>
        </Collapse>
        <Collapse
          in={gameDetails?.rootPlaceId !== undefined && isListReordered}
          mountOnEnter
          unmountOnExit>
          <Grid item className={styles.infoMessage}>
            <Alert severity='info'>
              {translateHTML('Message.ReorderBadgesAlert', [
                {
                  opening: 'LinkStart',
                  closing: 'LinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={getUrlForItemType(Item.Game, gameDetails?.rootPlaceId ?? 0) ?? ''}
                        target='_blank'
                        underline='always'
                        color='inherit'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Alert>
          </Grid>
        </Collapse>
      </Grid>
      <Grid className={styles.list}>
        {isLoading && loadedBadges === undefined ? (
          <EmptyGrid>
            <CircularProgress />
          </EmptyGrid>
        ) : (
          <DraggableListContainer
            loadedData={loadedBadges}
            fetchMoreData={fetchMoreData}
            hasMore={loadedNextPageCursor !== undefined}
            onDragEnded={handleDragEnd}
            isUpdatingList={isUpdatingList}
          />
        )}
        <Grid container direction='column'>
          <Grid item>
            <Divider className={styles.divider} />
          </Grid>
          <Grid container direction={isCompactView ? 'column' : 'row'}>
            <Button
              data-testid='cancel-button'
              className={styles.button}
              size='large'
              variant='outlined'
              color='primary'
              disabled={isUpdatingList}
              onClick={cancelReorder}>
              {translate('Label.Cancel')}
            </Button>
            <Button
              data-testid='save-button'
              size='large'
              variant='contained'
              color='primaryBrand'
              disabled={!isListReordered || !loadedBadges || loadedBadges.length === 0 || isLoading}
              onClick={commitChanges}
              loading={isUpdatingList}>
              {translate('Label.Save')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </section>
  );
};

export default withTranslation(ReorderBadgesContainer, [
  TranslationNamespace.Badges,
  TranslationNamespace.Advanced,
]);
