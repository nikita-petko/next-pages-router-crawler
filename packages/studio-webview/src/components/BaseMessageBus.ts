import { uuidService } from '@rbx/core';
import { Locale } from '@rbx/intl';
import {
  BaseEventTypes,
  InternalInitRequestParams,
  InternalInitResponseParams,
  MessageBusEventMetadata,
  MessageBusEventType,
  StudioConfiguration,
  TMessageBusCallback,
  TMessageCallback,
} from '../types/MessageBusTypes';
import { IMessageBus } from '../interfaces/IMessageBus';
import { isWebViewAvailable } from '../utils/WebViewUtils';
import { MessageBusError, MessageBusErrorCode } from './MessageBusError';
import StudioTheme from '../enums/StudioTheme';
import FrameMessageQueue from './FrameMessageQueue';

const DEFAULT_TIMEOUT_MS = 3_000;
const DEFAULT_STUDIO_THEME = StudioTheme.DarkStudio;
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
    DISABLE_STUDIO_WEBVIEW_PREINIT?: boolean;
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
  TParams extends BaseEventTypes & { [key: string]: any } = BaseEventTypes,
> implements IMessageBus<TParams>
{
  namespace: string;

  constructor(options: MessageBusOptions) {
    this.namespace = options.namespace;
  }

  // eslint-disable-next-line class-methods-use-this
  public getStudioConfiguration(): StudioConfiguration {
    if (!isWebViewAvailable() || !window.rbx?.messageBus) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_INITIALIZED);
    }

    const studioConfiguration = window.rbx.studio;
    // warn if locale is not valid, but return default so typing is correct
    if (!Object.values(Locale).includes(studioConfiguration.locale)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Locale: ${studioConfiguration.locale} is not valid. Defaulting to ${DEFAULT_STUDIO_LOCALE}.`,
      );
      studioConfiguration.locale = DEFAULT_STUDIO_LOCALE;
    }
    // warn if theme is not valid, but return default so typing is correct
    if (!Object.values(StudioTheme).includes(studioConfiguration.theme)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Theme: ${studioConfiguration.theme} is not valid. Defaulting to ${DEFAULT_STUDIO_THEME}.`,
      );
      studioConfiguration.theme = DEFAULT_STUDIO_THEME;
    }
    return studioConfiguration;
  }

  // eslint-disable-next-line class-methods-use-this
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

    const dispatchEvent = (
      eventName: string,
      eventMetadata: MessageBusEventMetadata,
      messageBusEventData: unknown,
    ) => {
      const eventNameToListenersMap = window.rbx?.messageBus.events as EventNameToListenersMap;
      const listeners = eventNameToListenersMap.get(eventName);
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

    window.rbx.messageBus = { dispatchEvent, events: new Map() };
  }

  // eslint-disable-next-line class-methods-use-this
  public async initHandshake(
    initParams: InternalInitRequestParams,
  ): Promise<InternalInitResponseParams> {
    return this.call('internal:init', initParams, 0);
  }

  private getFullEventName<TName extends keyof TParams>(eventName: TName) {
    if (String(eventName).includes('internal')) {
      return eventName.toString();
    }

    return `${this.namespace}:${String(eventName)}`;
  }

  // eslint-disable-next-line class-methods-use-this
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
  // - Doesn't return the callback since the uuid and event name are suffucient for matching
  private setListenerInternal<TName extends keyof TParams>(
    eventName: TName,
    callback: TMessageBusCallback<TParams[TName]['requestParams']>,
    uuid: string,
  ) {
    if (!isWebViewAvailable()) {
      throw new MessageBusError(MessageBusErrorCode.WEBVIEW_NOT_FOUND, String(eventName));
    }

    const fullEventName = this.getFullEventName(eventName);

    const eventNameToListenersMap = window.rbx?.messageBus.events as EventNameToListenersMap;
    let uuidSpecificListeners: Map<
      string,
      TMessageBusCallback<TParams[TName]['requestParams']>
    > = new Map();
    if (eventNameToListenersMap.has(fullEventName)) {
      const allListeners = eventNameToListenersMap.get(fullEventName) as EventListeners;
      if (allListeners.uuidSpecificListeners) {
        uuidSpecificListeners = allListeners.uuidSpecificListeners;
      } else {
        allListeners.uuidSpecificListeners = uuidSpecificListeners;
      }
    } else {
      const allListeners = {
        uuidSpecificListeners,
        generalListeners: [],
      };
      eventNameToListenersMap.set(fullEventName, allListeners);
    }

    uuidSpecificListeners.set(uuid, callback);
  }

  // removeListenerInternal is only used for callStudio
  // It differs from removeListener in that it:
  // - Removes the listener from the uuidSpecificListeners map
  private removeListenerInternal<TName extends keyof TParams>(eventName: TName, uuid: string) {
    const fullEventName = this.getFullEventName(eventName);
    const eventNameToListenersMap = window.rbx?.messageBus.events as EventNameToListenersMap;
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
    if (!isWebViewAvailable()) {
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

    const eventNameToListenersMap = window.rbx?.messageBus.events as EventNameToListenersMap;
    let generalListeners: TMessageBusCallback<unknown>[] = [];
    if (eventNameToListenersMap.has(fullEventName)) {
      const allListeners = eventNameToListenersMap?.get(fullEventName) as EventListeners;
      if (allListeners.generalListeners) {
        generalListeners = allListeners.generalListeners;
      } else {
        allListeners.generalListeners = generalListeners;
      }
    } else {
      const allListeners = {
        uuidSpecificListeners: new Map<string, TMessageBusCallback<unknown>>(),
        generalListeners,
      };
      eventNameToListenersMap.set(fullEventName, allListeners);
    }

    generalListeners.push(ackCallBack);
    return ackCallBack;
  }

  public removeListener<TName extends keyof TParams>(
    eventName: TName,
    callback: TMessageBusCallback<TParams[TName]['requestParams']>,
  ): void {
    const fullEventName = this.getFullEventName(eventName);
    const eventNameToListenersMap = window.rbx?.messageBus.events as EventNameToListenersMap;
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
