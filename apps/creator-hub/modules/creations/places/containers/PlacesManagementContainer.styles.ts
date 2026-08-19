import { makeStyles } from '@rbx/ui';

const usePlacesManagementContainerStyles = makeStyles()((theme) => ({
  gridContainer: {
    '& > *': {
      marginTop: 48,
      marginBottom: 24,
    },
    [theme.breakpoints.down('Medium')]: {
      marginLeft: 12,
      marginRight: 12,
    },
  },

  buttonStyles: {
    marginTop: 24,
  },
}));

export default usePlacesManagementContainerStyles;
