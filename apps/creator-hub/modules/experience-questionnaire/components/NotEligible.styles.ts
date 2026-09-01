import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useNotEligibleStyles = makeStyles()((theme) => ({
  root: {
    ...fullWidthHeight,
    background: theme.palette.background.default,
  },

  background: {
    maxWidth: `1024px`,
  },

  loggedinErrorArea: {
    padding: theme.spacing(2, 2, 4),
  },

  textHeader: {
    paddingBottom: theme.spacing(1),
  },
}));

export default useNotEligibleStyles;
