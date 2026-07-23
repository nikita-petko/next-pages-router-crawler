import { uuidService } from '@rbx/core';
import { Locale } from '@rbx/intl';
import StudioTheme, { DEFAULT_STUDIO_THEME } from '../enums/StudioTheme';
import type { IMessageBus } from '../interfaces/IMessageBus';
import type {
  BaseEventTypes,
  InternalInitRequestParams,
  InternalInitResponseParams,
  MessageBusEventMetadata,
  RequestResponseParams,
  StudioConfiguration,
  TMessageBusCallback,
  TMessageCallback,
} from '../types/MessageBusTypes';
import { MessageBusEventType } from '../types/MessageBusTypes';
import { isWebViewAvailable } from '../utils/WebViewUtils';
import FrameMessageQueue from './FrameMessageQueue';
import { MessageBusError, MessageBusErrorCode } from './MessageBusError';

const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_STUDIO_LOCALE = Locale.English;

const MESSAGE_BUS_EVENT_NAME = 'messageBusEvent';
const MESSAGE_BUS_VERSION_NUMBER = '1';
const MESSAGE_BUS_SEPARATOR = '|';

export type MessageBusOptions = {
  namespace: string;
};

type EventListeners = {
  uuidSpecificListeners: Map<string, TMessageBusCallback<unknown>>;
  generalListeners: TMessageBusCallback<unknown>[];
};

type EventNameToListenersMap = Map<string, EventListeners>;

declare global {
  interface Window {
    rbx?: {
      messageBus: {
        events: EventNameToListenersMap;
        dispatchEvent: (
          eventName: string,
          eventMetadata: MessageBusEventMetadata,
          messageBusEventData: unknown,
        ) => void;
      };
      postMessage?: (name: string, message: string) => void; // this is defined in C++ but we mark it as optional to avoid typescript complaints
      postMessageFrameUrl?: string;
      studio: StudioConfiguration;
    };
    webkit?: {
      messageHandlers?: {
        [key: string]: {
          postMessage: (message: string) => void;
        };
      };
    };
  }
}

export default class BaseMessageBus<
  TParams extends BaseEventTypes & {
    [K in keyof TParams]: RequestResponseParams<unknown, unknown>;
  } = BaseEventTypes,
