export const defaultErrorCode = 999;

const errorMapping: { [key: number]: string } = {
  // SubmitDevexErrorCode.UserCannotCashout — includes DevEx suspension rejections from billing-api.
  30: 'Message.DevExSuspendedSubmitError',
  40: 'Message.InsufficientFunds',
  50: 'Message.IncorrectCredentials',
};

const genericError = 'Message.GenericError';

export const getErrorMessage = (
  translate: (key: string, args?: { [key: string]: string }) => string,
  errorCode: number,
) => {
  if (errorMapping[errorCode]) {
    return translate(errorMapping[errorCode]);
  }

  return translate(genericError);
};
