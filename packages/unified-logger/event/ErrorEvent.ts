import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class ErrorEvent extends TaggableEvent {
  eventType: TEventType = 'error';
}
