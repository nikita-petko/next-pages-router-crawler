import { makeStyles } from '@rbx/ui';

const useCommunicationSettingsFormStyles = makeStyles()((theme) => ({
  outerGrid: {
    columnGap: 16,
  },

  option: {
    display: 'flex',
    alignItems: 'center',
  },

  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
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

  saveButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  tooltipIcon: {
    verticalAlign: 'bottom',
  },

  channelContainer: {
    gap: 8,
  },
}));

export default useCommunicationSettingsFormStyles;
