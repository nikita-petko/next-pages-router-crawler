import { makeStyles } from '@rbx/ui';

export const useRoundedTableStyles = makeStyles()((theme) => ({
  table: {
    borderSpacing: 0,
    borderCollapse: 'separate',

    [`& tr:first-of-type th`]: {
      borderTop: `1px solid ${theme.palette.surface.outline}`,
    },
    '& tbody td, & thead th': {
      borderBottom: `1px solid ${theme.palette.surface.outline}`,
    },
    '& thead tr th:first-of-type, & tbody tr td:first-of-type': {
      borderLeft: `1px solid ${theme.palette.surface.outline}`,
    },
    '& thead tr th:last-of-type, & tbody tr td:last-of-type': {
      borderRight: `1px solid ${theme.palette.surface.outline}`,
    },

    [`& tr:first-of-type th:first-of-type`]: {
      borderTopLeftRadius: '8px',
    },
    [`& tr:first-of-type th:last-child`]: {
      borderTopRightRadius: '8px',
    },
    '& tr:last-child td:first-of-type': {
      borderBottomLeftRadius: '8px',
    },
    '& tr:last-child td:last-of-type': {
      borderBottomRightRadius: '8px',
    },
  },
}));
