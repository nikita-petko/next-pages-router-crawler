import { MessageBusEventType } from '../types/MessageBusTypes';

export enum MessageBusErrorCode {
  TIMED_OUT = 'TIMED_OUT',
  WEBVIEW_NOT_INITIALIZED = 'WEBVIEW_NOT_INITIALIZED',
  WEBVIEW_NOT_FOUND = 'WEBVIEW_NOT_FOUND',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
}

export class MessageBusError extends Error {
  code: MessageBusErrorCode;

  eventName?: string;

  eventType?: MessageBusEventType;

  constructor(
    code: MessageBusErrorCode,
    eventName: string | undefined = undefined,
    eventType: MessageBusEventType | undefined = undefined,
  ) {
    // Ensure the error message is properly formatted
    let errorStr = `MessageBusError, code: ${code}`;
    if (eventName) {
      errorStr += `, eventName: ${eventName}`;
    }

    if (eventType) {
      errorStr += `, type: ${eventType}`;
    }

    super(errorStr);
    this.code = code;
    this.eventName = eventName;
    this.eventType = eventType;
  }
}
