import { makeStyles } from '@rbx/ui';
import type ItemGridCSSProperties from '../interfaces/ItemGridCSSProperties';

const useItemsStyles = (properties: ItemGridCSSProperties) => {
  const { gridGapValue, gridItemMinWidth, minNumberOfColumns, gridGapCompactValue } = properties;
  return makeStyles()((theme) => ({
    itemGrid: {
      marginTop: theme.spacing(2),
      display: 'grid',
      gridGap: theme.spacing(gridGapValue),
      gridTemplateColumns: `repeat(auto-fill, minmax(${gridItemMinWidth}px, 1fr))`,
      // Don't go below the minimum number of columns
      [theme.breakpoints.down(gridItemMinWidth * (minNumberOfColumns + 1))]: {
        gridTemplateColumns: `repeat(auto-fill, calc((100% - ${theme.spacing(
          gridGapCompactValue,
        )}) / ${minNumberOfColumns}))`,
      },
      [theme.breakpoints.down('Medium')]: {
        padding: theme.spacing(0, 1),
        marginTop: theme.spacing(1),
        gridGap: theme.spacing(gridGapCompactValue),
      },
    },

    errorBtn: {
      marginTop: theme.spacing(1),
    },

    retryMessage: {
      marginRight: theme.spacing(1),
    },
  }));
};

export default useItemsStyles;
