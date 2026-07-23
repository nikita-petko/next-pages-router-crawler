import { makeStyles } from '@rbx/ui';

const useFilterStyles = makeStyles()((theme) => ({
  filtered: {
    zIndex: 1,
  },

  notFiltered: {
    left: 10,
  },

  text: {
    marginLeft: -13,
    marginTop: -16,
    color: theme.palette.media.secondaryBackground,
    zIndex: 3,
  },

  circle: {
    marginLeft: -22,
    marginBottom: 16,
    zIndex: 2,
  },
}));

export default useFilterStyles;
