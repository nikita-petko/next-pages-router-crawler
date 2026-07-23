import type { BaseEvent } from '../event';
import type EventLogger from './EventLogger';

export default class ConsoleEventLogger implements EventLogger {
  logEvent(event: BaseEvent): void {
    const eventObject = event.toLogEventObject();
    // eslint-disable-next-line no-console
    console.table([{ localTime: new Date(), ...eventObject }]);
  }
}
