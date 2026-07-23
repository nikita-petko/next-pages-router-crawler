import { makeStyles } from '@rbx/ui';

const usePlaceIconFormStyles = makeStyles()((theme) => ({
  placeIconContainer: {
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      padding: 12,
    },
  },

  iconCandidateImageContainer: {
    backgroundPosition: 'top',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    width: 150,
    aspectRatio: '1',
    backgroundColor: theme.palette.surface[400],
    ...theme.border.radius.medium,
  },
}));

export default usePlaceIconFormStyles;
