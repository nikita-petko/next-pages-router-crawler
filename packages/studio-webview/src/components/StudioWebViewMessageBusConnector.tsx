import React, { useCallback, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { StudioWebViewMessageBusEvent } from '../enums/StudioWebViewMessageBusEvent';
import type {
  InternalInitRequestParams,
  RequestResponseParams,
  InternalChangeThemeRequestParams,
  InternalChangeVolumeRequestParams,
} from '../types/MessageBusTypes';
import type { StudioWebViewMessageBusContextType } from '../types/StudioWebViewMessageBusContextType';
import type { StudioWebViewMessageBusEventTypesWithDefaults } from '../types/StudioWebViewMessageBusEventTypes';
import {
  createVolumeMutationObserver,
  DEFAULT_STUDIO_VOLUME,
  updateMediaElementsVolume,
} from '../utils/AudioUtils';

const defaultCapabilities = [] as const satisfies InternalInitRequestParams['capabilities'];

function StudioWebViewMessageBusConnector<
  TEventTypes extends StudioWebViewMessageBusEventTypesWithDefaults & {
    [K in keyof TEventTypes]: RequestResponseParams<unknown, unknown>;
  },
>({
  children,
  useContextHook: useProvider,
  capabilities = defaultCapabilities,
}: {
  children: React.ReactNode;
  useContextHook: () => StudioWebViewMessageBusContextType<TEventTypes>;
  capabilities?: InternalInitRequestParams['capabilities'];
}) {
  const {
    isWebView,
    getStudioConfiguration,
    setStudioThemeOverride,
    initHandshake,
    removeListener,
    setListener,
    loadWebView,
    studioVersion,
  } = useProvider();
  const currentStudioVolumeRef = useRef<number>(
    isWebView ? (getStudioConfiguration().volume ?? DEFAULT_STUDIO_VOLUME) : DEFAULT_STUDIO_VOLUME,
  );
  const volumeMutationObserverRef = useRef<MutationObserver | null>(
    isWebView ? createVolumeMutationObserver(() => currentStudioVolumeRef.current) : null,
  );

  const internalChangeTheme = useCallback(
    (data: InternalChangeThemeRequestParams) => {
      const { theme } = data;
      setStudioThemeOverride(theme);
    },
    [setStudioThemeOverride],
  );

  const internalChangeVolume = useCallback((data: InternalChangeVolumeRequestParams) => {
    const { volume } = data;
    currentStudioVolumeRef.current = volume;

    // when volume changes, update all existing media elements
    updateMediaElementsVolume(document.body, volume);
  }, []);

  useEffect(() => {
    Sentry.setTag('isWebView', isWebView);
    if (isWebView) {
      // on mount, set initial volume on all existing media elements
      updateMediaElementsVolume(document.body, currentStudioVolumeRef.current);
      // observe new media elements being added to the document and set their volume
      volumeMutationObserverRef.current?.observe(document.body, { childList: true, subtree: true });

      // prevent drop from 'drag and drop' that would open a 404 page in the webview
      window.addEventListener('dragover', (e) => e.preventDefault(), true);
      window.addEventListener('drop', (e) => e.preventDefault(), true);
    }
  }, [isWebView]);

  useEffect(() => {
    if (isWebView && studioVersion) {
      Sentry.setTag('studioVersion', studioVersion);
    }
  }, [isWebView, studioVersion]);

  useEffect(() => {
    if (isWebView) {
      if (typeof window.rbx?.messageBus.dispatchEvent === 'undefined') {
        // TODO: Guard against this in loadWebView itself
        loadWebView();
      }

      const internalChangeThemeListener = setListener(
        StudioWebViewMessageBusEvent.changeTheme,
        internalChangeTheme,
      );
      const internalChangeVolumeListener = setListener(
        StudioWebViewMessageBusEvent.changeVolume,
        internalChangeVolume,
      );

      return () => {
        removeListener(StudioWebViewMessageBusEvent.changeTheme, internalChangeThemeListener);
        removeListener(StudioWebViewMessageBusEvent.changeVolume, internalChangeVolumeListener);
      };
    }

    return () => {};
  }, [
    internalChangeTheme,
    internalChangeVolume,
    isWebView,
    loadWebView,
    removeListener,
    setListener,
  ]);

  useEffect(() => {
    void (async () => {
      if (isWebView) {
        await initHandshake({ capabilities });
      }
    })();
  }, [isWebView, initHandshake, capabilities]);

  return <>{children}</>;
}

export default StudioWebViewMessageBusConnector;
