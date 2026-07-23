import { makeStyles } from '@rbx/ui';

const usePreferencesContainerStyles = makeStyles()((theme) => ({
  root: {
    [theme.breakpoints.down('Medium')]: {
      padding: 12,
    },
  },
  title: {
    marginBottom: 48,
  },
  section: {
    marginBottom: 48,
  },
  // NOTE (@mbae, 05/13/24): This is a temporary fix since AppLayout's applies 0 padding for things bigger than lg via fullWidthContentV2 for some reason
  unauthenticated: {
    padding: 32,
    [theme.breakpoints.down('XLarge')]: {
      padding: 0,
    },
  },
}));

export default usePreferencesContainerStyles;
