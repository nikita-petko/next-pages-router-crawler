import { makeStyles } from '@rbx/ui';

const useUnlockServiceFormStyles = makeStyles()((theme) => {
  return {
    formContainer: {
      marginTop: 48,
    },
    buttonContainer: {
      padding: '48px 0',
      gap: 12,
      flexDirection: 'row',
      [theme.breakpoints.down('Large')]: {
        flexDirection: 'column',
      },
    },
    accordion: {
      width: '100%',
      borderRadius: '0 0 0 0',
      // Avoid double border where accordions touch: only the first has a top border
      '& + &': {
        borderTopWidth: 0,
      },
    },
    serviceFormContainer: {
      paddingLeft: 32,
      paddingRight: 32,
    },
    divider: {
      marginTop: 16,
      marginBottom: 16,
    },
    premiumAlert: {
      alignItems: 'center',
    },
    premiumButton: {
      alignItems: 'center',
      paddingBottom: '20px',
    },
    accordionTitle: {
      fontWeight: 'bold',
    },
  };
});

export default useUnlockServiceFormStyles;
