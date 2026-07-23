import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { PageLoading } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ItemGrid from '../../common/components/ItemGrid';
import ItemCardContainer from '../../common/containers/ItemCardContainer';
import type CreationData from '../../common/interfaces/CreationData';
import type { CreationsGridPagingParameters } from '../types/CreationsGridPagingParameters';
import loadCreationsForAssetType from '../utils/loadCreationsUtils';

export interface AgeRestrictedExperiencesListProps {
  pagingParameters: CreationsGridPagingParameters;
  emptyMessage: React.ReactNode;
}

const AgeRestrictedExperiencesList: FunctionComponent<AgeRestrictedExperiencesListProps> = ({
  pagingParameters,
  emptyMessage,
}) => {
  const { translate } = useTranslation();
  const [items, setItems] = useState<CreationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [exhausted, setExhausted] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const fetchIdRef = useRef(0);
  const { status } = useSettings();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const isSettingsLoaded = status === 'success';

  const maxConsecutiveEmptyPages = 10;

  const fetchPages = useCallback(
    async (cursor: string | undefined, appendTo: CreationData[]) => {
      fetchIdRef.current += 1;
      const currentFetchId = fetchIdRef.current;
      setIsLoading(true);
      setGaveUp(false);

      let currentCursor = cursor;
      let consecutiveEmpty = 0;
      const accumulated = [...appendTo];

      while (true) {
        if (fetchIdRef.current !== currentFetchId) {
          return;
        }

        try {
          const response = await loadCreationsForAssetType({
            ...pagingParameters,
            cursor: currentCursor,
          });

          if (fetchIdRef.current !== currentFetchId) {
            return;
          }

          const flaggedItems = response.items.filter(
            (item) => item.isAgeRestrictedCollaboration === true,
          );

          if (flaggedItems.length > 0) {
            accumulated.push(...flaggedItems);
            setItems(accumulated);
            setNextCursor(response.nextPageCursor);
            setExhausted(!response.nextPageCursor);
            setIsLoading(false);
            return;
          }

          consecutiveEmpty += 1;

          if (!response.nextPageCursor) {
            setItems(accumulated);
            setNextCursor(undefined);
            setExhausted(true);
            setIsLoading(false);
            return;
          }

          if (consecutiveEmpty >= maxConsecutiveEmptyPages) {
            setItems(accumulated);
            setNextCursor(response.nextPageCursor);
            setGaveUp(true);
            setIsLoading(false);
            return;
          }

          currentCursor = response.nextPageCursor;
        } catch {
          setItems(accumulated);
          setIsLoading(false);
          return;
        }
      }
    },
    [pagingParameters],
  );

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- pre-existing EffectSetState pattern: reset paging state before refetching when params change
    setItems([]);
    setNextCursor(undefined);
    setExhausted(false);
    setGaveUp(false);
    void fetchPages(undefined, []);
  }, [fetchPages]);

  const handleLoadMore = useCallback(() => {
    void fetchPages(nextCursor, items);
  }, [fetchPages, nextCursor, items]);

  const handleLoadMoreWithTracking = useCallback(() => {
    const universeIdsFromItems = items
      .map((item) => item.universeId)
      .filter((id): id is number => id !== undefined && id !== null);
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesLoadMoreClick,
      parameters: {
        page: 'creations',
        loadedCount: items.length.toString(),
        ...(universeIdsFromItems.length > 0 && {
          universeIds: universeIdsFromItems.join(','),
        }),
      },
    });
    handleLoadMore();
  }, [unifiedLogger, items, handleLoadMore]);

  if ((isLoading || !isSettingsLoaded) && items.length === 0) {
    return <PageLoading />;
  }

  const hasMore = !exhausted && nextCursor != null;

  return (
    <>
      <ItemGrid
        data={items}
        getItemKey={(item) => item.assetId ?? 0}
        GridItemComponent={ItemCardContainer}
        removeItemAtIndex={() => {}}
        updateItemAtIndex={() => {}}
        isLoading={false}
        emptyMessage={exhausted ? emptyMessage : null}
      />

      {isLoading && items.length > 0 && <PageLoading />}

      {!isLoading && (hasMore || gaveUp) && (
        <Grid container justifyContent='center'>
          <Button variant='contained' color='secondary' onClick={handleLoadMoreWithTracking}>
            {translate('Action.LoadMore')}
          </Button>
        </Grid>
      )}
    </>
  );
};

export default withTranslation(AgeRestrictedExperiencesList, [TranslationNamespace.Creations]);
