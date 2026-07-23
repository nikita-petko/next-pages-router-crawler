import { useFoundationTheme } from '@rbx/foundation-ui';
import { UIThemeProvider } from '@rbx/ui';
import React, { FunctionComponent } from 'react';

const ModeResponsiveThemeProvider: FunctionComponent<
  React.PropsWithChildren<{ themeElement?: HTMLElement }>
> = ({ children, themeElement }) => {
  const defaultThemeMode = 'dark'; // hardcoded to dark since Ads Manager only supports dark mode for now

  useFoundationTheme(defaultThemeMode, themeElement);

  return <UIThemeProvider theme={defaultThemeMode}>{children}</UIThemeProvider>;
};

export default ModeResponsiveThemeProvider;
