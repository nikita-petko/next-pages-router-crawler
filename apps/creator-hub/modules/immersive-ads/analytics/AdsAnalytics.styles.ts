import { makeStyles } from '@rbx/ui';

const useAdsAnalyticsStyles = makeStyles()(() => ({
  subMenuContainer: {
    paddingLeft: '40px',
    paddingBottom: '16px',
    width: '100%',
  },
  subMenu: {
    marginTop: '16px',
    marginBottom: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '16px',
    alignItems: 'center',
    '@media (max-width: 1500px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gap: '12px',
    },
  },
  subMenuChips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    overflowX: 'auto',
  },
}));

export default useAdsAnalyticsStyles;
