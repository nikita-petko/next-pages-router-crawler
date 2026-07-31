import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class FormVitalsEvent extends TaggableEvent {
  eventType: TEventType = 'formvitals';
}
