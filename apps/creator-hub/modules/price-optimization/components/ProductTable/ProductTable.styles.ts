import { makeStyles } from '@rbx/ui';

const useProductTableStyles = makeStyles()(() => ({
  searchContainer: {
    display: 'flex',
    gap: '12px',
  },
  searchIcon: {
    marginLeft: '14px',
  },
}));

export default useProductTableStyles;
