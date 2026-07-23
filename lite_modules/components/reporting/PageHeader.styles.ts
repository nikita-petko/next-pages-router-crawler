import { makeStyles } from '@rbx/ui';

const usePageHeaderStyles = makeStyles()(() => ({
  bodyContainer: {
    marginBottom: '24px',
    rowGap: '24px',
  },

  filteredMessage: {
    '& a': {
      color: 'inherit',
      textDecoration: 'underline',
    },
    border: 'none',
    marginLeft: 'auto',
  },

  pickerContainer: {
    gap: '12px',
    rowGap: '12px',
  },

  searchCreateRow: {
    gap: '36px',
    justifyContent: 'space-between',
  },

  searchDownloadContainer: {
    gap: '12px',
  },
}));

export default usePageHeaderStyles;
