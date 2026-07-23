import { makeStyles } from '@rbx/ui';

const useConfigureGenericFormStyles = makeStyles()((theme) => ({
  button: {
    marginRight: 12,
  },

  buttonContainer: {
    padding: '32px 0',
  },

  divider: {
    marginBottom: 48,
    marginTop: 48,
  },

  errorMessageContainer: {
    color: theme.palette.actionV2.important.fill,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    width: '100%',
  },

  formContainer: {
    flexWrap: 'nowrap',
    gridGap: 12,
    [theme.breakpoints.down('Large')]: {
      flexWrap: 'wrap',
    },
  },

  imageContainer: {
    [theme.breakpoints.down('Large')]: {
      order: -1,
      paddingBottom: 24,
    },
  },

  pageContainer: {
    gridGap: 40,
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },

  subtitleContainer: {
    paddingBottom: 12,
    marginTop: 40,
  },
}));

export default useConfigureGenericFormStyles;
