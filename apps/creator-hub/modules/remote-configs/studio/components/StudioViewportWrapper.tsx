import React, { useMemo, useEffect, useCallback } from 'react';
import {
  StudioTheme,
  StudioWebViewMessageBusContextType,
  StudioWebViewMessageBusEventTypesWithDefaults,
} from '@rbx/studio-webview';
import { ThemeOption, useThemeMode } from '@rbx/settings';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';

export type StudioViewportWrapperProps = React.PropsWithChildren<{
  useContextHook: () => StudioWebViewMessageBusContextType<StudioWebViewMessageBusEventTypesWithDefaults>;
}>;

enum FoundationHtmlThemeClass {
  Dark = 'dark-theme',
  Light = 'light-theme',
}

const useDarkOrLightThemeEffect = (currentStudioTheme: StudioTheme) => {
  /** The background color is special for studio widgets based on whether they are foundation or old studio theme */
  const backgroundColor = useMemo(() => {
    const themeToBackground: Record<StudioTheme, string> = {
      [StudioTheme.DarkStudio]: '#2e2e2e',
      [StudioTheme.LightStudio]: '#ffffff',
      [StudioTheme.DarkFoundation]: '#191a1f',
      [StudioTheme.LightFoundation]: '#ffffff',
    };
    return themeToBackground[currentStudioTheme];
  }, [currentStudioTheme]);

  const { studioWithoutThemeModeProviderEnabled } = useFeatureFlagsForNamespace(
    'studioWithoutThemeModeProviderEnabled',
    FeatureFlagNamespace.Analytics,
  );

  /** This sets the theme which is used elsewhere in creator-hub */
  const currentCreatorHubTheme: ThemeOption = useMemo(() => {
    const themeToOption: Record<StudioTheme, ThemeOption> = {
      [StudioTheme.DarkStudio]: ThemeOption.Dark,
      [StudioTheme.LightStudio]: ThemeOption.Light,
      [StudioTheme.DarkFoundation]: ThemeOption.Dark,
      [StudioTheme.LightFoundation]: ThemeOption.Light,
    };
    return themeToOption[currentStudioTheme];
  }, [currentStudioTheme]);
  const { updateThemeMode: updateCreatorHubThemeMode } = useThemeMode();
  useEffect(() => {
    if (studioWithoutThemeModeProviderEnabled) return;
    updateCreatorHubThemeMode(currentCreatorHubTheme);
  }, [currentCreatorHubTheme, updateCreatorHubThemeMode, studioWithoutThemeModeProviderEnabled]);

  /** Need some manual twiddling of the body and html elements as well */
  useEffect(() => {
    // Not sure what's setting the styles on the body element, but we need to override it
    //  (otherwise we get the @rbx/ui colors)
    // NOTE(gperkins@20251006): Do we need all of ModeResponsiveThemeProvider in creator-marketplace-web?
    const bodyElement = document.body;
    bodyElement.style.backgroundColor = backgroundColor;
    bodyElement.style.color = 'var(--color-content-default)';

    const htmlElement = document.documentElement;

    // Remove existing theme classes
    htmlElement.classList.remove(FoundationHtmlThemeClass.Dark, FoundationHtmlThemeClass.Light);

    // Add appropriate theme class based on currentStudioTheme
    const themeToClass: Record<StudioTheme, FoundationHtmlThemeClass> = {
      [StudioTheme.LightStudio]: FoundationHtmlThemeClass.Light,
      [StudioTheme.LightFoundation]: FoundationHtmlThemeClass.Light,
      [StudioTheme.DarkStudio]: FoundationHtmlThemeClass.Dark,
      [StudioTheme.DarkFoundation]: FoundationHtmlThemeClass.Dark,
    };
    htmlElement.classList.add(themeToClass[currentStudioTheme]);
  }, [currentStudioTheme, backgroundColor]);
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
    if (window.location.hostname.includes('localhost')) return () => {};
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
