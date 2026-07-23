import { makeStyles } from '@rbx/ui';

const useBenchmarkScoreCardStyles = makeStyles()(() => {
  return {
    card: {
      minWidth: '280px',
      '&:hover': {
        borderColor: '#696a6d', // To match hover border of WhatsNew.tsx tile
      },
      backgroundColor: 'var(--color-surface-0)',
    },
    cardActionArea: {
      padding: 'var(--padding-xlarge)',
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
