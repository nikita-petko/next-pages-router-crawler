import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useApiKeysContainerStyles = makeStyles()((theme) => ({
  title: {
    marginBottom: 16,
  },

  section: {
    ...fullWidthHeight,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },

  credentialsContainer: {
    marginTop: 0,
  },

  credentialsTable: {
    width: '100%',
    height: '100%',
  },

  container: {
    height: '100%',
  },
}));

export default useApiKeysContainerStyles;
