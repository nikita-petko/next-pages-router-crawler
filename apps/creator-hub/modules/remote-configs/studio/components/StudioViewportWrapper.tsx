import React, { useEffect, useCallback, useLayoutEffect } from 'react';
import { ThemeOption, useThemeMode } from '@rbx/settings';
import type { StudioWebViewMessageBusContextType } from '@rbx/studio-webview';
import { StudioTheme } from '@rbx/studio-webview';
import type { ConfigsMessageBusEventTypes } from '../message-bus/ConfigsStudioMessageBusProvider';

export type StudioViewportWrapperProps = React.PropsWithChildren<{
  useContextHook: () => StudioWebViewMessageBusContextType<ConfigsMessageBusEventTypes>;
}>;

const themeToBackground: Record<StudioTheme, string> = {
  [StudioTheme.DarkFoundation]: '#191a1f',
  [StudioTheme.LightFoundation]: '#ffffff',
};

const studioThemeToOption: Record<StudioTheme, ThemeOption> = {
  [StudioTheme.LightFoundation]: ThemeOption.StudioLight,
  [StudioTheme.DarkFoundation]: ThemeOption.StudioDark,
};

const useDarkOrLightThemeEffect = (currentStudioTheme: StudioTheme) => {
  const { updateThemeMode } = useThemeMode();

  useLayoutEffect(() => {
    const bodyElement = document.body;
    bodyElement.style.backgroundColor = themeToBackground[currentStudioTheme];
    bodyElement.style.color = 'var(--color-content-default)';
  }, [currentStudioTheme]);

  useEffect(() => {
    updateThemeMode(studioThemeToOption[currentStudioTheme]);
  }, [currentStudioTheme, updateThemeMode]);
};

const styleFillViewport: React.CSSProperties = {
  position: 'absolute',
  height: '100%',
  width: '100%',
};

const StudioViewportWrapper = ({ children, useContextHook }: StudioViewportWrapperProps) => {
  const cancelContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);
  useEffect(() => {
    if (window.location.hostname.includes('localhost')) {
      return () => {};
    }
    document.addEventListener('contextmenu', cancelContextMenu);
    return () => {
      document.removeEventListener('contextmenu', cancelContextMenu);
    };
  }, [cancelContextMenu]);

  const { currentStudioTheme } = useContextHook();
  useDarkOrLightThemeEffect(currentStudioTheme);

  return <div style={styleFillViewport}>{children}</div>;
};
export default StudioViewportWrapper;
