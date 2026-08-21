import { makeStyles } from '@rbx/ui';

import { textEllipsisTypographyStyles } from '@constants/genericManagementTableStyles';
import { paddingUnit } from '@constants/styleConstants';

const useTableNameCellStyles = makeStyles<{ minWidthPx?: number }>()((_, { minWidthPx }) => ({
  autoReloadIcon: {
    paddingRight: paddingUnit,
  },

  autoReloadIconTooltip: {
    width: '171px',
  },

  nameCellMinWidth: minWidthPx != null && minWidthPx > 0 ? { minWidth: minWidthPx } : {},

  nameTextGridItem: {
    minWidth: 0,
    overflow: 'hidden',
  },

  textEllipsisTypography: {
    ...textEllipsisTypographyStyles,
    '&:hover': {
      textDecoration: 'underline',
    },
    cursor: 'pointer',
  },

  /** When the name column has a measured min width, drop 35vw cap so text fills the column. */
  textEllipsisTypographyMeasured: {
    '&:hover': {
      textDecoration: 'underline',
    },
    cursor: 'pointer',
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export default useTableNameCellStyles;
