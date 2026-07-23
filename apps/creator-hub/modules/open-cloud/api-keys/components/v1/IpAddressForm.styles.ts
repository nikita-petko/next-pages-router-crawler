import { makeStyles } from '@rbx/ui';

const useIpAddressFormStyles = makeStyles()((theme) => ({
  root: {
    flexGrow: 1,
  },

  chip: {
    marginRight: 8,
    marginBottom: 8,
  },

  header: {
    marginBottom: 8,
    marginTop: 16,
  },

  subHeading: {
    marginBottom: 8,
  },

  button: {
    marginLeft: 8,
    [theme.breakpoints.down('Medium')]: {
      marginTop: 8,
      marginLeft: 0,
    },
  },

  buttonWrapper: {
    flexShrink: 0,
  },

  ipAddressFormInput: {
    marginBottom: 16,
  },

  ipBoxGrid: {
    padding: 16,
    minHeight: '200px', // Copy min height of Empty Grid
  },
}));

export default useIpAddressFormStyles;
