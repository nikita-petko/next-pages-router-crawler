import { makeStyles } from '@rbx/ui';

const useWebhooksContainerStyles = makeStyles()((theme) => ({
  container: {
    [theme.breakpoints.down('Medium')]: {
      padding: 12,
    },
  },
}));

export default useWebhooksContainerStyles;
