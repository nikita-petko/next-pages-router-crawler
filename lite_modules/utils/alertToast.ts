import { AlertToastLevel } from '@constants/toastConstants';

enum SupportedAlertToastLevelStrings {
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
}

export const StringToAlertToastLevel = (str: string) => {
  if (str === SupportedAlertToastLevelStrings.Error) {
    return AlertToastLevel.Error;
  }

  if (str === SupportedAlertToastLevelStrings.Info) {
    return AlertToastLevel.Info;
  }

  if (str === SupportedAlertToastLevelStrings.Warning) {
    return AlertToastLevel.Warning;
  }

  return AlertToastLevel.Warning;
};
