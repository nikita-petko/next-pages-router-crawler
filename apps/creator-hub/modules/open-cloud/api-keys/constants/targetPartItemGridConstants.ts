import type { TTheme } from '@rbx/ui';
import type ItemGridCSSProperties from '../../common/interfaces/ItemGridCSSProperties';
import type ItemGridStaticConfigProperties from '../../common/interfaces/ItemGridStaticConfigProperties';

const getNewPageSize = (numColumns: number, numRows: number) => {
  return numColumns * numRows;
};
const getNewLoadPageSize = (newPageSize: number) => (newPageSize < 25 ? 25 : 50);

const getNumColumns = (
  gridWidth: number,
  itemGridCSSProperties: ItemGridCSSProperties,
  compact: boolean,
  theme: TTheme,
) => {
  const { gridItemMinWidth, minNumberOfColumns, gridGapValue, gridGapCompactValue } =
    itemGridCSSProperties;

  const gridSize =
    gridWidth -
    // Outside padding
    parseInt(compact ? theme.spacing(gridGapCompactValue) : theme.spacing(gridGapValue), 10) * 2 +
    // Grid only applies spacing in between columns, add one more gridGap so we divide properly
    parseInt(compact ? theme.spacing(gridGapCompactValue) : theme.spacing(gridGapValue), 10);

  // const gridItemWidthWithPadding =
  //   gridItemMinWidth + (compact ? theme.spacing(gridGapCompactValue) : theme.spacing(gridGapValue));

  return Math.max(Math.floor(gridSize / gridItemMinWidth), minNumberOfColumns);
};

const targetPartItemGridConstants: ItemGridStaticConfigProperties = {
  itemGridCSSProperties: {
    minNumberOfColumns: 1,
    gridGapValue: 0.5,
    gridGapCompactValue: 1,
    gridItemMinWidth: 375,
  },
  itemGridCursorPagerProperties: {
    pageSizeInitialValue: 10,
    loadPageSizeInitialValue: 20,
    getNewPageSize,
    getNewLoadPageSize,
    getNumColumns,
    numberOfRows: 3,
  },
};

export default targetPartItemGridConstants;
