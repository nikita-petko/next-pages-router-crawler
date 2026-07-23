import {
  NotificationContentFormTypesType,
  NotificationContentFormType,
} from '../types/notificationContentForm';

export const NotificationContentFormTypes: Record<string, NotificationContentFormTypesType> = {
  create: 'CREATE',
  update: 'UPDATE',
};

export const NotificationContentFormRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 50,
  },
  content: { required: 'Message.RequiredFieldMissed', maxLength: 99 },
};

export const NotificationContentFormDefaultValue: NotificationContentFormType = {
  name: '',
  content: '',
};
