import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import type { UnifiedLogger } from '@rbx/unified-logger';
import { KnowledgeFeedEvent } from '../../constants/eventParams';
import { formatKnowledgeFeedLocalStorageKey } from '../../constants/feedConstants';
import type { TFeedItemData } from '../../types';
import createFetcher from '../../utilities/fetchUtils';
import BaseCarousel from '../BaseCarousel/BaseCarousel';
import FeedTile from '../FeedTile/FeedTile';
import LoadingTile from '../LoadingTile/LoadingTile';
import SectionHeader from '../SectionHeader/SectionHeader';
import ShowMoreCard from '../ShowMoreCard/ShowMoreCard';

const useFeedStyles = makeStyles()((theme) => ({
  section: {
    marginBottom: 48,
    [theme.breakpoints.down('Large')]: {
      marginBottom: 24,
    },
  },
}));

type KnowledgeFeedProps = {
  unifiedLoggerClient: UnifiedLogger;
  surfaceType: string;
  feedTypes?: string[];
  robloxSiteDomain:
    | 'roblox.com'
    | 'sitetest1.robloxlabs.com'
    | 'sitetest2.robloxlabs.com'
    | 'sitetest3.robloxlabs.com';
  headerKey?: string;
  viewAllUrl?: string;
  showMore?: {
    url: string;
    headerKey: string;
    descriptionKey: string;
  };
};

type Feed = {
  data: TFeedItemData;
  tilePosition: number;
};

const KnowledgeFeed: FC<React.PropsWithChildren<KnowledgeFeedProps>> = ({
  unifiedLoggerClient,
  surfaceType,
  feedTypes,
  robloxSiteDomain,
  headerKey,
  viewAllUrl,
  showMore,
}) => {
  const fetcher = useMemo(() => createFetcher(robloxSiteDomain), [robloxSiteDomain]);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TFeedItemData[]>([]);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!surfaceType) {
      setError(true);
    }
  }, [surfaceType]);

  const eventParams = useMemo(
    () => ({
      surfaceType,
      feedTypes: feedTypes?.join(',') ?? '',
    }),
    [surfaceType, feedTypes],
  );
  const { translate } = useTranslation();

  const handleClickFeedTile = useCallback(
    (id: string, url: string, title: string) => () => {
      unifiedLoggerClient.logClickEvent({
        eventName: KnowledgeFeedEvent.ClickFeedTile,
        parameters: {
          ...eventParams,
          id,
          title,
          url,
        },
      });
    },
    [eventParams, unifiedLoggerClient],
  );

  const onViewAll = useCallback(() => {
    unifiedLoggerClient.logClickEvent({
      eventName: KnowledgeFeedEvent.ClickFeedViewAll,
      parameters: {
        ...eventParams,
      },
    });
  }, [eventParams, unifiedLoggerClient]);

  const {
    classes: { section: sectionClass },
  } = useFeedStyles();

  const FeedTileComponent = useCallback(
    (feed: Feed) => (
      <FeedTile
        {...feed.data}
        eventParams={eventParams}
        tilePosition={feed.tilePosition}
        targetEnv={robloxSiteDomain === 'roblox.com' ? 'production' : 'staging'}
        onClick={handleClickFeedTile(feed.data.id, feed.data.url, feed.data.title)}
        unifiedLoggerClient={unifiedLoggerClient}
      />
    ),
    [eventParams, robloxSiteDomain, handleClickFeedTile, unifiedLoggerClient],
  );

  const loadFeedsData = useCallback(async () => {
    const localStorageKey = formatKnowledgeFeedLocalStorageKey(surfaceType, feedTypes);
    try {
      const feedItems = await fetcher.fetchFeedItems(surfaceType, feedTypes);
      setLoading(false);
      setData(feedItems);
      // cache data in localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(feedItems));
    } catch {
      // get last cached successful feed data
      const localStorageData = localStorage.getItem(localStorageKey);
      if (localStorageData) {
        setData(JSON.parse(localStorageData));
        setLoading(false);
      } else {
        setError(true);
      }
    }
  }, [surfaceType, feedTypes, fetcher]);

  useEffect(() => {
    loadFeedsData();
  }, [loadFeedsData]);

  useEffect(() => {
    unifiedLoggerClient.logImpressionEvent({
      eventName: KnowledgeFeedEvent.CarouselImpression,
      parameters: { ...eventParams },
    });
  }, [unifiedLoggerClient, eventParams]);

  return error ? null : (
    <div className={sectionClass} data-testid='feed'>
      {headerKey && (
        <SectionHeader
          header={translate(headerKey)}
          viewAllUrl={viewAllUrl ?? showMore?.url}
          onViewAllClick={onViewAll}
        />
      )}
      <BaseCarousel
        data={data}
        loading={loading}
        LoadingTileComponent={LoadingTile}
        TileComponent={FeedTileComponent}
        onClickPrevious={() => {
          unifiedLoggerClient.logClickEvent({
            eventName: KnowledgeFeedEvent.ClickFeedCarouselLeft,
            parameters: {
              ...eventParams,
            },
          });
        }}
        onClickNext={() => {
          unifiedLoggerClient.logClickEvent({
            eventName: KnowledgeFeedEvent.ClickFeedCarouselRight,
            parameters: {
              ...eventParams,
            },
          });
        }}
        lastCard={
          showMore && (
            <ShowMoreCard
              {...showMore}
              url={showMore.url}
              headerText={translate(showMore.headerKey)}
              descriptionText={translate(showMore.descriptionKey)}
              onClick={onViewAll}
            />
          )
        }
      />
    </div>
  );
};

export default KnowledgeFeed;
