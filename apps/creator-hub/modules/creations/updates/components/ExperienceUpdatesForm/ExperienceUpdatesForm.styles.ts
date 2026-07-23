import { makeStyles } from '@rbx/ui';

const useExperienceUpdatesFormStyles = makeStyles()((theme) => ({
  sendButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.error.main,
    fontWeight: 'bold',
    fontSize: 12,
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  updateDescriptionContainer: {
    marginTop: 16,
    marginBottom: 48,
  },

  textFieldContainer: {
    marginBottom: 24,
  },
}));

export default useExperienceUpdatesFormStyles;
