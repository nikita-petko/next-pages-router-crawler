export const CreateBadgeRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 50,
  },
  description: { maxLength: 1000 },
  file: { required: true },
};

export const CreateBadgeFormDefaultValue = {
  name: '',
  description: '',
  isItemActive: true,
  file: null,
  isGroupFundUsed: false,
};

export type CreateBadgeFormType = {
  name: string;
  description: string;
  isItemActive: boolean;
  file: File | null;
  isGroupFundUsed: boolean;
};
