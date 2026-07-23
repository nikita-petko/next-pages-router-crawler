import { CreatorTaxAPIApi, TaxOnboardingTokenBlockedReason } from '@rbx/client-creator-tax-api/v1';
import type { GetTaxOnboardingResultResponse, PaymentType } from '@rbx/client-creator-tax-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export {
  PaymentType,
  TaxOnboardingStatus,
  TaxOnboardingTokenBlockedReason,
  WithholdingBasis,
} from '@rbx/client-creator-tax-api/v1';
export type {
  GetWithholdingRateResponse,
  GetTaxOnboardingStatusResponse,
  GetTaxDevexStatusResponse,
  GetTaxOnboardingResultResponse,
  StartTaxOnboardingResponse,
} from '@rbx/client-creator-tax-api/v1';

const TaxOnboardingPollIntervalMs = 4_000;
const TaxOnboardingMaxPollDurationMs = 120_000;
const TaxOnboardingTokenExpiryBufferMs = 60_000;

const creatorTaxApiClient = new CreatorTaxAPIApi(
  createClientConfiguration('creator-tax', 'bedev2'),
);

export const getWithholdingRate = (paymentType: PaymentType, options?: RequestInit) =>
  creatorTaxApiClient.getWithholdingRate({ paymentType }, options);

export const getTaxOnboardingStatus = (options?: RequestInit) =>
  creatorTaxApiClient.getTaxOnboardingStatus(options);

export const getTaxDevexStatus = (options?: RequestInit) =>
  creatorTaxApiClient.getTaxDevexStatus(options);

function getAbortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }

  const error = new Error('Tax onboarding request was aborted');
  error.name = 'AbortError';
  return error;
}

function wait(milliseconds: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(getAbortError(signal));
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);
    const handleAbort = () => {
      clearTimeout(timeoutId);
      if (signal) {
        reject(getAbortError(signal));
      }
    };
    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function isTaxOnboardingTokenExpired(tokenExpiryTime?: Date): boolean {
  if (!tokenExpiryTime) {
    return false;
  }

  return tokenExpiryTime.getTime() <= Date.now() + TaxOnboardingTokenExpiryBufferMs;
}

function isTaxOnboardingTokenBlocked(
  tokenBlockedReason?: TaxOnboardingTokenBlockedReason,
): boolean {
  return (
    tokenBlockedReason !== undefined &&
    tokenBlockedReason !== TaxOnboardingTokenBlockedReason.Invalid
  );
}

export const getOrCreateTaxOnboarding = async (
  options?: RequestInit,
): Promise<GetTaxOnboardingResultResponse> => {
  const startResponse = await creatorTaxApiClient.startTaxOnboarding({ body: {} }, options);
  if (!startResponse.accepted) {
    throw new Error('Tax onboarding start response was not accepted');
  }

  const startTime = Date.now();
  while (Date.now() - startTime < TaxOnboardingMaxPollDurationMs) {
    const result = await creatorTaxApiClient.getTaxOnboardingResult(options);

    if (isTaxOnboardingTokenBlocked(result.tokenBlockedReason)) {
      return result;
    }

    // tax-service mints the SDK token as soon as the tax profile is usable (regardless of onboarding
    // status), and returns an empty token until then. Surface it as soon as it is present and unexpired.
    if (result.sdkToken && !isTaxOnboardingTokenExpired(result.tokenExpiryTime)) {
      return result;
    }

    await wait(TaxOnboardingPollIntervalMs, options?.signal);
  }

  throw new Error('Tax onboarding workflow did not complete before polling timed out');
};
