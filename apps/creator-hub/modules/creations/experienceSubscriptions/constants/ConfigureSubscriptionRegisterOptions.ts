export const ConfigureSubscriptionRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 29,
    pattern: {
      value: /^[a-zA-Z0-9.,:/!?@#&' ]+$/,
      message: 'Error.InvalidSubscriptionName',
    },
  },
  description: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 1000,
    validate: {
      minLength: (name: string) => {
        return name.length >= 10 || 'Error.DescriptionMinimum';
      },
    },
  },
  file: {},
  productType: {
    required: 'Message.RequiredFieldMissed',
    pattern: { value: /^[+]?\d+([.]\d+)?$/, message: 'Error.InvalidNumber' },
  },
  price: { required: 'Message.RequiredFieldMissed' },
  period: { required: 'Message.RequiredFieldMissed' },
};

export type ConfigureSubscriptionFormType = {
  // cannot be changed for MVP
  name: string;
  description: string;
  // can be changed anytime
  file: File | null;
  // can never be changed
  productType: number;
  price: number;
  recurrence: number;
};
