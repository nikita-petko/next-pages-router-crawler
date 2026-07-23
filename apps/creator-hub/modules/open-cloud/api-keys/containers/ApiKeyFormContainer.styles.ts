import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const useApiKeyFormContainerStyles = makeStyles()((theme) => ({
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
}));

export default useApiKeyFormContainerStyles;
