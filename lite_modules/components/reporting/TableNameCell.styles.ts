import { makeStyles, tooltipClasses } from '@rbx/ui';

import { textEllipsisTypographyStyles } from '@constants/genericManagementTableStyles';
import { paddingUnit } from '@constants/styleConstants';

const useTableNameCellStyles = makeStyles<{ minWidthPx?: number }>()((theme, { minWidthPx }) => ({
  autoReloadIcon: {
    paddingRight: paddingUnit,
  },

  autoReloadIconTooltip: {
    width: '171px',
  },

  copyIcon: {
    color: theme.palette.content.inverse,
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

  tooltipContent: {
    alignSelf: 'center',
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
    padding: 0,
    whiteSpace: 'nowrap',
  },

  tooltipPopper: {
    [`& .${tooltipClasses.tooltip}`]: {
      margin: 0,
      minWidth: 'fit-content',
    },
  },

  tooltipText: {
    marginBottom: 'auto',
    marginTop: 'auto',
  },
}));

export default useTableNameCellStyles;
