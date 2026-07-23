import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSessionStorage } from '@rbx/react-utilities';
import StudioTheme, { DEFAULT_STUDIO_THEME } from '../enums/StudioTheme';
import type { StudioWebViewMessageBusEvent } from '../enums/StudioWebViewMessageBusEvent';
import type {
  InternalInitRequestParams,
  RequestResponseParams,
  StudioConfiguration,
} from '../types/MessageBusTypes';
import type {
  RemoveListenerFunc,
  SetListenerFunc,
  StudioWebViewMessageBusContextType,
} from '../types/StudioWebViewMessageBusContextType';
import type { StudioWebViewMessageBusEventTypesWithDefaults } from '../types/StudioWebViewMessageBusEventTypes';
import {
  getStudioVersion,
  isRecommendedSpecOrAbove as isStudioRecommendedSpecOrAbove,
  isWebViewAvailable as isStudioWebViewAvailable,
} from '../utils/WebViewUtils';
import BaseMessageBus from './BaseMessageBus';

const WEB_VIEW_THEME_OVERRIDE_KEY = 'web_view_theme_override';
const MOCK_WEB_VIEW_KEY = 'mock_web_view';

// This is a hack to force the Studio WebView to render while hidden in development mode using SSR.
// It replaces the first requestAnimationFrame function with a setTimeout to force the WebView to render.
if (
  process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  isStudioWebViewAvailable()
) {
  const originalRaf = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback: (timestamp: DOMHighResTimeStamp) => void): number => {
    if (typeof callback === 'function') {
      window.requestAnimationFrame = originalRaf;
      return window.setTimeout(() => callback(performance.now()), 0);
    }
    return 0;
  };
}

// The Studio webview starts hidden and requires a Lua-side call to show it. That call is gated on
// a native load signal (EmbeddedWebBrowser::loadSucceeded) or a JS-initiated loadprogress message.
// Under turbopack (which emits <script type="module"> instead of classic scripts), WKWebView on
// macOS does not reliably fire the native load-complete signal — so the Lua plugin never gets the
// event it needs to show the webview, and the startup sequence stalls. Chromium/WebView2 on
// Windows is unaffected because its NavigationCompleted fires correctly with module scripts.
// Sending loadprogress from JS provides a reliable alternative path through the C++ message
// handler bridge → WebBrowserWidgetLoadProgressEvent signal → Lua plugin → ShowWebBrowserWidget.
// This must run at module scope — a React effect would be too late.
function signalReady() {
  window.rbx?.postMessage?.('loadprogress', 'afterInteractive');
}

if (typeof window !== 'undefined' && window.rbx?.postMessage) {
  window.rbx?.postMessage?.('loadprogress', 'beforeInteractive');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', signalReady, { once: true });
  } else {
    signalReady();
  }
}

const makeStudioWebViewMessageBusProvider = <
  TEventTypes extends StudioWebViewMessageBusEventTypesWithDefaults & {
    [K in keyof TEventTypes]: RequestResponseParams<unknown, unknown>;
  },
