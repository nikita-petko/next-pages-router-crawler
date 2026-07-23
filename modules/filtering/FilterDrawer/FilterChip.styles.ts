// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterChip.styles.ts

import { makeStyles, TTheme } from '@rbx/ui';

const useFilterChipsStyles = makeStyles()((theme: TTheme) => {
  return {
    closeIconForDisabledChip: {
      '&:hover': {
        color: theme.palette.content.standard,
      },
      color: theme.palette.content.disabled,
      position: 'absolute',
      right: '-2px',
      top: '-8px',
    },
    tooltip: {
      '@supports (display: -webkit-box)': {
        display: '-webkit-box',
      },
      boxOrient: 'vertical',
      lineClamp: 5,
      position: 'relative',
      textOverflow: 'ellipsis',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 5,
    },
  };
});

export default useFilterChipsStyles;
