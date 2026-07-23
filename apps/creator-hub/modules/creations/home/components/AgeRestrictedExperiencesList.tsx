import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CreationData, ItemCardContainer } from '../../common';
import ItemGrid from '../../common/components/ItemGrid';
import loadCreationsForAssetType from '../utils/loadCreationsUtils';
import { CreationsGridPagingParameters } from '../containers/CreationsGridContainer';

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
  const { settings, status } = useSettings();
  const isSettingsLoaded = status === 'success';

  const maxConsecutiveEmptyPages = settings.impactedExperiencesMaxConsecutiveEmptyPages || 30;

  const fetchPages = useCallback(
    async (cursor: string | undefined, appendTo: CreationData[]) => {
      fetchIdRef.current += 1;
      const currentFetchId = fetchIdRef.current;
      setIsLoading(true);
      setGaveUp(false);

      let currentCursor = cursor;
      let consecutiveEmpty = 0;
      let accumulated = [...appendTo];

      // eslint-disable-next-line no-constant-condition -- intentional fetch loop with explicit break conditions
      while (true) {
        if (fetchIdRef.current !== currentFetchId) return;

        try {
          // eslint-disable-next-line no-await-in-loop -- sequential page fetching is intentional for the accumulator pattern
          const response = await loadCreationsForAssetType({
            ...pagingParameters,
            cursor: currentCursor,
          });

          if (fetchIdRef.current !== currentFetchId) return;

          const flaggedItems = response.items.filter(
            (item) => item.isAgeRestrictedCollaboration === true,
          );

          if (flaggedItems.length > 0) {
            accumulated = [...accumulated, ...flaggedItems];
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
    [pagingParameters, maxConsecutiveEmptyPages],
  );

  useEffect(() => {
    setItems([]);
    setNextCursor(undefined);
    setExhausted(false);
    setGaveUp(false);
    fetchPages(undefined, []);
  }, [fetchPages]);

  const handleLoadMore = useCallback(() => {
    fetchPages(nextCursor, items);
  }, [fetchPages, nextCursor, items]);

  if ((isLoading || !isSettingsLoaded) && items.length === 0) {
    return <PageLoading />;
  }

  const hasMore = !exhausted && nextCursor;

  return (
    <React.Fragment>
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
          <Button variant='contained' color='secondary' onClick={handleLoadMore}>
            {translate('Action.LoadMore')}
          </Button>
        </Grid>
      )}
    </React.Fragment>
  );
};

export default withTranslation(AgeRestrictedExperiencesList, [TranslationNamespace.Creations]);
