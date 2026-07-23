import adsClient from '@clients/ads';
import { AdAccountPaymentStatusResponseType } from '@type/advertiser';
import { HttpError } from '@type/errorResponse';
import {
  AccountBalanceType,
  AdCreditTransactionHistoryResult,
  ChargeRequestStatusEnum,
  ListPaymentActivitiesResponseType,
  RefundRequestStatusEnum,
} from '@type/payment';

// adAccountBalance returns several types of balances separately.
const adAccountBalance = async (): Promise<AccountBalanceType> => {
  const url = '/v1/payment/accountBalance';
  const accountBalanceResponse = await adsClient.get<AccountBalanceType>({
    url,
  });

  if (accountBalanceResponse.status !== 200) {
    const error = new HttpError({
      message: 'Could not fetch ad account balance',
      responseData: accountBalanceResponse.data,
      status: accountBalanceResponse.status,
      statusText: accountBalanceResponse.statusText,
      url,
    });
    throw error;
  }

  return accountBalanceResponse.data;
};

// adAccountCurrentBalance is the sum of unbilled balance and failed payment balance.
export const adAccountCurrentBalance = async (): Promise<number> => {
  const balance = await adAccountBalance();
  return balance.running_balance + balance.failed_payments_balance;
};

export const adAccountPaymentStatus = async (
  groupId?: number,
): Promise<AdAccountPaymentStatusResponseType> => {
  const url = groupId
    ? `/v1/payment/adAccountStatus?groupId=${groupId}`
    : '/v1/payment/adAccountStatus';
  const adAccountPaymentStatusResponse = await adsClient.get<AdAccountPaymentStatusResponseType>({
    url,
  });

  if (adAccountPaymentStatusResponse.status !== 200) {
    const error = new HttpError({
      message: 'Could not fetch ad account payment status',
      responseData: adAccountPaymentStatusResponse.data,
      status: adAccountPaymentStatusResponse.status,
      statusText: adAccountPaymentStatusResponse.statusText,
      url,
    });
    throw error;
  }

  return adAccountPaymentStatusResponse.data;
};

const listPaymentActivities = async (
  chargeStatusValues: ChargeRequestStatusEnum[],
  refundStatusValues: RefundRequestStatusEnum[],
  endTimeMs: number,
  limit: number,
): Promise<ListPaymentActivitiesResponseType> => {
  const params = new URLSearchParams();
  chargeStatusValues.forEach((status: ChargeRequestStatusEnum) => {
    params.append('charge_request_status[]', `${status}`);
  });
  refundStatusValues.forEach((status: RefundRequestStatusEnum) => {
    params.append('refund_request_status[]', `${status}`);
  });
  params.set('end_time_ms', `${endTimeMs}`);
  params.set('limit', `${limit}`);

  const url = `/v1/payment/activities?${params.toString()}`;
  const listPaymentActivitiesResponse = await adsClient.get<ListPaymentActivitiesResponseType>({
    url,
  });

  if (listPaymentActivitiesResponse.status !== 200) {
    const error = new HttpError({
      message: 'Could not fetch ad account payment activities',
      responseData: listPaymentActivitiesResponse.data,
      status: listPaymentActivitiesResponse.status,
      statusText: listPaymentActivitiesResponse.statusText,
      url,
    });
    throw error;
  }

  return listPaymentActivitiesResponse.data;
};

export const getAdCreditTransactionHistory = async (
  pageSize: number,
  cursor: string,
  groupId?: number,
): Promise<AdCreditTransactionHistoryResult> => {
  const params = new URLSearchParams();
  params.set('page_size', `${pageSize}`);
  params.set('cursor', cursor);
  if (groupId) {
    params.set('groupId', `${groupId}`);
  }
  const url = `/v1/adCreditTransactionHistory?${params.toString()}`;
  const getAdCreditTransactionHistoryResponse =
    await adsClient.get<AdCreditTransactionHistoryResult>({
      url,
    });

  if (getAdCreditTransactionHistoryResponse.status !== 200) {
    const error = new HttpError({
      message: 'Could not fetch ad credit transaction history',
      responseData: getAdCreditTransactionHistoryResponse.data,
      status: getAdCreditTransactionHistoryResponse.status,
      statusText: getAdCreditTransactionHistoryResponse.statusText,
      url,
    });
    throw error;
  }

  return getAdCreditTransactionHistoryResponse.data;
};

export const listSucceededAndFailedPaymentActivities = async (
  endTimeMs: number,
  limit: number,
): Promise<ListPaymentActivitiesResponseType> => {
  const response = await listPaymentActivities(
    [ChargeRequestStatusEnum.Succeeded, ChargeRequestStatusEnum.Failed],
    [RefundRequestStatusEnum.Succeeded],
    endTimeMs,
    limit,
  );
  return response;
};
