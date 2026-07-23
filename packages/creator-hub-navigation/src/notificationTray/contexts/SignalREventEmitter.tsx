import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';

type MessageEvent = {
  newNotification: (notificationId: string) => void;
  notificationRead: (notificationId: string) => void;
  notificationUnread: (notificationId: string) => void;
  allNotificationsRead: () => void;
};

const signalREventEmitter = new EventEmitter() as TypedEmitter<MessageEvent>;

export default signalREventEmitter;
