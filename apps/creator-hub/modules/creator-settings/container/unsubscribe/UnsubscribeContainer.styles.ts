import { makeStyles } from '@rbx/ui';

const useUnsubscribeContainerStyles = makeStyles()((theme) => ({
  divider: {
    color: theme.palette.components.divider,
  },
  container: {
    rowGap: 24,
    maxWidth: 1200,
    width: 'fit-content',
    [theme.breakpoints.down('Medium')]: {
      padding: 12,
    },
    [theme.breakpoints.down('XLarge')]: {
      maxWidth: 900,
    },
  },
  titleGap: {
    rowGap: 16,
  },
  buttonGap: {
    gap: 12,
  },
  // NOTE (@mbae, 05/13/24): This is a temporary fix since AppLayout's applies 0 padding for things bigger than lg via fullWidthContentV2 for some reason
  unauthenticated: {
    padding: 32,
    [theme.breakpoints.down('XLarge')]: {
      padding: 0,
    },
  },
}));

export default useUnsubscribeContainerStyles;
