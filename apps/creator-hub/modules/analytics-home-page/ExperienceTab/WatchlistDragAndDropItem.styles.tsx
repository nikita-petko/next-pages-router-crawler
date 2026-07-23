import { makeStyles } from '@rbx/ui';
import type { TTileStyleConfig } from '@modules/experience-analytics-shared/constants/tileConstants';

const useWatchlistDragAndDropItemStyles = makeStyles<{ styleConfig: TTileStyleConfig }>()(
  (_, { styleConfig }) => ({
    dragAndDropItem: {
      maxWidth: `${styleConfig.maxWidth}px`,
      minWidth: `${styleConfig.minWidth}px`,
    },
  }),
);

export default useWatchlistDragAndDropItemStyles;
