import { makeStyles } from '@rbx/ui';
import {
  imgSize,
  wideImgSize,
  numberOfColumnsCompact,
  gridGapThemeValue,
  gridGapThemeValueCompact,
} from '../constants/commonConstants';

const useItemsStyles = makeStyles<{ useWideIcons: boolean }>()((theme, { useWideIcons }) => ({
  itemGrid: {
    marginTop: theme.spacing(2),
    display: 'grid',
    gridGap: theme.spacing(gridGapThemeValue),
    gridTemplateColumns: `repeat(auto-fill, minmax(${
      useWideIcons ? wideImgSize : imgSize
    }px, 1fr))`,
    // Don't go below the minimum number of columns
    [theme.breakpoints.down(imgSize * (numberOfColumnsCompact + 1))]: useWideIcons === false && {
      gridTemplateColumns: `repeat(auto-fill, calc((100% - ${theme.spacing(
        gridGapThemeValueCompact,
      )}) / ${numberOfColumnsCompact}))`,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: theme.spacing(0, 1),
      marginTop: theme.spacing(1),
      gridGap: theme.spacing(gridGapThemeValueCompact),
    },
  },

  itemGridContent: {
    flexGrow: 1,
    minHeight: 450,
  },
}));

export default useItemsStyles;
