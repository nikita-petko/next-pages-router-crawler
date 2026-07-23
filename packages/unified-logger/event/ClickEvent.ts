import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class ClickEvent extends TaggableEvent {
  eventType: TEventType = 'click';
}
