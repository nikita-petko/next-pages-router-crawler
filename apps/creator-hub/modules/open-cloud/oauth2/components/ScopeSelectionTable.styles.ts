import { makeStyles } from '@rbx/ui';

const useScopeSelectionTableStyles = makeStyles()(() => ({
  table: {
    paddingTop: '32px',
    paddingBottom: '32px',
  },

  pagination: {
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    display: 'flex',
  },

  paginationToolbar: {
    padding: '0px',
  },
}));

export default useScopeSelectionTableStyles;
