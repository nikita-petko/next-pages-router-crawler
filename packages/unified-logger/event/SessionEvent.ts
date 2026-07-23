import { TEventType } from './BaseEvent';
import TaggableEvent, { TTaggableEventParams } from './TaggableEvent';

// No custom eventName for session event
export const SESSION_START_EVENT_NAME = 'sessionStart';

export type TSessionEventName = typeof SESSION_START_EVENT_NAME;

type TSessionEventParams = TTaggableEventParams & {
  eventName: TSessionEventName;
  sessionId: string;
};

export default class SessionEvent extends TaggableEvent {
  eventType: TEventType = 'session';

  constructor({ product, url, eventName, parameters, source, sessionId }: TSessionEventParams) {
    super({ product, url, eventName, parameters, source, sessionId });
  }
}