>({
  context,
  bus,
  useSearchParams,
  MockMessageBus,
}: {
  context: React.Context<StudioWebViewMessageBusContextType<TEventTypes> | null>;
  bus: BaseMessageBus<TEventTypes>;
  useSearchParams: () => Readonly<URLSearchParams>;
  MockMessageBus: new () => BaseMessageBus<TEventTypes>;
}) => {
  return function StudioWebViewMessageBusProvider({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement {
    const [isWebViewAvailable, setIsWebViewAvailable] = useState<boolean>(
      typeof window !== 'undefined' && isStudioWebViewAvailable(),
    );

    const searchParams = useSearchParams();
    const [isUsingMockedWebView, setIsUsingMockedWebView] = useSessionStorage<boolean | null>(
      MOCK_WEB_VIEW_KEY,
      null,
    );
    const mockMessageBus = useRef<BaseMessageBus<TEventTypes> | null>(null);

    const messageBus = useMemo((): BaseMessageBus<TEventTypes> => {
      if (isUsingMockedWebView) {
        if (!mockMessageBus.current) {
          mockMessageBus.current = new MockMessageBus();
        }
        return mockMessageBus.current;
      }

      return bus;
    }, [isUsingMockedWebView]);

    const call = useCallback(
      <TName extends keyof TEventTypes>(
        eventName: TName,
        params: TEventTypes[TName]['requestParams'],
        timeoutMs?: number,
      ): Promise<TEventTypes[TName]['responseParams']> => {
        return messageBus.call(eventName, params, timeoutMs);
      },
      [messageBus],
    );

    const fire = useCallback(
      <TName extends keyof TEventTypes>(
        eventName: TName,
        params: TEventTypes[TName]['requestParams'],
      ) => {
        messageBus.fire(eventName, params);
      },
      [messageBus],
    );

    const getStudioConfiguration = useCallback((): StudioConfiguration => {
      return messageBus.getStudioConfiguration();
    }, [messageBus]);

    const [initHandshakeResponse, setInitHandshakeResponse] = useState<
      TEventTypes[StudioWebViewMessageBusEvent.init]['responseParams'] | null
    >(null);

    const initHandshake = useCallback(
      async (
        capabilities: InternalInitRequestParams,
      ): Promise<TEventTypes[StudioWebViewMessageBusEvent.init]['responseParams']> => {
        const response = await messageBus.initHandshake(capabilities);
        setInitHandshakeResponse(response);
        return response;
      },
      [messageBus],
    );

    const loadWebView = useCallback(() => {
      messageBus.loadWebView();
    }, [messageBus]);

    const isPrewarm = useMemo(() => {
      // we can't use getStudioConfiguration() here because that relies on isWebViewAvailable being true
      return Boolean(typeof window !== 'undefined' && window.rbx?.studio.isPrewarm);
    }, []);

    const isRecommendedSpecOrAbove = useMemo(() => {
      return typeof window !== 'undefined' && isStudioRecommendedSpecOrAbove();
    }, []);

    const studioVersion = useMemo(() => {
      return typeof window !== 'undefined' ? getStudioVersion() : '';
    }, []);

    const setListener: SetListenerFunc<TEventTypes> = useCallback(
      (eventName, callback) => {
        return messageBus.setListener(eventName, callback);
      },
      [messageBus],
    );

    const removeListener: RemoveListenerFunc<TEventTypes> = useCallback(
      (eventName, callback) => {
        messageBus.removeListener(eventName, callback);
      },
      [messageBus],
    );

    const [studioThemeOverride, setStudioThemeOverride] = useSessionStorage<StudioTheme | null>(
      WEB_VIEW_THEME_OVERRIDE_KEY,
      null,
    );

    useEffect(() => {
      // NOTE: This is the one case where we need to capitalize "Webview" as such (as opposed to "WebView")
      // When trying to use the query param "mockWebView", it is automatically converted to "mockWebview"
      const mockWebViewSearchParam = searchParams.get('mockWebview');
      if (process.env.NEXT_PUBLIC_MOCK_WEB_VIEW === 'true' || mockWebViewSearchParam === 'true') {
        setIsUsingMockedWebView(true);
        setIsWebViewAvailable(true);

        const mockThemeOverride = searchParams.get('theme');
        if (mockThemeOverride) {
          const studioTheme = mockThemeOverride.includes('light')
            ? StudioTheme.LightFoundation
            : StudioTheme.DarkFoundation;
          setStudioThemeOverride(studioTheme);
        }
      } else if (mockWebViewSearchParam === 'false') {
        setIsUsingMockedWebView(false);
        setIsWebViewAvailable(isStudioWebViewAvailable());
      } else if (isUsingMockedWebView === null) {
        // No search param passed in for 'mockWebview', check sessionStorage to see if it was set
        // sessionStorage doesn't have a value for MOCK_WEB_VIEW_KEY checking if WebView is available in browser
        setIsWebViewAvailable(isStudioWebViewAvailable());
      } else {
        // continuing to use the value from sessionStorage for mocked WebView
        setIsWebViewAvailable(isUsingMockedWebView);
      }

      // If the WebView is available, we should set the flag to true
    }, [
      isUsingMockedWebView,
      searchParams,
      setIsUsingMockedWebView,
      setIsWebViewAvailable,
      setStudioThemeOverride,
    ]);

    const currentStudioTheme = useMemo(() => {
      const studioTheme =
        isWebViewAvailable && typeof window !== 'undefined'
          ? getStudioConfiguration().theme
          : DEFAULT_STUDIO_THEME;

      return studioThemeOverride ?? studioTheme;
    }, [getStudioConfiguration, isWebViewAvailable, studioThemeOverride]);

    const value: StudioWebViewMessageBusContextType<TEventTypes> = useMemo(() => {
      return {
        call,
        currentStudioTheme,
        fire,
        getStudioConfiguration,
        initHandshake,
        initHandshakeResponse,
        isPrewarm,
        isRecommendedSpecOrAbove,
        isWebView: isWebViewAvailable,
        isWebViewAvailable,
        loadWebView,
        removeListener,
        setListener,
        setStudioThemeOverride,
        studioVersion,
      };
    }, [
      call,
      fire,
      getStudioConfiguration,
      initHandshake,
      initHandshakeResponse,
      isPrewarm,
      isRecommendedSpecOrAbove,
      isWebViewAvailable,
      loadWebView,
      removeListener,
      setListener,
      setStudioThemeOverride,
      currentStudioTheme,
      studioVersion,
    ]);

    /**
     * NOTE(gperkins@20250917): This is potentially dangerous, but we can't figure out why our CI
     * type checks are failing (not reproducible locally) with the following error:
     *
     * src/components/StudioWebViewMessageBusProvider.tsx(267,5): error TS2322:
     * Type 'Element' is not assignable to type 'ReactElement<any, string | JSXElementConstructor<any>>'.
     *  Types of property 'key' are incompatible.
     *   Type 'Key | null' is not assignable to type 'string | null'.
     *    Type 'number' is not assignable to type 'string'.
     */
    return (<context.Provider value={value}>{children}</context.Provider>) as React.ReactElement;
  };
};

const makeStudioWebViewMessageBusContextProvider = <
  TEventTypes extends StudioWebViewMessageBusEventTypesWithDefaults & {
    [K in keyof TEventTypes]: RequestResponseParams<unknown, unknown>;
  },
>({
  namespace,
  useSearchParams,
  MockMessageBus,
}: {
  namespace: string;
  useSearchParams: () => Readonly<URLSearchParams>;
  MockMessageBus: new () => BaseMessageBus<TEventTypes>;
}): {
  bus: BaseMessageBus<TEventTypes>;
  provider: React.ComponentType<{ children: React.ReactNode }>;
  context: React.Context<StudioWebViewMessageBusContextType<TEventTypes> | null>;
  useContextHook: () => StudioWebViewMessageBusContextType<TEventTypes>;
} => {
  const context = createContext<StudioWebViewMessageBusContextType<TEventTypes> | null>(null);

  const bus = new BaseMessageBus<TEventTypes>({ namespace });
  const provider = makeStudioWebViewMessageBusProvider<TEventTypes>({
    bus,
    context,
    MockMessageBus,
    useSearchParams,
  });
  const useContextHook = () => {
    const contextValue = useContext(context);
    if (!contextValue) {
      throw new Error('StudioWebViewMessageBusProviderContext not found');
    }
    return contextValue;
  };

  return {
    bus,
    context,
    provider,
    useContextHook,
  };
};

export default makeStudioWebViewMessageBusContextProvider;
