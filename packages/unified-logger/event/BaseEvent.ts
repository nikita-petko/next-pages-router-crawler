import { TProduct } from '../core/types';

export type TFieldName = string;
export type TFieldValue = string | number | boolean | undefined;
export type TEventType =
  | 'pageload'
  | 'click'
  | 'imp'
  | 'hover'
  | 'base'
  | 'webvitals'
  | 'error'
  | 'session'
  | 'apivitals';

// configurable fields of the event, here are shared contextual event fields
// across event types
export type TBaseEventParams = {
  product: TProduct;
  url: string;
  source?: string;
  eventName?: string;
  parameters?: Record<string, string>;
  sessionId?: string;
};
export default abstract class BaseEvent {
  eventType: TEventType = 'base';

  // event product domain
  product: TProduct;

  // page url
  url: string;

  // optional additional parameters
  parameters?: Record<string, string>;

  eventName?: string;

  source?: string;

  sessionId?: string;

  constructor({ product, url, eventName, parameters, source, sessionId }: TBaseEventParams) {
    this.product = product;
    this.url = url;
    this.eventName = eventName;
    this.parameters = parameters;
    this.source = source;
    this.sessionId = sessionId;
  }

  setURL(url: string) {
    this.url = url;
  }

  getURL(): string | undefined {
    return this.url;
  }

  toLogEventObject(): Record<TFieldName, TFieldValue> {
    return {
      product: this.product,
      eventType: this.eventType,
      url: this.url,
      eventName: this.eventName,
      parameters: this.parameters ? JSON.stringify(this.parameters) : undefined,
      source: this.source ?? undefined,
      sessionId: this.sessionId ?? undefined,
    };
  }
}
