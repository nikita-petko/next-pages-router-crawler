import type { FC, FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/helpers';
import { Card, Grid, Skeleton, useMediaQuery } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import gamesClient from '@modules/clients/games';
import type { GameDetailResponse, MultigetGameVotesResponse } from '@modules/clients/games/games';
import { ExperienceTileStyles } from '@modules/experience-analytics-shared/constants/tileConstants';
import { useAnalyticsWatchlist } from '@modules/experience-analytics-shared/context/AnalyticsWatchlistProvider';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import useMappedApiRequest from '@modules/experience-analytics-shared/hooks/useMappedApiRequest';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { logAnalyticsHomeWatchlistImpression } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import calculateLikePercentage from '@modules/experience-analytics-shared/utils/calculateLikePercentage';
import { Carousel, LoadingCarousel } from '@modules/miscellaneous/components';
import DragDropSort from '@modules/miscellaneous/components/uploaders/components/DragDropSort';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useWatchlistDragAndDropItemStyles from './WatchlistDragAndDropItem.styles';
import type { WatchlistExperienceTileSpec } from './WatchlistExperienceTile';
import WatchlistExperienceTile from './WatchlistExperienceTile';

const MOBILE_LOADING_TILE_COUNT = 5;
type GameVoteResponse = NonNullable<MultigetGameVotesResponse['data']>[number];

const RenderTile: FunctionComponent<{
  data: { id: string; exp: WatchlistExperienceTileSpec };
}> = ({ data }) => (
  <div
    style={{
      width: ExperienceTileStyles.small.maxWidth,
      height: ExperienceTileStyles.small.height,
    }}>
    <WatchlistExperienceTile {...data.exp} styleConfig={ExperienceTileStyles.small} />
  </div>
);

const LoadingTile: FunctionComponent = () => (
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
    const detailsById = new Map<string, GameDetailResponse>();
    response?.data?.forEach((data) => {
      if (data.id !== undefined) {
        detailsById.set(data.id.toString(), data);
      }
    });
    return detailsById;
  }, []);
  const {
    data: experienceDetailsData,
    isDataLoading: isDetailsLoading,
    isResponseFailed,
    isUserForbidden,
  } = useMappedApiRequest(watchlistExperienceIds, fetchExperienceDetails);

  const fetchVotesData = useCallback(async (ids: string[]) => {
    const response = await gamesClient.multigetGameVotes(ids.map((id) => Number(id)));
    const votesById = new Map<string, GameVoteResponse>();
    response?.data?.forEach((data) => {
      if (data.id !== undefined) {
        votesById.set(data.id.toString(), data);
      }
    });
    return votesById;
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
      void upsertWatchlist(reorderedIds, true);
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
          {Array.from({ length: MOBILE_LOADING_TILE_COUNT }, (_, id) => (
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
