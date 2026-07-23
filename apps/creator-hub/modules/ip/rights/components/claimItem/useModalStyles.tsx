import { makeStyles } from '@rbx/ui';

const useModalStyles = makeStyles()(() => {
  return {
    buttonContainer: {
      display: 'flex',
      padding: '12px',
    },
    buttonContainerEnd: {
      display: 'flex',
      padding: '12px',
      justifyContent: 'flex-end',
    },
    buttonSuccess: {
      backgroundColor: '#335FFF',
      color: '#fff',
    },
    container: {
      padding: '20px',
    },
    radioItem: {
      padding: '16px',
    },
    hiddenContainer: {
      display: 'none',
    },
    iconContainer: {
      paddingLeft: '18px',
      paddingRight: '18px',
    },
    errorText: {
      color: '#F45B52',
    },
  };
});

export default useModalStyles;
