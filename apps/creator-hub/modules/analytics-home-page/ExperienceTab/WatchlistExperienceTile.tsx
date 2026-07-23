import React, { FC, useCallback, useRef, useState } from 'react';
import { CloseIcon, Fab } from '@rbx/ui';
import {
  AnalyticsExperienceTile,
  AnalyticsExperienceTileSpec,
  TWatchlistTileStyleConfig,
  useAnalyticsWatchlist,
} from '@modules/experience-analytics-shared';
import { useSortable } from '@dnd-kit/sortable';
import useWatchlistExperienceTileStyles from './WatchlistExperienceTile.styles';
import WatchlistExperienceTileMetricsContentV2 from './WatchlistExperienceTileMetricsContentV2';

export type WatchlistExperienceTileSpec = Omit<AnalyticsExperienceTileSpec, 'actionButton'> & {
  styleConfig: TWatchlistTileStyleConfig;
};

const WatchlistExperienceTile: FC<WatchlistExperienceTileSpec> = (spec) => {
  const { styleConfig, universeId } = spec;
  const {
    classes: { closeButton },
  } = useWatchlistExperienceTileStyles();
  const { removeItem } = useAnalyticsWatchlist();
  const [isHover, setIsHover] = useState(false);
  const containerRef = useRef(null);
  const { isDragging } = useSortable({ id: universeId.toString() });

  const onRemoveClick = useCallback<NonNullable<React.ComponentProps<typeof Fab>['onClick']>>(
    (e) => {
      e.preventDefault();
      removeItem(universeId.toString());
    },
    [removeItem, universeId],
  );

  const floatingCloseButton = isHover && (
    <Fab
      data-no-dnd
      aria-label='Add'
      color='secondary'
      variant='circular'
      size='small'
      className={closeButton}
      onClick={onRemoveClick}>
      <CloseIcon fontSize='small' />
    </Fab>
  );

  return (
    <div
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      ref={containerRef}>
      <AnalyticsExperienceTile
        {...spec}
        isDataLoading={false}
        isResponseFailed={false}
        isUserForbidden={false}
        floatingChildren={styleConfig.showWatchlistRemoveButton && floatingCloseButton}
        isDragging={isDragging}>
        <WatchlistExperienceTileMetricsContentV2
          universeId={universeId}
          styleConfig={styleConfig}
        />
      </AnalyticsExperienceTile>
    </div>
  );
};

export default WatchlistExperienceTile;
