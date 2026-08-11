import ErrorCodes from '@constants/errorCodes';

interface AdCreditQuoteErrorBounds {
  maxAmount: string;
  minAmount: string;
}

interface MinimumQuoteAmounts {
  minAdCreditAmount: string;
  minRobuxAmount: string;
}

export type AdCreditQuoteErrorDisplay =
  | { type: 'insufficient_robux' }
  | {
      args?: Record<string, string>;
      translationKey: string;
      type: 'message';
    };

/**
 * Maps the backend AMA error code from GET /v1/adCreditQuotePreview to a
 * frontend display shape. Unknown or missing codes fall back to the generic
 * unavailable message.
 */
export const resolveAdCreditQuoteErrorDisplay = (
  errorCode: string | undefined,
  bounds: AdCreditQuoteErrorBounds,
  minimumQuoteAmounts?: MinimumQuoteAmounts,
): AdCreditQuoteErrorDisplay => {
  switch (errorCode) {
    case ErrorCodes.AD_CREDIT_QUOTE_INSUFFICIENT_ROBUX:
      return { type: 'insufficient_robux' };
    case ErrorCodes.AD_CREDIT_QUOTE_INSUFFICIENT_ROBUX_FOR_MINIMUM_PURCHASE:
      return {
        args: { minAdCreditAmount: bounds.minAmount },
        translationKey: 'Message.InsufficientRobuxForMinimumAdCredit',
        type: 'message',
      };
    case ErrorCodes.AD_CREDIT_QUOTE_BELOW_MINIMUM:
      if (minimumQuoteAmounts !== undefined) {
        return {
          args: {
            minAdCreditAmount: minimumQuoteAmounts.minAdCreditAmount,
            minRobuxAmount: minimumQuoteAmounts.minRobuxAmount,
          },
          translationKey: 'Message.MinimumAdCreditRequiresRobux',
          type: 'message',
        };
      }
      return {
        args: { minAmount: bounds.minAmount },
        translationKey: 'Description.MinimumAdCreditHint',
        type: 'message',
      };
    case ErrorCodes.AD_CREDIT_QUOTE_ABOVE_MAXIMUM:
      return {
        args: { maxAmount: bounds.maxAmount },
        translationKey: 'Validation.MaximumAdCredit',
        type: 'message',
      };
    case ErrorCodes.AD_CREDIT_QUOTE_INVALID_AMOUNT:
      return {
        translationKey: 'Message.QuoteInvalidAmount',
        type: 'message',
      };
    case ErrorCodes.AD_CREDIT_QUOTE_UNAVAILABLE:
      return {
        translationKey: 'Message.QuoteConversionUnavailable',
        type: 'message',
      };
    default:
      return {
        translationKey: 'Message.QuoteConversionUnavailable',
        type: 'message',
      };
  }
};
