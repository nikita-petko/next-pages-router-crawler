import { makeStyles } from '@rbx/ui';

const useSubscriptionFormStyles = makeStyles()((theme) => {
  return {
    formContainer: {
      width: '100%',
      '& > *:not(:last-child)': {
        paddingBottom: 48,
      },
      [theme.breakpoints.down('Medium')]: {
        paddingLeft: 12,
        paddingRight: 12,
      },
    },

    createProductInfoText: {
      marginTop: 16,
      overflow: 'auto',
    },

    inputFormPadding: {
      width: '100%',
      '& > *:not(:last-child)': {
        paddingBottom: 32,
      },
    },

    createButton: {
      marginLeft: 12,
      [theme.breakpoints.down('Medium')]: {
        marginLeft: 0,
        marginTop: 12,
      },
    },

    bottomGrid: {
      paddingBottom: 64,
    },

    errorMessageStyle: {
      marginTop: 5,
      marginLeft: 5,
    },

    buttonContainerStyle: {
      marginTop: 32,
    },

    copyIconStyle: {
      marginLeft: 5,
    },
    platformFeeBanner: {
      backgroundColor: theme.palette.components.alert.informFill,
      borderRadius: '0 0 8px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertText: {
      color: theme.palette.components.alert.informContent,
      textAlign: 'center',
    },
    celebrationIconColor: {
      color: theme.palette.components.alert.informContent,
    },
    revshareCard: {
      width: '100%',
      paddingLeft: 32,
      '& > *:not(:last-child)': {
        paddingBottom: 64,
      },
      [theme.breakpoints.down('Large')]: {
        padding: 0,
      },
    },
    revshareCardContent: {
      '&, &:last-child': {
        padding: 32,
      },
    },
    revshareCardHeading: {
      fontSize: 20,
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: -0.2,
      color: theme.palette.content.standard,
      paddingBottom: 24,
    },
    tabsContainer: {
      margin: -14,
      paddingBottom: 20,
    },
    revshareCardTab: {
      whiteSpace: 'nowrap',
      width: '50%',
      padding: 0,
    },
    revshareTextBox: {
      whiteSpace: 'nowrap',
      padding: 0,
      margin: 0,
    },
    mutedText: {
      color: theme.palette.content.muted,
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 1.3,
      textAlign: 'left',
    },
    boxGrid: {
      margin: 0,
      padding: 0,
    },
    robuxIconStyle: {
      verticalAlign: 'middle',
      marginBottom: 2,
    },
    toolTipInfoIcon: {
      marginLeft: 4,
      verticalAlign: 'middle',
    },
    revsharePriceText: {
      textAlign: 'left',
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(3),
    },
    subSectionTitle: {
      fontWeight: 700,
      marginBottom: 8,
    },
    radioButtonOptionText: {
      fontWeight: 700,
      marginBottom: 2,
    },
    boldBodyText: {
      fontWeight: 700,
    },
    checkboxIconContainer: {
      width: 32,
      display: 'flex',
      justifyContent: 'flex-start',
    },
    optionalSubSectionContainer: (() => {
      const marginLeft = 36;
      return {
        backgroundColor: 'rgba(208, 217, 251, 0.08)',
        marginLeft,
        borderRadius: 8,
        padding: '4px 20px 20px 4px',
        width: `calc(100% - ${marginLeft}px)`,
      };
    })(),
    textInputValidationHelperText: {
      marginTop: '8px',
      display: 'block',
    },
    largeGapItem: {
      marginTop: 16,
    },
    disabledRadioText: {
      '& *': {
        color: `${theme.palette.content.disabled} !important`,
      },
    },
    colorContentDefault: {
      color: '#d5d7dd',
    },
  };
});

export default useSubscriptionFormStyles;
