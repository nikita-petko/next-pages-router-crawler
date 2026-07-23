import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useCreationsStyles = makeStyles()((theme) => ({
  section: {
    ...fullWidthHeight,
  },

  container: {
    ...fullWidthHeight,
  },

  title: {
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('Medium')]: {
      padding: theme.spacing(0, 1),
    },
  },

  checkedDeleteIconContainer: {
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.25),
    padding: 0,
  },
}));

export default useCreationsStyles;
