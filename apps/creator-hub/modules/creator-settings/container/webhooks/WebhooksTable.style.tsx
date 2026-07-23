import { makeStyles } from '@rbx/ui';

const useWebhooksTableStyles = makeStyles()((theme) => ({
  divider: {
    marginTop: 20,
    marginBottom: 20,
  },

  listText: {
    marginLeft: 20,
    maxWidth: 650,
    [theme.breakpoints.down('Large')]: {
      width: 350,
    },
    [theme.breakpoints.down('Medium')]: {
      width: 200,
    },
  },
}));

export default useWebhooksTableStyles;
