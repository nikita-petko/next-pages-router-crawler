import { makeStyles } from '@rbx/ui';

const usePromotionBannerStyles = makeStyles()(() => ({
  bannerRoot: {
    marginBottom: '24px',
  },
  textContainer: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
}));

export default usePromotionBannerStyles;
