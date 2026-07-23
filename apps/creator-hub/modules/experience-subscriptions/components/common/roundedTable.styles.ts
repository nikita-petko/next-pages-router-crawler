import { makeStyles } from '@rbx/ui';

const useRoundedTableStyles = makeStyles()((theme) => {
  const border = `1px solid ${theme.palette.surface.outline}`;
  const borderRadius = '8px';

  return {
    table: {
      borderSpacing: 0,
      borderCollapse: 'separate',

      // All cells get a bottom border
      '& thead th, & tbody td': {
        borderBottom: border,
      },

      // Top border only on header row
      '& thead tr:first-of-type th': {
        borderTop: border,
      },

      // Left border on first column
      '& thead th:first-of-type, & tbody td:first-of-type': {
        borderLeft: border,
      },

      // Right border on last column
      '& thead th:last-of-type, & tbody td:last-of-type': {
        borderRight: border,
      },

      // Rounded corners on the four outer corners
      '& thead tr:first-of-type th:first-of-type': {
        borderTopLeftRadius: borderRadius,
      },
      '& thead tr:first-of-type th:last-of-type': {
        borderTopRightRadius: borderRadius,
      },
      '& tbody tr:last-child td:first-of-type': {
        borderBottomLeftRadius: borderRadius,
      },
      '& tbody tr:last-child td:last-of-type': {
        borderBottomRightRadius: borderRadius,
      },
    },
  };
});

export default useRoundedTableStyles;
