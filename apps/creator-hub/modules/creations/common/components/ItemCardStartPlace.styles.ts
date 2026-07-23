import { makeStyles } from '@rbx/ui';

const useItemCarStartPlaceStyles = makeStyles()((theme) => ({
  divStyle: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  typographyStyle: {
    paddingLeft: 4,
    color: theme.palette.text.secondary,
  },
}));

export default useItemCarStartPlaceStyles;
