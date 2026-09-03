import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Router from 'next/router';
import type { DropResult } from '@hello-pangea/dnd';
import { V1UniversesUniverseIdBadgesGetLimitEnum } from '@rbx/client-badges/v1';
import type { PagingParameters } from '@rbx/core';
import { SortOrder, StatusCodes } from '@rbx/core';
import { FeedbackBanner, Link } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  Alert,
  Grid,
  Collapse,
  Divider,
  Button,
  CircularProgress,
  FormControlLabel,
  Label,
  Switch,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import badgesClient from '@modules/clients/badges';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import { Item } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import type { Orderable, OrderingBin } from '../../boundedBinning/BoundedBinning';
import Binning from '../../boundedBinning/BoundedBinning';
import badgeErrorCodeToDescription from '../../constants/badgeErrorCodesDescription';
import BadgesErrorCodes from '../../enums/BadgeErrorCodes';
import type { DraggableListElementData } from './components/DraggableListContainer';
import DraggableListContainer from './components/DraggableListContainer';
import useReorderBadgesContainerStyles from './ReorderBadgesContainer.style';

// Server-enforced per-save cap on reordered badges. Mirrors the limit reflected in the
// existing Error.TooManyBadgeIds copy ("Please reorder no more than 50 badges at a time.").
const MAX_BADGES_TO_REORDER = 50;

export interface BadgesListPagingParameters extends PagingParameters {
  universeId: number;
  count?: V1UniversesUniverseIdBadgesGetLimitEnum;
}

interface ReorderBadgesContainerProps {
  // Per-save reorder cap. Overridable so tests can exercise the at-cap paths without
  // performing 50 sequential drops. Production renders without the prop, keeping the cap
  // at the module default (MAX_BADGES_TO_REORDER).
  maxBadgesToReorder?: number;
}

