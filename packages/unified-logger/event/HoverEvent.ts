import { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class HoverEvent extends TaggableEvent {
  eventType: TEventType = 'hover';
}
