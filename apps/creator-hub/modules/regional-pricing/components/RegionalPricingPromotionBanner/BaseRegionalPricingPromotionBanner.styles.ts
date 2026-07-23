import { makeStyles } from '@rbx/ui';

const usePromotionBannerStyles = makeStyles()((theme) => ({
  banner: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: theme.palette.surface[200],
    backgroundBlendMode: 'color-dodge',
    borderRadius: '12px',

    // Hack for adding padding to `upsellContent` without
    // affecting illustration padding.
    'div:first-child': {
      padding: '48px',
    },
  },
}));

export default usePromotionBannerStyles;
