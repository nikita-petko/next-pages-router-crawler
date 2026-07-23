import type { TEventType } from './BaseEvent';
import TaggableEvent from './TaggableEvent';

export default class ApiVitalsEvent extends TaggableEvent {
  eventType: TEventType = 'apivitals';
}
