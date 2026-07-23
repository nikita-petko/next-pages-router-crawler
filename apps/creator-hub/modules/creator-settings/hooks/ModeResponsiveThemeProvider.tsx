import type { FunctionComponent } from 'react';
import React from 'react';
import { useFoundationTheme } from '@rbx/foundation-ui';
import { useThemeMode } from '@rbx/settings';
import { UIThemeProvider } from '@rbx/ui';

const ModeResponsiveThemeProvider: FunctionComponent<
  React.PropsWithChildren<{ themeElement?: HTMLElement }>
> = ({ themeElement, children }) => {
  const { themeMode } = useThemeMode();
  useFoundationTheme(themeMode, themeElement);

  return <UIThemeProvider theme={themeMode}>{children}</UIThemeProvider>;
};

export default ModeResponsiveThemeProvider;
