// Adapted from creator-hub: https://github.rbx.com/Roblox/creator-hub/blob/master/apps/creator-hub/modules/charts-generic/components/FilterDrawer/FilterDrawerButton.styles.ts

import { makeStyles, TTheme } from '@rbx/ui';

const useFilterDrawerButtonStyles = makeStyles()((theme: TTheme) => {
  return {
    buttonRoot: {
      borderColor: theme.palette.surface.outline,
      fontWeight: 'bold',
      marginLeft: 12,
      minHeight: 44,
      width: 105,
    },
  };
});

export default useFilterDrawerButtonStyles;
