import { makeStyles } from '@rbx/ui';

const useGenericTableRowStyles = makeStyles()((theme) => ({
  tableRowContainer: {
    [theme.breakpoints.down('Medium')]: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      marginBottom: '20px',
    },
  },
  hoverEnabled: {
    '& .action-icons.hover-hide': {
      opacity: 0,
    },
    '&:hover': {
      '& .action-icons': {
        opacity: 1,
      },
      '& > td:last-of-type': {
        // The following background colors are chosen to simulate a 'hover' effect without using alpha transparency,
        // and are picked to best match the theme's background. The default hover color uses semi-transparency,
        // but for the sticky last column, we want a solid color so it appears clearly above overlapping cells.
        backgroundColor:
          theme.palette.mode === 'dark' ? '#1F2025 !important' : '#EDEEEF !important',
      },
    },
  },
  selected: {
    backgroundColor: theme.palette.mode === 'dark' ? '#1F2025 !important' : '#EDEEEF !important',
  },
}));

export default useGenericTableRowStyles;
