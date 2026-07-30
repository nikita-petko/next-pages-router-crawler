export const ConfigureBadgeRegisterOptions = {
  name: {
    required: 'Error.Required',
    maxLength: 50,
  },
  description: {
    maxLength: 1000,
  },
};

export type ConfigureBadgeFormType = {
  name: string;
  description: string;
  isItemActive: boolean;
  file: File | null;
};
