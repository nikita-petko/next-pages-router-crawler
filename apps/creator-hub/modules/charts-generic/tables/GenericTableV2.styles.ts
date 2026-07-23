import { makeStyles } from '@rbx/ui';

const useGenericRAQIV2TableContentStyles = makeStyles()((theme) => ({
  tableLayout: {
    tableLayout: 'fixed',
    overflowX: 'auto',
  },

  withColumnDivider: {
    [theme.breakpoints.up('Medium')]: {
      borderTop: `1px solid ${theme.palette.components.divider}`,
      '& tr > td, th': {
        borderRight: `1px solid ${theme.palette.components.divider}`,
      },
    },
  },

  stickyFirstCellInRow: {
    '& tr > td:first-of-type': {
      [theme.breakpoints.between('Medium', 'XLarge')]: {
        position: 'sticky',
        left: 0,
        background: theme.palette.surface[0],
        zIndex: 10,
        boxShadow: `4px 0px 2px -2px rgba(0, 0, 0, 0.7)`,
        borderRight: 'none',
      },
    },
  },

  stickyLastCellInRow: {
    '& tr > td:last-of-type': {
      position: 'sticky',
      right: 0,
      zIndex: 10,
      boxShadow: `4px 0px 2px -2px rgba(0, 0, 0, 0.7)`,
    },
  },

  tableContainerBorder: {
    [theme.breakpoints.up('Medium')]: {
      ...theme.border.radius.large,
      border: `1px solid ${theme.palette.components.divider}`,
    },
    [theme.breakpoints.between('Medium', 'XLarge')]: {
      borderRight: 'none',
    },
  },

  tabbedTableContainer: {
    [theme.breakpoints.up('Medium')]: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
  },
}));

export default useGenericRAQIV2TableContentStyles;
