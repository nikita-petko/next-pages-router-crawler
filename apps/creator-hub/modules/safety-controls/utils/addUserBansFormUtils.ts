import { UseFormProps } from 'react-hook-form';
import { DurationUnits, MAX_NUM_USERS_BULK_OPERATION } from '../constants/userBansConstants';

export enum BanDurationType {
  PermanentBan = 'permanentBan',
  CustomBan = 'customBan',
}

export type AddUserBansFormProps = {
  usersToBan: string[];
  banDurationType: BanDurationType;
  banDurationUnits: DurationUnits;
  banDurationQuantity: string;
  publicReason: string;
  privateReason: string;
  banAltAccounts: boolean;
};

export const formConfig: UseFormProps<AddUserBansFormProps> = {
  defaultValues: {
    usersToBan: [],
    banDurationType: BanDurationType.PermanentBan,
    banDurationUnits: DurationUnits.Days,
    banDurationQuantity: '',
    publicReason: '',
    privateReason: '',
    banAltAccounts: false,
  },
};

const publicReasonCharacterLimit: number = 400;
const privateReasonCharacterLimit: number = 1000;

export const getFormValidation = (
  translate: (key: string, args?: { [key: string]: string }) => string,
  banDurationTypeRef: BanDurationType,
) => {
  const validateUsersToBan = {
    validate: (values: string[]) => values.every((value) => value && !Number.isNaN(Number(value))),
  };

  const validateBanDurationQuantity = {
    required: {
      value: banDurationTypeRef === BanDurationType.CustomBan,
      message: translate('Error.MissingValue'),
    },
    validate: (val: string) =>
      banDurationTypeRef !== BanDurationType.CustomBan ||
      !Number.isNaN(Number(val)) ||
      translate('Label.NumericalInputOnly'),
  };

  const validateBanDurationUnits = {
    required: {
      value: banDurationTypeRef === BanDurationType.CustomBan,
      message: translate('Error.MissingDurationUnits'),
    },
  };

  const validatePublicReason = {
    maxLength: {
      value: publicReasonCharacterLimit,
      message: translate('Error.CharacterLimit', {
        maxChar: publicReasonCharacterLimit.toString(),
      }),
    },
  };

  const validatePrivateReason = {
    maxLength: {
      value: privateReasonCharacterLimit,
      message: translate('Error.CharacterLimit', {
        maxChar: privateReasonCharacterLimit.toString(),
      }),
    },
  };

  return {
    validateUsersToBan,
    validateBanDurationQuantity,
    validateBanDurationUnits,
    validatePublicReason,
    validatePrivateReason,
  };
};

export const getBanDurationFromUserBanData = (addUserBansFormData: AddUserBansFormProps) => {
  if (addUserBansFormData.banDurationType === BanDurationType.PermanentBan) {
    return null;
  }
  let durationInSeconds;
  switch (addUserBansFormData.banDurationUnits) {
    case DurationUnits.Minutes:
      durationInSeconds = Number(addUserBansFormData.banDurationQuantity) * 60;
      break;
    case DurationUnits.Hours:
      durationInSeconds = Number(addUserBansFormData.banDurationQuantity) * 60 * 60;
      break;
    case DurationUnits.Days:
      durationInSeconds = Number(addUserBansFormData.banDurationQuantity) * 60 * 60 * 24;
      break;
  }
  return { seconds: durationInSeconds };
};

export const parseUserIdsToBan = (userIds: string[]): string[] => {
  const commaWhitespaceSemicolonRegex = /[,;\s]/;
  const allUserIds = userIds
    .flatMap((val) => val.split(commaWhitespaceSemicolonRegex).map((v) => v.trim()))
    .filter((val) => val !== '');

  if (allUserIds.length > MAX_NUM_USERS_BULK_OPERATION) {
    return allUserIds.slice(0, MAX_NUM_USERS_BULK_OPERATION);
  }

  return allUserIds;
};
