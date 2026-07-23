type NotificationListener = (notificationId: string) => void;

type MessageEventListeners = {
  newNotification: Set<NotificationListener>;
  notificationRead: Set<NotificationListener>;
  notificationUnread: Set<NotificationListener>;
  allNotificationsRead: Set<NotificationListener>;
};

type EventName = keyof MessageEventListeners;

class SignalREventEmitter {
  private readonly listeners: MessageEventListeners = {
    newNotification: new Set(),
    notificationRead: new Set(),
    notificationUnread: new Set(),
    allNotificationsRead: new Set(),
  };

  on(eventName: 'newNotification', listener: NotificationListener): void;
  on(eventName: 'notificationRead', listener: NotificationListener): void;
  on(eventName: 'notificationUnread', listener: NotificationListener): void;
  on(eventName: 'allNotificationsRead', listener: () => void): void;
  on(eventName: EventName, listener: NotificationListener): void {
    this.listeners[eventName].add(listener);
  }

  removeListener(eventName: 'newNotification', listener: NotificationListener): void;
  removeListener(eventName: 'notificationRead', listener: NotificationListener): void;
  removeListener(eventName: 'notificationUnread', listener: NotificationListener): void;
  removeListener(eventName: 'allNotificationsRead', listener: () => void): void;
  removeListener(eventName: EventName, listener: NotificationListener): void {
    this.listeners[eventName].delete(listener);
  }

  emit(eventName: 'newNotification', notificationId: string): void;
  emit(eventName: 'notificationRead', notificationId: string): void;
  emit(eventName: 'notificationUnread', notificationId: string): void;
  emit(eventName: 'allNotificationsRead'): void;
  emit(eventName: EventName, notificationId?: string): void {
    if (eventName === 'allNotificationsRead') {
      this.listeners[eventName].forEach((listener) => {
        listener('');
      });
      return;
    }
    if (notificationId === undefined) {
      return;
    }
    this.listeners[eventName].forEach((listener) => {
      listener(notificationId);
    });
  }
}

const signalREventEmitter = new SignalREventEmitter();

export default signalREventEmitter;