> implements IMessageBus<TParams> {
  namespace: string;

  constructor(options: MessageBusOptions) {
    this.namespace = options.namespace;
  }

  public getStudioConfiguration(): StudioConfiguration {
    if (!isWebViewAvailable() || !window.rbx?.messageBus) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_INITIALIZED);
    }

    const studioConfiguration = window.rbx.studio;
    // warn if locale is not valid, but return default so typing is correct
    if (!Object.values(Locale).includes(studioConfiguration.locale)) {
      console.warn(
        `Locale: ${studioConfiguration.locale} is not valid. Defaulting to ${DEFAULT_STUDIO_LOCALE}.`,
      );
      studioConfiguration.locale = DEFAULT_STUDIO_LOCALE;
    }
    // warn if theme is not valid, but return default so typing is correct
    if (!Object.values(StudioTheme).includes(studioConfiguration.theme)) {
      console.warn(
        `Theme: ${studioConfiguration.theme} is not valid. Defaulting to ${DEFAULT_STUDIO_THEME}.`,
      );
      studioConfiguration.theme = DEFAULT_STUDIO_THEME;
    }
    return studioConfiguration;
  }

  public loadWebView(): void {
    if (!isWebViewAvailable() || !window.rbx?.messageBus) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_INITIALIZED);
    }

    // Overwrite the iframe-based message queue if postMessageFrameUrl is provided
    if (window.rbx?.postMessageFrameUrl && window.webkit?.messageHandlers?.roblox) {
      const frameMessageQueue = new FrameMessageQueue(window.rbx.postMessageFrameUrl);
      window.webkit.messageHandlers.roblox.postMessage = (payload: string) => {
        frameMessageQueue.enqueueMessage(payload);
      };
    }

    const events: EventNameToListenersMap = new Map();
    const dispatchEvent = (
      eventName: string,
      eventMetadata: MessageBusEventMetadata,
      messageBusEventData: unknown,
    ) => {
      const listeners = events.get(eventName);
      const uuidSpecificListeners = listeners?.uuidSpecificListeners;
      const generalListeners = listeners?.generalListeners;

      // Call specific listener first
      if (uuidSpecificListeners !== undefined) {
        const uuidSpecificListener = uuidSpecificListeners.get(eventMetadata.uuid ?? '');
        if (uuidSpecificListener) {
          uuidSpecificListener(messageBusEventData, eventMetadata);
        }
      }

      // Then call all general listeners
      if (generalListeners !== undefined) {
        generalListeners.forEach((callback) => callback(messageBusEventData, eventMetadata));
      }
    };

    window.rbx.messageBus = { dispatchEvent, events };
  }

  public async initHandshake(
    initParams: InternalInitRequestParams,
  ): Promise<InternalInitResponseParams> {
    return this.call('internal:init', initParams, 0);
  }

  private getFullEventName(eventName: keyof TParams) {
    if (String(eventName).includes('internal')) {
      return eventName.toString();
    }

    return `${this.namespace}:${String(eventName)}`;
  }

  private postMessage(
    eventName: string,
    eventMetadata: MessageBusEventMetadata,
    messageBusEventData: unknown,
  ): void {
    if (!isWebViewAvailable() || !window.rbx?.postMessage) {
      throw new MessageBusError(
        MessageBusErrorCode.WEBVIEW_NOT_FOUND,
        eventName,
        eventMetadata.type,
      );
    }

    const eventMetadataStr = JSON.stringify(eventMetadata);
    const messageBusEventDataStr = JSON.stringify(messageBusEventData);

    if (eventMetadataStr.includes(MESSAGE_BUS_SEPARATOR)) {
      throw new MessageBusError(MessageBusErrorCode.INVALID_MESSAGE, eventName, eventMetadata.type);
    }

    const messageStr = `${MESSAGE_BUS_VERSION_NUMBER}${MESSAGE_BUS_SEPARATOR}${eventName}${MESSAGE_BUS_SEPARATOR}${eventMetadataStr}${MESSAGE_BUS_SEPARATOR}${messageBusEventDataStr}`;

    window.rbx.postMessage(MESSAGE_BUS_EVENT_NAME, messageStr);
  }

  // setListenerInternal is only used for callStudio
  // It differs from setListener in that it:
  // - Is used to listen to ACKs from Studio
  // - Because of the above, we don't send an ACK to Studio
  // - Doesn't return the callback since the uuid and event name are sufficient for matching
  private setListenerInternal<TName extends keyof TParams>(
    eventName: TName,
    callback: TMessageBusCallback<TParams[TName]['requestParams']>,
    uuid: string,
  ) {
    const messageBus = window.rbx?.messageBus;
    if (!isWebViewAvailable() || !messageBus) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_FOUND, String(eventName));
    }

    const fullEventName = this.getFullEventName(eventName);

    const eventNameToListenersMap = messageBus.events;
    let uuidSpecificListeners: Map<
      string,
      TMessageBusCallback<TParams[TName]['requestParams']>
    > = new Map();
    const allListeners = eventNameToListenersMap.get(fullEventName);
    if (allListeners) {
      if (allListeners.uuidSpecificListeners) {
        uuidSpecificListeners = allListeners.uuidSpecificListeners;
      } else {
        allListeners.uuidSpecificListeners = uuidSpecificListeners;
      }
    } else {
      eventNameToListenersMap.set(fullEventName, {
        uuidSpecificListeners,
        generalListeners: [],
      });
    }

    uuidSpecificListeners.set(uuid, callback);
  }

  // removeListenerInternal is only used for callStudio
  // It differs from removeListener in that it:
  // - Removes the listener from the uuidSpecificListeners map
  private removeListenerInternal(eventName: keyof TParams, uuid: string) {
    const fullEventName = this.getFullEventName(eventName);
    const eventNameToListenersMap = window.rbx?.messageBus.events;
    if (!eventNameToListenersMap) {
      return;
    }
    const allListeners = eventNameToListenersMap.get(fullEventName);
    const uuidSpecificListeners = allListeners?.uuidSpecificListeners;

    if (uuidSpecificListeners === undefined) {
      return;
    }

    if (uuidSpecificListeners.has(uuid)) {
      uuidSpecificListeners.delete(uuid);
    }
  }

  public setListener<TName extends keyof TParams>(
    eventName: TName,
    callback: TMessageCallback<TParams[TName]['requestParams'], TParams[TName]['responseParams']>,
  ): TMessageBusCallback<TParams[TName]['requestParams']> {
    const messageBus = window.rbx?.messageBus;
    if (!isWebViewAvailable() || !messageBus) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_FOUND, String(eventName));
    }

    const fullEventName = this.getFullEventName(eventName);

    const ackCallBack = (
      messageBusEventData: TParams[TName]['requestParams'],
      eventMetadata: MessageBusEventMetadata,
    ) => {
      const callbackResponse = callback(messageBusEventData) ?? {};
      if (eventMetadata.type === MessageBusEventType.Request) {
        // Sends an ACK to Studio that the event was received
        this.postMessage(
          fullEventName,
          {
            type: MessageBusEventType.Response,
            uuid: eventMetadata.uuid,
          },
          callbackResponse,
        );
      }
    };

    const eventNameToListenersMap = messageBus.events;
    let generalListeners: TMessageBusCallback<unknown>[] = [];
    const allListeners = eventNameToListenersMap.get(fullEventName);
    if (allListeners) {
      if (allListeners.generalListeners) {
        generalListeners = allListeners.generalListeners;
      } else {
        allListeners.generalListeners = generalListeners;
      }
    } else {
      eventNameToListenersMap.set(fullEventName, {
        uuidSpecificListeners: new Map<string, TMessageBusCallback<unknown>>(),
        generalListeners,
      });
    }

    generalListeners.push(ackCallBack);
    return ackCallBack;
  }

  public removeListener<TName extends keyof TParams>(
    eventName: TName,
    callback: TMessageBusCallback<TParams[TName]['requestParams']>,
  ): void {
    const fullEventName = this.getFullEventName(eventName);
    const eventNameToListenersMap = window.rbx?.messageBus.events;
    if (!eventNameToListenersMap) {
      return;
    }
    const allListeners = eventNameToListenersMap.get(fullEventName);
    const generalListeners = allListeners?.generalListeners;

    // If there was no event with the provided event name, or it does not have general callbacks, return early
    if (generalListeners === undefined || generalListeners.length === 0) {
      return;
    }

    const index = generalListeners.indexOf(callback);
    if (index > -1) {
      generalListeners.splice(index, 1);
    }
  }

  public async call<TName extends keyof TParams>(
    eventName: TName,
    params: TParams[TName]['requestParams'],
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<TParams[TName]['responseParams']> {
    if (!isWebViewAvailable()) {
      throw new MessageBusError(
        MessageBusErrorCode.WEBVIEW_NOT_FOUND,
        String(eventName),
        MessageBusEventType.Request,
      );
    }

    const callStudio = (uuid: string) => {
      return new Promise<TParams[TName]['responseParams']>((resolve) => {
        const callback = (
          messageBusEventData: TParams[TName]['requestParams'],
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Keeping it here in case we want to use it in the future and to simplify typing
          eventMetadata: MessageBusEventMetadata,
        ) => {
          this.removeListenerInternal(eventName, uuid);
          resolve(messageBusEventData);
        };

        this.setListenerInternal(eventName, callback, uuid);
        this.postMessage(
          this.getFullEventName(eventName),
          {
            type: MessageBusEventType.Request,
            uuid,
          },
          params,
        );
      });
    };

    const uuid = uuidService.generateRandomUuid();

    if (timeoutMs <= 0) {
      return callStudio(uuid);
    }

    let timer: NodeJS.Timeout | undefined;
    return Promise.race([
      new Promise<TParams[TName]['responseParams']>((_, reject) => {
        timer = setTimeout(() => {
          this.removeListenerInternal(eventName, uuid);
          reject(
            new MessageBusError(
              MessageBusErrorCode.TIMED_OUT,
              String(eventName),
              MessageBusEventType.Request,
            ),
          );
        }, timeoutMs);
      }),
      callStudio(uuid).then((value) => {
        if (timer) {
          clearTimeout(timer);
        }
        return value;
      }),
    ]);
  }

  public fire<TName extends keyof TParams>(
    eventName: TName,
    params: TParams[TName]['requestParams'],
  ): void {
    if (!isWebViewAvailable()) {
      throw new MessageBusError(
        MessageBusErrorCode.WEBVIEW_NOT_FOUND,
        String(eventName),
        MessageBusEventType.Fire,
      );
    }

    const uuid = uuidService.generateRandomUuid();

    this.postMessage(
      this.getFullEventName(eventName),
      {
        type: MessageBusEventType.Fire,
        uuid,
      },
      params,
    );
  }
}
