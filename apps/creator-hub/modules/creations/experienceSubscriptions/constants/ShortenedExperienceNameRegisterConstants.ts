export type ShortenedExperienceNameModalFormType = {
  name: string;
  confirmedName: string;
};

export const ShortenedExperienceNameModalRegisterOptions = {
  name: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 25,
    pattern: {
      value: /^[a-zA-Z0-9.,:/!?@#&' ]+$/,
      message: 'Message.AllowedSENCharacters',
    },
    validate: {
      minLength: (name: string) => {
        return name.length >= 2 || 'Error.SENNameLength';
      },
    },
  },
  confirmedName: {
    required: 'Message.RequiredFieldMissed',
    maxLength: 25,
  },
};

export const ShortenedExperienceNameModalDefaultValue = {
  name: '',
  confirmedName: '',
};
