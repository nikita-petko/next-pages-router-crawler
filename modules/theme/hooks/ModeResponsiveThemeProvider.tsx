import { useFoundationTheme } from '@rbx/foundation-ui';
import { UIThemeProvider } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

import useResolvedThemeMode from '@hooks/useResolvedThemeMode';

/**
 * Drives both styling systems from one value: the `light-theme` / `dark-theme`
 * class that Foundation Tailwind custom properties key off, and the MUI theme
 * that `makeStyles` callbacks read.
 */
const ModeResponsiveThemeProvider: FunctionComponent<
  React.PropsWithChildren<{ themeElement?: HTMLElement }>
> = ({ children, themeElement }) => {
  const themeMode = useResolvedThemeMode();

  useFoundationTheme(themeMode, themeElement);

  return <UIThemeProvider theme={themeMode}>{children}</UIThemeProvider>;
};

export default ModeResponsiveThemeProvider;
