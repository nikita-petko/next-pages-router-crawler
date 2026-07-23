import { makeStyles } from '@rbx/ui';

const usePlaceAccessFormStyles = makeStyles()((theme) => ({
  subtitle: {
    marginBottom: 24,
  },

  subtitleAccessControl: {
    marginBottom: 12,
  },

  divider: {
    marginTop: 48,
    marginBottom: 32,
  },

  button: {
    marginRight: 12,
    [theme.breakpoints.down('Large')]: {
      marginRight: 0,
      marginBottom: 12,
    },
  },

  error: {
    padding: '4px 12px',
  },

  info: {
    marginLeft: 8,
    display: 'flex',
  },

  radioGroup: {
    paddingLeft: 12,
    maxWidth: 'fit-content',
  },

  customSlots: {
    [theme.breakpoints.up('Large')]: {
      minWidth: 480,
    },
    marginTop: 24,
  },

  maxPlayer: {
    [theme.breakpoints.up('Large')]: {
      minWidth: 480,
    },
  },

  container: {
    [theme.breakpoints.down('Large')]: {
      padding: 12,
    },
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
  },

  switchStyle: {
    paddingLeft: 10,
    paddingTop: 8,
  },

  placeJoinRestrictionSwitchStyle: {
    paddingLeft: 10,
  },

  paymentSelectionLabel: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },

  paymentSelectionContainer: {
    alignItems: 'start',
  },

  placeJoinRestrictionLabel: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },

  placeJoinRestrictionContainer: {
    alignItems: 'start',
  },
}));

export default usePlaceAccessFormStyles;
