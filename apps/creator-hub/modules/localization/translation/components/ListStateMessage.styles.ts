import { makeStyles } from '@rbx/ui';

const useListStateMessageStyles = makeStyles()((theme) => ({
  textGrid: {
    marginTop: theme.spacing(4),
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(4),
  },

  upperGrid: {
    marginBottom: theme.spacing(1),
  },

  text: {
    textAlign: 'center',
  },
}));

export default useListStateMessageStyles;
