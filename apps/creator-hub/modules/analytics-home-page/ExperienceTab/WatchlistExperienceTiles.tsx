import React, { FC, FunctionComponent, useCallback, useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useRAQIV2TranslationDependencies,
  ExperienceTileStyles,
  calculateLikePercentage,
  logAnalyticsHomeWatchlistImpression,
  useAnalyticsWatchlist,
  useMappedApiRequest,
  useOwner,
} from '@modules/experience-analytics-shared';
import { gamesClient } from '@modules/clients';
import { Card, Grid, Skeleton, useMediaQuery } from '@rbx/ui';
import DragDropSort from '@modules/miscellaneous/common/components/uploaders/components/DragDropSort';
import { arrayMove } from '@dnd-kit/sortable';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { components } from '@modules/miscellaneous/common';
import WatchlistExperienceTile, { WatchlistExperienceTileSpec } from './WatchlistExperienceTile';
import useWatchlistDragAndDropItemStyles from './WatchlistDragAndDropItem.styles';

const { Carousel, LoadingCarousel } = components;
const WatchlistExperienceTiles: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const owner = useOwner();
  const { currentWatchlist, upsertWatchlist } = useAnalyticsWatchlist();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const watchlistExperienceIds = useMemo(
    () => currentWatchlist?.watchlistItems?.itemIds ?? [],
    [currentWatchlist?.watchlistItems?.itemIds],
  );

  // Send unified logging events
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const logWatchlistImpression = useCallback(
    async (ids: string[]) => {
      if (ids && ids.length > 0 && owner.isFetched) {
        logAnalyticsHomeWatchlistImpression(unifiedLogger, {
          loggingTarget: {
            targetId: owner.ownerId,
            targetType: owner.ownerType,
          },
          experienceIds: ids.map(Number),
        });
        return new Map(ids.map((id) => [id, true]));
      }
      return new Map(ids.map((id) => [id, null]));
    },
    [owner, unifiedLogger],
  );
  useMappedApiRequest(watchlistExperienceIds, logWatchlistImpression);

  // Spread fetches to game details and votes
  const fetchExperienceDetails = useCallback(async (ids: string[]) => {
    const response = await gamesClient.getDetails(ids.map((id) => Number(id)));
    return new Map(response?.data?.map((data) => [data.id?.toString() as string, data]));
  }, []);
  const {
    data: experienceDetailsData,
    isDataLoading: isDetailsLoading,
    isResponseFailed,
    isUserForbidden,
  } = useMappedApiRequest(watchlistExperienceIds, fetchExperienceDetails);

  const fetchVotesData = useCallback(async (ids: string[]) => {
    const response = await gamesClient.multigetGameVotes(ids.map((id) => Number(id)));
    return new Map(response?.data?.map((data) => [data.id?.toString() as string, data]));
  }, []);
  const { data: votesData } = useMappedApiRequest(watchlistExperienceIds, fetchVotesData);

  // Merge api responses together
  const experiences: WatchlistExperienceTileSpec[] = useMemo(() => {
    if (!experienceDetailsData) {
      return [];
    }
    return (
      watchlistExperienceIds.map((id) => {
        const ownerName =
          owner.isFetched && experienceDetailsData.get(id)?.creator?.id === owner.ownerId
            ? translate(translationKey('Label.Owner', TranslationNamespace.Analytics))
            : (experienceDetailsData.get(id)?.creator?.name ?? null);

        const vote = votesData.get(id);
        const likePercentage = calculateLikePercentage(vote?.upVotes, vote?.downVotes);

        return {
          universeId: Number(id),
          title: experienceDetailsData.get(id)?.name ?? '',
          ownerName,
          updatedDate: experienceDetailsData.get(id)?.updated ?? null,
          likeRatio: likePercentage,
          playing: experienceDetailsData.get(id)?.playing ?? null,
          isDataLoading: isDetailsLoading,
          isResponseFailed,
          isUserForbidden,
          styleConfig: ExperienceTileStyles.large,
        };
      }) ?? []
    );
  }, [
    watchlistExperienceIds,
    experienceDetailsData,
    isDetailsLoading,
    isResponseFailed,
    isUserForbidden,
    owner,
    translate,
    votesData,
  ]);

  const watchlistSortItems = useMemo(
    () =>
      experiences.map((exp) => ({
        key: exp.universeId.toString(),
        item: (
          <WatchlistExperienceTile
            {...exp}
            key={exp.universeId}
            styleConfig={ExperienceTileStyles.large}
          />
        ),
      })),
    [experiences],
  );
  const reorderWatchlist = useCallback(
    (originIndex: number, resultIndex: number) => {
      const reorderedIds = arrayMove(watchlistExperienceIds, originIndex, resultIndex);
      upsertWatchlist(reorderedIds, true);
    },
    [watchlistExperienceIds, upsertWatchlist],
  );
  const dragDropSortConfig = useMemo(
    () => ({
      startDragPixelDistance: 8,
    }),
    [],
  );
  const {
    classes: { dragAndDropItem },
  } = useWatchlistDragAndDropItemStyles({
    styleConfig: ExperienceTileStyles.large,
  });
  const dragDropItemComponent = useMemo(
    () => <Grid item XSmall className={dragAndDropItem} />,
    [dragAndDropItem],
  );
  const desktopWatchlist = useMemo(
    () => (
      <Grid
        container
        spacing={2}
        direction='row'
        justifyContent='flex-start'
        alignItems='flex-start'>
        <DragDropSort
          sortItems={watchlistSortItems}
          onReorder={reorderWatchlist}
          itemComponent={dragDropItemComponent}
          config={dragDropSortConfig}
          disabled={isCompactView}
        />
      </Grid>
    ),
    [
      dragDropItemComponent,
      dragDropSortConfig,
      isCompactView,
      reorderWatchlist,
      watchlistSortItems,
    ],
  );

  // NOTE(shumingxu, 10/31/2023): Will do a refactor later to clean this up by
  // separating mobile and desktop views into separate components.
  const RenderTile: FunctionComponent<{
    data: { id: string; exp: WatchlistExperienceTileSpec };
  }> = ({ data }) => {
    return (
      <div
        style={{
          width: ExperienceTileStyles.small.maxWidth,
          height: ExperienceTileStyles.small.height,
        }}>
        <WatchlistExperienceTile {...data.exp} styleConfig={ExperienceTileStyles.small} />
      </div>
    );
  };
  const LoadingTile: FunctionComponent = () => {
    return (
      <div
        style={{
          width: ExperienceTileStyles.small.maxWidth,
          height: ExperienceTileStyles.small.height,
        }}>
        <Card>
          <Skeleton animate variant='rectangular' />
        </Card>
      </div>
    );
  };
  const watchlistCarouselData = useMemo(
    () =>
      experiences.map((exp) => ({
        id: exp.universeId.toString(),
        exp,
      })),
    [experiences],
  );
  const mobileCarouselWatchlist = useMemo(
    () =>
      isDetailsLoading ? (
        <LoadingCarousel>
          {new Array(5).fill(0).map((_, id) => (
            /* eslint-disable-next-line react/no-array-index-key -- NOTE(jcountryman, 03/06/24): Not important since this are
            // throwaway components that do not have a true lifecycle in application 
             */
            <LoadingTile key={id} />
          ))}
        </LoadingCarousel>
      ) : (
        <Carousel>
          {watchlistCarouselData.map((data) => (
            <RenderTile key={data.id} data={data} />
          ))}
        </Carousel>
      ),
    [isDetailsLoading, watchlistCarouselData],
  );

  return isCompactView ? mobileCarouselWatchlist : desktopWatchlist;
};

export default WatchlistExperienceTiles;
