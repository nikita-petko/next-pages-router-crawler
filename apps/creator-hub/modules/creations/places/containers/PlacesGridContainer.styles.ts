import { makeStyles } from '@rbx/ui';

const usePlacesGridContainerStyles = makeStyles()((theme) => ({
  buttonStyles: {
    marginTop: 48,
    marginBottom: 48,
    [theme.breakpoints.down('Medium')]: {
      marginLeft: 8,
    },
  },
}));

export default usePlacesGridContainerStyles;
