import { makeStyles } from '@rbx/ui';

const useDynamicPriceCheckPageContentStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  headingGapSmall: {
    marginBottom: '8px',
  },
  textGapMedium: {
    marginBottom: '12px',
  },
  bodyContent: {
    marginTop: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '784px',
  },
}));

export default useDynamicPriceCheckPageContentStyles;
