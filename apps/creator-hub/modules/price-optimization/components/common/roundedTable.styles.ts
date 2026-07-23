import { makeStyles } from '@rbx/ui';

const useRoundedTableStyles = makeStyles<{ hasTableHead: boolean }>()(
  (theme, { hasTableHead }) => ({
    table: {
      /* All this CSS is to get rounded corners on the table
       We can't use border-collapse: collapse because it doesn't work
       with an overall border radius on the table
       But using border-collapse separate will make borders thicker
       if they overlap.

       Trick is to instead specify each border only once,
       with no overlapping between cells
      */
      borderSpacing: 0,
      borderCollapse: 'separate',

      // Make all cells and header cells have a border
      // on right and bottom
      '& tbody td, & thead th': {
        borderRight: 'solid',
        borderRightWidth: '1px',
        borderRightColor: theme.palette.surface.outline,

        borderBottom: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: theme.palette.surface.outline,
      },

      // Make all cells in the first column have a left border
      // Have to specify thead and tbody to not affect table footer
      '& thead tr th:first-of-type, & tbody tr td:first-of-type': {
        borderLeft: 'solid',
        borderLeftWidth: '1px',
        borderLeftColor: theme.palette.surface.outline,
      },

      // Make all cells in the first row have a top border
      [`& tr:first-of-type ${hasTableHead ? 'th' : 'td'}`]: {
        borderTop: 'solid',
        borderTopWidth: '1px',
        borderTopColor: theme.palette.surface.outline,
      },

      // Round the corners of the 4 corner cells
      [`& tr:first-of-type ${hasTableHead ? 'th' : 'td'}:first-of-type`]: {
        borderTopLeftRadius: '8px',
      },
      [`& tr:first-of-type ${hasTableHead ? 'th' : 'td'}:last-child`]: {
        borderTopRightRadius: '8px',
      },
      '& tr:last-child td:first-of-type': {
        borderBottomLeftRadius: '8px',
      },
      '& tr:last-child td:last-of-type': {
        borderBottomRightRadius: '8px',
      },
    },
  }),
);

export default useRoundedTableStyles;
