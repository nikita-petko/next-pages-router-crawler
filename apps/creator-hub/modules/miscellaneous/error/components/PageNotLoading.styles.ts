import { makeStyles } from '@rbx/ui';

const usePageNotLoadingStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },

  message: {
    margin: theme.spacing(2, 0),
  },

  button: {
    width: 200,
  },
}));

export default usePageNotLoadingStyles;
