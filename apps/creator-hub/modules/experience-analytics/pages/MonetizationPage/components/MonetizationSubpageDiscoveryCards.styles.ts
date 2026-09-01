import { makeStyles } from '@rbx/ui';

const useMonetizationSubpageDiscoveryCardsStyles = makeStyles<{ cardsEnabled: number }>()(
  (theme, { cardsEnabled }) => ({
    cardHeight: {
      height: '100%',
    },

    iconMargin: {
      margin: '16px',
    },

    textMargin: {
      margin: '2px 16px 14px 16px',
      display: 'block',
    },

    grid: {
      display: 'grid',
      [theme.breakpoints.up('XLarge')]: {
        gridTemplateColumns: `repeat(${cardsEnabled}, 1fr)`,
      },
      [theme.breakpoints.between('Medium', 'XLarge')]: {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
      [theme.breakpoints.between('XSmall', 'Medium')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      gridAutoRows: 'min-content',
      gridGap: '12px',
    },

    linkNoUnderline: {
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'none',
      },
    },
  }),
);
export default useMonetizationSubpageDiscoveryCardsStyles;
