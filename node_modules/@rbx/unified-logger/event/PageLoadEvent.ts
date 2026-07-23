import type { TEventType, TFieldName, TFieldValue } from './BaseEvent';
import type { TTaggableEventParams } from './TaggableEvent';
import TaggableEvent from './TaggableEvent';

// configurable fields of the event
type TPageLoadEventParams = TTaggableEventParams & { referralUrl?: string };
// currently all pageload events have fixed eventName
const PAGELOAD_EVENT_NAME = 'pageload';

export default class PageLoadEvent extends TaggableEvent {
  private referralUrl: string | undefined;

  eventType: TEventType = 'pageload';

  constructor({
    product,
    url,
    eventName = PAGELOAD_EVENT_NAME,
    parameters,
    source,
    tags,
    sessionId,
    referralUrl,
  }: TPageLoadEventParams) {
    super({ product, url, eventName, parameters, source, tags, sessionId });
    this.referralUrl = referralUrl;
  }

  toLogEventObject(): Record<TFieldName, TFieldValue> {
    return {
      ...super.toLogEventObject(),
      referralUrl: this.referralUrl,
    };
  }

  setReferralUrl(url: string) {
    this.referralUrl = url;
  }
}
