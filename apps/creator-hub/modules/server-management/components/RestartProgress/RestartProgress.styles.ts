import { makeStyles } from '@rbx/ui';

const useRestartProgressStyles = makeStyles()((theme) => ({
  card: {
    padding: theme.spacing(2),
    minHeight: theme.spacing(20),
  },
  stepperContainer: {
    padding: theme.spacing(1, 0),
    '& .MuiStepLabel-label': {
      fontSize: theme.spacing(2),
    },
  },
  greyIcon: {
    color: theme.palette.states.active,
  },
  stepDescription: {
    fontSize: theme.spacing(1.75),
    lineHeight: 1.4,
    '& > div': {
      marginBottom: theme.spacing(0.25),
    },
    '& > div:last-child': {
      marginBottom: 0,
    },
  },
}));

export default useRestartProgressStyles;
