import { makeStyles } from '@rbx/ui';

const useCommonTableStyles = makeStyles()((theme) => ({
  borderedTable: {
    width: '100%',
    tableLayout: 'fixed',
    border: `1px solid ${theme.palette.components.divider}`,
    borderCollapse: 'separate',
    borderSpacing: 0,
    borderRadius: theme.border.radius.medium.borderRadius,
    '& thead tr:first-of-type th': {
      '&:first-of-type': {
        borderTopLeftRadius: theme.border.radius.medium.borderRadius,
      },
      '&:last-of-type': {
        borderTopRightRadius: theme.border.radius.medium.borderRadius,
      },
    },
    '& tbody tr:last-of-type td': {
      borderBottom: 'none',
      '&:first-of-type': {
        borderBottomLeftRadius: theme.border.radius.medium.borderRadius,
      },
      '&:last-of-type': {
        borderBottomRightRadius: theme.border.radius.medium.borderRadius,
      },
    },
    '& th, & td': {
      border: 'none',
      borderBottom: `1px solid ${theme.palette.components.divider}`,
    },
  },
}));

export default useCommonTableStyles;
