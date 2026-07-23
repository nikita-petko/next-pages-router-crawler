import type { TTheme } from '@rbx/ui';
import { makeStyles } from '@rbx/ui';

const useFilterDrawerButtonStyles = makeStyles()((theme: TTheme) => {
  return {
    buttonRoot: {
      fontWeight: theme.typography.body1.fontWeight,
      borderColor: theme.palette.surface.outline,
    },
  };
});

export default useFilterDrawerButtonStyles;
