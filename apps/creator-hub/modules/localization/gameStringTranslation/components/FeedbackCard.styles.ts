import { makeStyles } from '@rbx/ui';

const useFeedbackCardStyles = (numOfCards = 2) => {
  return makeStyles()((theme) => ({
    card: {
      width: `${Math.round(100 / numOfCards - 1)}%`,
      margin: 2,
      display: 'flex',
      flexDirection: 'column',
    },

    text: {
      marginBottom: 15,
      marginTop: 5,
      whiteSpace: 'pre-line',
    },

    button: {
      marginBottom: 10,
      marginRight: 10,
      marginTop: 'auto',
      padding: 5,
      justifyContent: 'flex-end',
    },
  }));
};

export default useFeedbackCardStyles;
