import {
  StudioWebViewMessageBusEventTypesWithDefaults,
  BaseMessageBus,
  StudioConfiguration,
  StudioTheme,
} from '@rbx/studio-webview';
import { Locale } from '@rbx/intl';

function emptyFunction() {}
const emptyFunctionFactoryFactory = () => () => emptyFunction;
type TCapabilities = Parameters<typeof BaseMessageBus.prototype.initHandshake>[0]['capabilities'];

type StudioWebViewHostWindow = Window &
  typeof globalThis & {
    rbx?: {
      studio?: StudioConfiguration;
      messageBus?: { events: Map<unknown, unknown>; dispatchEvent: () => void };
      postMessage?: () => void;
    };
  };

class StubMessageBus<
  T extends StudioWebViewMessageBusEventTypesWithDefaults,
> extends BaseMessageBus<T> {
  private studioConfiguration: StudioConfiguration;

  constructor(namespace: string) {
    super({ namespace });
    this.studioConfiguration = {
      theme: StudioTheme.LightFoundation,
      locale: Locale.English,
      isPrewarm: false,
    };
    const win = window as StudioWebViewHostWindow;
    win.rbx = {
      ...(win?.rbx || {}),
      studio: win.rbx?.studio || this.studioConfiguration,
      messageBus: win.rbx?.messageBus || {
        events: new Map(),
        dispatchEvent: emptyFunction,
      },
      postMessage: win.rbx?.postMessage || emptyFunction,
    };
  }

  public loadWebView = emptyFunction;

  // eslint-disable-next-line class-methods-use-this -- Mock implementation
  public async initHandshake({ capabilities }: { capabilities: TCapabilities }) {
    return Promise.resolve({ capabilities });
  }

  // No listening allowed
  public setListener = emptyFunctionFactoryFactory;

  public getStudioConfiguration(): StudioConfiguration {
    return this.studioConfiguration;
  }
}
export default StubMessageBus;
