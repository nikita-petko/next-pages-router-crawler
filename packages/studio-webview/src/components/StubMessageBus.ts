import { Locale } from '@rbx/intl';
import StudioTheme from '../enums/StudioTheme';
import type { StudioConfiguration } from '../types/MessageBusTypes';
import type { StudioWebViewMessageBusEventTypesWithDefaults } from '../types/StudioWebViewMessageBusEventTypes';
import BaseMessageBus from './BaseMessageBus';

function emptyFunction() {}
const emptyFunctionFactoryFactory = () => () => emptyFunction;
type TCapabilities = Parameters<typeof BaseMessageBus.prototype.initHandshake>[0]['capabilities'];

class StubMessageBus<
  T extends StudioWebViewMessageBusEventTypesWithDefaults & {
    [K in keyof T]: { requestParams: unknown; responseParams: unknown };
  },
> extends BaseMessageBus<T> {
  private studioConfiguration: StudioConfiguration;

  constructor(namespace: string) {
    super({ namespace });
    this.studioConfiguration = {
      theme: StudioTheme.DarkFoundation,
      locale: Locale.English,
      isPrewarm: false,
    };
    window.rbx = {
      ...window.rbx,
      studio: window.rbx?.studio ?? this.studioConfiguration,
      messageBus: window.rbx?.messageBus ?? {
        events: new Map(),
        dispatchEvent: emptyFunction,
      },
      postMessage: window.rbx?.postMessage ?? emptyFunction,
    };
  }

  public loadWebView = emptyFunction;

  public async initHandshake({ capabilities }: { capabilities: TCapabilities }) {
    return { capabilities };
  }

  public setListener = emptyFunctionFactoryFactory;

  // `BaseMessageBus.fire`/`call` post to the native host and throw WEBVIEW_NOT_FOUND when
  // `isWebViewAvailable()` is false — which it always is outside Studio, since it requires a
  // `RobloxStudio` user agent. Stub both so a mocked WebView can send as well as receive.
  public fire = emptyFunction;

  // Resolves to an empty response: there is no Studio on the other side to answer the request.
  // No cast needed — inside the generic body `responseParams` is only known by its `unknown`
  // constraint, which accepts `{}`. Callers still see the concrete per-event response type.
  public async call<TName extends keyof T>(): Promise<T[TName]['responseParams']> {
    return {};
  }

  public getStudioConfiguration(): StudioConfiguration {
    return this.studioConfiguration;
  }
}

export default StubMessageBus;
