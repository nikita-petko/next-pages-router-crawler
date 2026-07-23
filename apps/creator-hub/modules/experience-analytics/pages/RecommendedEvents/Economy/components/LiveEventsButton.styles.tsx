import { makeStyles } from '@rbx/ui';

const useLiveEventsButtonStyles = makeStyles()(() => ({
  button: {
    '& .MuiButton-endIcon svg': {
      fontSize: '12px',
    },
  },
}));

export default useLiveEventsButtonStyles;
