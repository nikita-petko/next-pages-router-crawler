import { makeStyles } from '@rbx/ui';

const useCompositeAssetDependenciesTableStyles = makeStyles()((theme) => ({
  cellLink: {
    textDecoration: 'none',
  },
  cellLinkWithIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  tableContainer: {
    borderBottom: `1px solid ${theme.palette.components.divider}`,
    maxHeight: 365,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  table: {
    '& .MuiTableCell-root': {
      borderColor: theme.palette.components.divider,
      backgroundColor: theme.palette.surface[300],
    },
    // Remove the bottom border from the last row
    // This is to prevent the last row from having a double border
    '& tbody tr:last-child td': {
      borderBottom: 'none',
    },
    '& .MuiTableCell-stickyHeader': {
      backgroundColor: theme.palette.surface[300], // Same color as dialog background
      borderColor: theme.palette.components.divider,
    },
  },
  truncatedCell: {
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  truncatedText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

export default useCompositeAssetDependenciesTableStyles;
