import { makeStyles } from '@rbx/ui';

const useBannerStyles = makeStyles<void, 'bannerGrid'>()((_theme, _params, classes) => ({
  bannerContainer: {
    paddingLeft: '40px',
    marginTop: '0',
    gap: '16px',
    [`& .${classes.bannerGrid}`]: {
      padding: '0px',
    },
  },
  bannerGrid: {
    width: '100%',
  },
}));

export default useBannerStyles;
