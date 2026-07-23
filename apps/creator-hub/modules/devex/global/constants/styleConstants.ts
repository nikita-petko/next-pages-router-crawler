import type { TTheme } from '@rbx/ui';

export const LEARN_MORE_LINK_STYLES = (theme: TTheme) => ({
  textDecoration: 'none',
  color: `${theme.palette.content.standard} !important`,
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightBold,
  '&:hover': {
    color: `${theme.palette.content.standard} !important`,
  },
});

export const DEVEX_BANNER_STYLES = (theme: TTheme) => ({
  backgroundColor: 'transparent',
  color: theme.palette.common.white,
  borderColor: theme.palette.surface.outline,
  '& .MuiAlert-icon': {
    color: theme.palette.actionV2.primaryBrand.fill,
  },
  '& .MuiAlert-message': {
    color: theme.palette.common.white,
  },
});

export const DEVEX_BANNER_TITLE_STYLES = (theme: TTheme) => ({
  mb: theme.spacing(0.5),
});

export const DEVEX_BANNER_CLOSE_BUTTON_STYLES = (theme: TTheme) => ({
  padding: theme.spacing(0.5),
});

export const DEVEX_BANNER_ALERT_STYLES = (theme: TTheme) => ({
  backgroundColor: 'transparent',
  color: theme.palette.content.standard,
  borderColor: theme.palette.content.muted,
  '& .MuiAlert-icon': {
    color: theme.palette.actionV2.primaryBrand.fill,
  },
  '& .MuiAlert-message': {
    color: theme.palette.content.standard,
  },
});
