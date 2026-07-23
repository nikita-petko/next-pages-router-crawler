import { makeStyles } from '@rbx/ui';

const useBenchmarkScoreCardStyles = makeStyles()((theme) => {
  return {
    card: {
      minWidth: '280px',
      '&:hover': {
        borderColor: '#696a6d', // To match hover border of WhatsNew.tsx tile
      },
      backgroundColor: theme.palette.surface[0],
    },
    cardActionArea: {
      padding: '24px',
    },
    cardActionAreaNotClickable: {
      cursor: 'default',
    },
    cardActionFocusHighlightHidden: {
      display: 'none',
    },
    cardHeader: {
      padding: 0,
    },
    cardSubHeader: {
      marginTop: '2px',
    },
    cardContent: {
      padding: '16px 0 0',
    },
  };
});

export default useBenchmarkScoreCardStyles;
