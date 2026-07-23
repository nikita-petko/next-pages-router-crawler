import { UIThemeProvider } from '@rbx/ui';
import { useFoundationTheme } from '@rbx/foundation-ui';
import React, { FunctionComponent } from 'react';
import { useThemeMode } from '@rbx/settings';

const ModeResponsiveThemeProvider: FunctionComponent<
  React.PropsWithChildren<{ themeElement?: HTMLElement }>
> = ({ themeElement, children }) => {
  const { themeMode } = useThemeMode();
  useFoundationTheme(themeMode, themeElement);

  return <UIThemeProvider theme={themeMode}>{children}</UIThemeProvider>;
};

export default ModeResponsiveThemeProvider;
