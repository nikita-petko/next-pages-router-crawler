import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class WebVitalsEvent extends TaggableEvent {
  eventType: TEventType = 'webvitals';
}
