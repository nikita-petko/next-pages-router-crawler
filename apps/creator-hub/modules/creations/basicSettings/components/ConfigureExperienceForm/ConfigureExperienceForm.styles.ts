import { makeStyles } from '@rbx/ui';

const useConfigureExperienceFormStyles = makeStyles()((theme) => ({
  configureButton: {
    margin: '0 12px',
    [theme.breakpoints.down('Large')]: {
      margin: '12px 0',
    },
  },

  pageContainer: {
    width: '100%',
    height: '100%',
    minHeight: 450,
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

  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 32,
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  helperMessageStyles: {
    width: '100%',
    marginTop: 3,
    marginLeft: 14,
    marginRight: 14,
    fontSize: 14,
  },

  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },

  radioLabel: {
    paddingRight: 4,
  },

  tooltipIcon: {
    verticalAlign: 'bottom',
  },

  genreContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    [theme.breakpoints.down('Small')]: {
      flexDirection: 'column',
    },
  },

  dropdownMenuList: {
    maxHeight: 350,
  },

  // Alert component doesn't center text correctly if just a title is provided
  warningAlertStyles: {
    display: 'flex',
    alignItems: 'center',
  },

  switchStyle: {
    paddingLeft: 10,
    paddingTop: 8,
  },

  alertButton: { textWrap: 'nowrap' },

  actionButtonContainer: {
    alignSelf: 'center',
    whiteSpace: 'nowrap',
    marginTop: '-6px',
  },
  actionButtonCheckEligibility: {
    alignSelf: 'center',
    whiteSpace: 'nowrap',
    marginTop: '-6px',
    [theme.breakpoints.down('Large')]: {
      whiteSpace: 'normal',
      minWidth: '100px',
    },
  },
}));

export default useConfigureExperienceFormStyles;
