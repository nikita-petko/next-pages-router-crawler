import { TTileStyleConfig } from '@modules/experience-analytics-shared';
import { makeStyles } from '@rbx/ui';

const useWatchlistDragAndDropItemStyles = makeStyles<{ styleConfig: TTileStyleConfig }>()(
  (_, { styleConfig }) => ({
    dragAndDropItem: {
      maxWidth: `${styleConfig.maxWidth}px`,
      minWidth: `${styleConfig.minWidth}px`,
    },
  }),
);

export default useWatchlistDragAndDropItemStyles;
