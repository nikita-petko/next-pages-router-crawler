import { Locale } from '@rbx/intl';
import type {
  StudioWebViewMessageBusEventTypesWithDefaults,
  StudioConfiguration,
} from '@rbx/studio-webview';
import { BaseMessageBus, StudioTheme } from '@rbx/studio-webview';

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
    const win = window as StudioWebViewHostWindow;
    win.rbx = {
      ...win?.rbx,
      studio: win.rbx?.studio || this.studioConfiguration,
      messageBus: win.rbx?.messageBus || {
        events: new Map(),
        dispatchEvent: emptyFunction,
      },
      postMessage: win.rbx?.postMessage || emptyFunction,
    };
  }

  public loadWebView = emptyFunction;

  public async initHandshake({ capabilities }: { capabilities: TCapabilities }) {
    return { capabilities };
  }

  // No listening allowed
  public setListener = emptyFunctionFactoryFactory;

  public getStudioConfiguration(): StudioConfiguration {
    return this.studioConfiguration;
  }
}
export default StubMessageBus;
