import { makeStyles } from '@rbx/ui';

const usePaidAccessTransactionsStyles = makeStyles()(() => ({
  fullWidth: {
    width: '100%',
  },
  experienceDropdown: {
    minWidth: '200px',
  },
  gridActionItem: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  thumbnailContainer: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
  },
  dropdownMenu: {
    maxHeight: '400px',
  },
}));

export default usePaidAccessTransactionsStyles;
