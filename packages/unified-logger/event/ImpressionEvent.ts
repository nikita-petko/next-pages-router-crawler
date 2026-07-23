import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class ImpressionEvent extends TaggableEvent {
  eventType: TEventType = 'imp';
}
