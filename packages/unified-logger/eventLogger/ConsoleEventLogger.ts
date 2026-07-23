import { BaseEvent } from '../event';
import EventLogger from './EventLogger';

export default class ConsoleEventLogger implements EventLogger {
  // eslint-disable-next-line class-methods-use-this
  logEvent(event: BaseEvent): void {
    const eventObject = event.toLogEventObject();
    // eslint-disable-next-line no-console
    console.table([{ localTime: new Date(), ...eventObject }]);
  }
}