const ReorderBadgesContainer: FunctionComponent<ReorderBadgesContainerProps> = ({
  maxBadgesToReorder = MAX_BADGES_TO_REORDER,
}) => {
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();

  const [loadedNextPageCursor, setLoadedNextPageCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrefetching, setIsPrefetching] = useState<boolean>(true);
  const [loadedBadges, setLoadedBadges] = useState<DraggableListElementData[] | undefined>(
    undefined,
  );

  const [binning, setBinning] = useState<Binning | undefined>(undefined);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | undefined>(undefined);
  const [isUpdatingList, setIsUpdatingList] = useState<boolean>(false);
  const [reorderedCount, setReorderedCount] = useState<number>(0);
  const [reorderedIds, setReorderedIds] = useState<ReadonlySet<number | string>>(() => new Set());
  // `isDragging` is a ref rather than state because it only gates fetchMoreData inside
  // event handlers — we don't need a re-render when it flips, and using state would race
  // with the drag-end handler's early returns.
  const isDraggingRef = useRef<boolean>(false);
  // Set when InfiniteScroll asks for another page mid-drag (we defer the actual load to
  // drag-end). Replaying exactly one deferred fetch keeps paging from stalling — see the
  // note in fetchMoreData / handleDragEnd.
  const pendingFetchRef = useRef<boolean>(false);

  const { classes: styles } = useReorderBadgesContainerStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { translate, translateHTML } = useTranslation();
  const { enqueue } = useSnackbar();

  // Visibility toggle. Filtering is render-only — the underlying loadedBadges /
  // binning.Current arrays still contain inactive rows so the bounded-binning system
  // continues to track them as anchors / movers exactly as before.
  const [hideInactiveBadges, setHideInactiveBadges] = useState<boolean>(false);

  const isListReordered = reorderedCount > 0;
  // Once the batch hits the cap, rows that are not already part of the batch must be locked
  // from dragging so a creator can't start an over-quota move (vs. dropping then reverting).
  // Rows already in the batch stay draggable because re-arranging them never grows the count.
  const isAtReorderCap = reorderedCount >= maxBadgesToReorder;

  const visibleLoadedBadges = useMemo(() => {
    if (loadedBadges === undefined) {
      return undefined;
    }
    if (!hideInactiveBadges) {
      return loadedBadges;
    }
    return loadedBadges.filter((badge) => badge.isActive);
  }, [loadedBadges, hideInactiveBadges]);

  const loadBadges = useCallback((parameters: BadgesListPagingParameters) => {
    void (async () => {
      setIsLoading(true);

      const badgesListPagingParameters = parameters;
      const { nextPageCursor, data: badgesData } = await badgesClient.getBadges(
        badgesListPagingParameters.universeId,
        SortOrder.Asc,
        badgesListPagingParameters.count,
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
              if (!binningSystem.Original.some((item) => item.id === badge.id)) {
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
    // Skip while dragging: @hello-pangea/dnd caches source/destination indices at drag
    // start, so growing Current/Original via binning.append() mid-drag would desync the
    // simulation from the visible list. Defer rather than drop the request: InfiniteScroll
    // latches `actionTriggered` until `dataLength` grows, so a mid-drag auto-scroll to the
    // bottom would otherwise stall paging for good. handleDragEnd replays the deferred load.
    if (isDraggingRef.current) {
      pendingFetchRef.current = true;
      return;
    }
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
      if (targetElement === undefined || binning === undefined) {
        setReorderErrorMessage(translate('Error.FailedParse'));
        return;
      }

      // Authoritative pre-flight: clone the binning, apply the drop, and compare counts.
      // Reject only if the simulated batch grows past the cap — moves that keep the count
      // the same or reduce it must remain possible even when already at the limit, so that
      // creators can re-arrange the rows already in their batch without saving first.
      const prevCount = binning.reorderedCount;
      const simulated = binning.clone();
      simulated.drop(targetElement.id, desIndex);
      const nextCount = simulated.reorderedCount;

      if (nextCount > maxBadgesToReorder && nextCount > prevCount) {
        // Surface the cap-rejection through a snackbar instead of a stacked banner so it
        // doesn't pile on top of the at-cap warning. Mirrors the success-path enqueue
        // already used by commitChanges below.
        enqueue(
          {
            children: (
              <Alert severity='error' variant='filled'>
                {translate('Error.ReorderBatchLimitExceeded' /* TranslationNamespace.Badges */, {
                  max: String(maxBadgesToReorder),
                })}
              </Alert>
            ),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
        return;
      }

      // Track the change and update bounded binning
      setBinning((previousBinning) => {
        if (previousBinning === undefined) {
          setReorderErrorMessage(translate('Error.FailedUpdateOnDrop'));
          return previousBinning;
        }
        previousBinning.drop(targetElement.id, desIndex);

        // Reposition the associated element in loaded badges to update visual order
        setLoadedBadges((prevListOrder) => {
          if (prevListOrder !== undefined) {
            const itemToInsert = prevListOrder.splice(srcIndex, 1);
            prevListOrder.splice(desIndex, 0, ...itemToInsert);
            return Array.from(prevListOrder);
          }
          return [];
        });

        setReorderedCount(previousBinning.reorderedCount);
        setReorderedIds(previousBinning.reorderedIds);

        return previousBinning;
      });
    },
    [binning, translate, enqueue, maxBadgesToReorder],
  );

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      // Always release the drag lock first. @hello-pangea/dnd fires onDragEnd for both
      // completed and cancelled drags; failing to reset here in the cancellation /
      // no-op paths would permanently disable infinite scroll.
      isDraggingRef.current = false;

      // Replay a page load that was deferred because InfiniteScroll fired `next` mid-drag.
      // Without this the scroll pipeline can stall: InfiniteScroll won't call `next` again
      // until `dataLength` grows, and the suppressed (no-op) fetch never grew it. Gate on
      // the cursor so we never re-request the first page when there's nothing more to load.
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        if (loadedNextPageCursor !== undefined) {
          fetchMoreData();
        }
      }

      if (!result.destination || result.source.index === result.destination.index) {
        return;
      }

      // When the visibility toggle is off the visible list IS loadedBadges, so the
      // indices @hello-pangea/dnd reports are already real. When the toggle is on we
      // render only the active rows, so the reported indices are positions inside the
      // filtered list and must be translated back into loadedBadges-space before
      // handing them to handleReorderList. The translation preserves the bounded-binning
      // contract: hidden inactive rows are still part of Current and act as anchors /
      // get reshuffled around the dragged item.
      if (!hideInactiveBadges || loadedBadges === undefined) {
        handleReorderList(result.source.index, result.destination.index);
        return;
      }

      const realIndicesOfVisible: number[] = [];
      loadedBadges.forEach((badge, realIndex) => {
        if (badge.isActive) {
          realIndicesOfVisible.push(realIndex);
        }
      });

      const realSrc = realIndicesOfVisible[result.source.index];
      if (realSrc === undefined) {
        return;
      }

      // Real indices in the post-removal list. Anything to the right of the source
      // shifts left by one, mirroring @hello-pangea/dnd's destination convention.
      const realIndicesAfterRemoval = realIndicesOfVisible
        .filter((realIndex) => realIndex !== realSrc)
        .map((realIndex) => (realIndex > realSrc ? realIndex - 1 : realIndex));

      const realDst =
        result.destination.index < realIndicesAfterRemoval.length
          ? realIndicesAfterRemoval[result.destination.index]
          : loadedBadges.length - 1;

      if (realSrc === realDst) {
        return;
      }
      handleReorderList(realSrc, realDst);
    },
    [handleReorderList, hideInactiveBadges, loadedBadges, fetchMoreData, loadedNextPageCursor],
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
        setReorderedCount(0);
        setReorderedIds(new Set());
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

  const commitChanges = useCallback(async () => {
    setIsUpdatingList(true);
    setReorderErrorMessage(undefined);

    if (isLoading || !gameDetails?.id || !binning) {
      setReorderErrorMessage(translate('Error.CommitBeforeLoad'));
      return false;
    }

    const isReorderSuccess = await updateBadgesOrder(gameDetails.id, binning.Delta);
    if (isReorderSuccess) {
      await Router.push(
        `/dashboard/creations/experiences/${gameDetails?.id}/associated-items?activeTab=Badge`,
      );
      enqueue(
        {
          message: translate('Message.ReorderBadgesSuccess' /* TranslationNamespace.Badges */),
          autoHide: true,
        },
        (reason) => reason === 'timeout',
      );
      return true;
    }
    setIsUpdatingList(false);
    return false;
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
      void Router.push(
        `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Badge`,
      );
    }
  }, [gameDetails]);

  const loadPage = useCallback(() => {
    if (isPrefetching && !isLoadingGame && gameDetails?.id) {
      loadBadges({
        universeId: gameDetails.id,
        cursor: loadedNextPageCursor,
        count: V1UniversesUniverseIdBadgesGetLimitEnum.NUMBER_25,
      });
      setIsPrefetching(false);
    }
  }, [isLoadingGame, gameDetails, loadBadges, loadedNextPageCursor, isPrefetching]);

  const handleToggleHideInactiveBadges = useCallback(() => {
    setHideInactiveBadges((prev) => !prev);
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  // When the "Hide disabled badges" toggle is on, the rendered list can shrink to too
  // few rows to scroll. react-infinite-scroll-component only triggers `next` on scroll,
  // so without a kick-start the user could be stuck with nothing to scroll and unable to
  // load further pages. Auto-prime more pages until the visible list is at least one
  // page-worth or there are no more pages to load. This effect re-fires after each
  // fetch (loadedNextPageCursor / isLoading both flip), naturally chaining loads, and
  // halts the moment any of the gating conditions stop holding.
  useEffect(() => {
    if (!hideInactiveBadges) {
      return;
    }
    if (loadedNextPageCursor === undefined) {
      return;
    }
    if (isLoading) {
      return;
    }
    if (isDraggingRef.current) {
      return;
    }
    const visibleCount = visibleLoadedBadges?.length ?? 0;
    const VISIBLE_PAGE_THRESHOLD = 25;
    if (visibleCount < VISIBLE_PAGE_THRESHOLD) {
      fetchMoreData();
    }
  }, [hideInactiveBadges, visibleLoadedBadges, loadedNextPageCursor, isLoading, fetchMoreData]);

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // Translate once and reuse for the Switch's (required) aria-label and the visible
  // FormControlLabel label, instead of repeating the same translate call for each.
  const hideDisabledBadgesLabel = translate(
    'Action.HideDisabledBadges' /* TranslationNamespace.Badges */,
  );

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
        {/*
          Reorder guidance, rendered as a Foundation info banner (matching the thumbnail
          reorder page). Keeps the inline link out to the live experience so creators can
          preview ordering.
        */}
        {gameDetails?.rootPlaceId !== undefined && (
          <Grid item className={styles.infoMessage}>
            <FeedbackBanner
              title={null}
              severity='Info'
              variant='Standard'
              layout='Inline'
              description={translateHTML('Message.ReorderBadgesAlert', [
                {
                  opening: 'LinkStart',
                  closing: 'LinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={getUrlForItemType(Item.Game, gameDetails?.rootPlaceId ?? 0) ?? ''}
                        target='_blank'
                        underline='always'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            />
          </Grid>
        )}
        {/*
          At-cap warning: surfaced once the per-save reorder limit is reached. Non-batch rows
          are already locked from dragging; this banner explains why and how to proceed.
        */}
        {isAtReorderCap && (
          <Grid item className={styles.infoMessage}>
            <FeedbackBanner
              title={null}
              severity='Warning'
              variant='Standard'
              layout='Inline'
              description={translate(
                'Message.ReorderBadgesLimitReached' /* TranslationNamespace.Badges */,
                { max: String(maxBadgesToReorder) },
              )}
            />
          </Grid>
        )}
      </Grid>
      <Grid item className={styles.statusRow}>
        <div className={styles.reorderStatus}>
          <Typography variant='body2' color='secondary'>
            {translate('Message.ReorderBadgesMaxPerSave' /* TranslationNamespace.Badges */, {
              max: String(maxBadgesToReorder),
            })}
          </Typography>
          <output aria-live='polite' data-testid='reorder-count-badge'>
            <Label
              classes={{ root: styles.pill }}
              labelText={translate(
                'Label.ReorderBadgesMovedCount' /* TranslationNamespace.Badges */,
                {
                  // Zero-pad the numerator to 2 digits (01, 02, … 09, 10, 11) so the pill
                  // keeps a constant width as the count crosses from single to double digits.
                  count: String(reorderedCount).padStart(2, '0'),
                  max: String(maxBadgesToReorder),
                },
              )}
            />
          </output>
        </div>
        <FormControlLabel
          className={styles.hideDisabledToggle}
          control={
            <Switch
              checked={hideInactiveBadges}
              onChange={handleToggleHideInactiveBadges}
              aria-label={hideDisabledBadgesLabel}
              data-testid='hide-disabled-badges-switch'
            />
          }
          label={hideDisabledBadgesLabel}
        />
      </Grid>
      <Grid className={styles.list}>
        {isLoading && loadedBadges === undefined ? (
          <EmptyGrid>
            <CircularProgress />
          </EmptyGrid>
        ) : (
          <DraggableListContainer
            loadedData={visibleLoadedBadges}
            // Track InfiniteScroll's "did data grow?" detection against the underlying
            // load count, not the filtered visible count. Otherwise a page where every
            // newly-fetched badge is inactive (toggle on) would appear as zero growth and
            // jam the scroll-trigger pipeline.
            loadedItemsCount={loadedBadges?.length ?? 0}
            fetchMoreData={fetchMoreData}
            hasMore={loadedNextPageCursor !== undefined}
            onDragStarted={handleDragStart}
            onDragEnded={handleDragEnd}
            isUpdatingList={isUpdatingList}
            reorderedIds={reorderedIds}
            isAtReorderCap={isAtReorderCap}
          />
        )}
        <Grid container direction='column'>
          <Grid item>
            <Divider className={styles.divider} />
          </Grid>
          <Grid container direction={isCompactView ? 'column' : 'row'}>
            <Button
              data-testid='save-button'
              className={styles.button}
              size='large'
              variant='contained'
              color='primaryBrand'
              disabled={!isListReordered || !loadedBadges || loadedBadges.length === 0 || isLoading}
              onClick={commitChanges}
              loading={isUpdatingList}>
              {translate('Label.Save')}
            </Button>
            <Button
              data-testid='cancel-button'
              size='large'
              variant='outlined'
              color='primary'
              disabled={isUpdatingList}
              onClick={cancelReorder}>
              {translate('Label.Cancel')}
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
  // Needed by ItemCardActivity for Label.Active / Label.Inactive (the Active/Inactive
  // subtitle on each row), which live in CreatorDashboard.Creations.
  TranslationNamespace.Creations,
]);
