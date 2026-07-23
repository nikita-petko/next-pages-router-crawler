import React, { FunctionComponent, useCallback, useContext, useMemo } from 'react';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { StatusCodes } from '@rbx/core';
import serviceEfficiencyClient, {
  type ServiceEfficiencyClient,
} from '@modules/clients/serviceEfficiency';
import { getResponseFromError } from '@modules/clients/utils';
import {
  BillingActivitiesResponse,
  BillDetailsResponse,
  ConsumerConfigurationRequest,
  GetServiceEfficiencyPaymentMethodResponse,
  ServiceEfficiencyApiUpdateAccountForUserRequest,
  ConsumerConfigurationResponse,
  GetAccountResponse,
  UpdateAccountResponse,
  ListPaymentProfilesResponse,
  Money,
  BudgetLevel,
  ResourceConfigurationPrice,
  EligibilityRequirementResult,
} from '@rbx/clients/serviceEfficiencyApi/v1';

import { getErrorStatus } from '@modules/clients';
import {
  Account,
  ActivityRowInfo,
  BalanceInfo,
  BillDetails,
  CreatePaymentProfileResponse,
  PaymentProfile,
  ServiceConfiguration,
  ServiceId,
  TResourceIndexInfo,
  TUnlockServiceForm,
  UnlockServiceConfigurations,
} from './types';
import { isValidMoneyString, moneyToNumber, stringToMoney } from '../utils/formatters';

function getServiceBudgetString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (
    value &&
    typeof value === 'object' &&
    'budget' in value &&
    typeof (value as { budget: unknown }).budget === 'string'
  ) {
    return String((value as { budget: string }).budget).trim();
  }
  return '';
}

const isValidServiceConfigurationsResponse = (
  res: ConsumerConfigurationResponse,
): res is UnlockServiceConfigurations => {
  return !(
    !res.accountState ||
    typeof res.accountInfoComplete === 'undefined' ||
    !Array.isArray(res.serviceConfigurations)
  );
};

export type CloudPricingClientProvider = {
  getAccountActivity: (
    creatorType: CreatorType,
    id: number,
    userIdOverride?: number,
    groupIdOverride?: number,
    startTime?: string | null, // YYYY-MM
    endTime?: string | null, // YYYY-MM
  ) => Promise<{ balanceInfo: BalanceInfo; activityInfo: ActivityRowInfo[] }>;
  getBillingInfo: (
    id: number,
    creatorType: CreatorType,
    billingDate?: Date,
    latest?: boolean,
    userIdOverride?: number,
    groupIdOverride?: number,
  ) => Promise<BillDetails>;
  getUnlockServiceSettings: (universeId: number) => Promise<UnlockServiceConfigurations>;
  updateUnlockServiceSettings: (
    universeId: number,
    data: TUnlockServiceForm,
    serviceIndexRef: TResourceIndexInfo[],
    originalServiceConfigurations?: ServiceConfiguration[],
  ) => Promise<UnlockServiceConfigurations>;
  buildUnlockServiceRequest: (
    data: TUnlockServiceForm,
    serviceIndexRef: TResourceIndexInfo[],
    originalServiceConfigurations?: ServiceConfiguration[],
  ) => ConsumerConfigurationRequest;
  sendUnlockServiceUpdate: (
    universeId: number,
    request: ConsumerConfigurationRequest,
  ) => Promise<UnlockServiceConfigurations>;
  createUserPaymentProfile: (userId: number) => Promise<{ clientSecret: string }>;
  listPaymentProfiles: (
    userId: number,
    userIdOverride?: number,
  ) => Promise<{ paymentProfiles: PaymentProfile[] | null }>;
  getPaymentProfiles: (
    creatorType: CreatorType,
    id: number,
    userIdOverride?: number,
    groupIdOverride?: number,
  ) => Promise<PaymentProfile | null>;
  setPaymentProfiles: (
    creatorType: CreatorType,
    id: number,
    paymentProfileId: string,
    paymentProfileOwnerType: string,
  ) => Promise<null>;
  getAccountSettings: (
    id: number,
    creatorType: CreatorType,
    userIdOverride?: number,
    groupIdOverride?: number,
  ) => Promise<Account | null>;
  updateAccountSettings: (
    id: number,
    creatorType: CreatorType,
    account: Account,
  ) => Promise<Account>;
  deletePaymentProfile: (userId: number, paymentProfileId: string) => Promise<null>;
  submitManualPayment: (
    creatorType: CreatorType,
    id: number,
    amount: Money,
    billId: string,
  ) => Promise<null>;
  checkEligibility: (
    creatorType: CreatorType,
    id: number,
  ) => Promise<EligibilityRequirementResult[]>;
};

export const CloudPricingClientContext = React.createContext<CloudPricingClientProvider>({
  getAccountActivity(): Promise<{ balanceInfo: BalanceInfo; activityInfo: ActivityRowInfo[] }> {
    return Promise.reject(new Error('not implemented'));
  },
  getBillingInfo(): Promise<BillDetails> {
    return Promise.reject(new Error('not implemented'));
  },
  getUnlockServiceSettings(): Promise<UnlockServiceConfigurations> {
    return Promise.reject(new Error('not implemented'));
  },
  updateUnlockServiceSettings(): Promise<UnlockServiceConfigurations> {
    return Promise.reject(new Error('not implemented'));
  },
  sendUnlockServiceUpdate(): Promise<UnlockServiceConfigurations> {
    return Promise.reject(new Error('not implemented'));
  },
  createUserPaymentProfile(): Promise<CreatePaymentProfileResponse> {
    return Promise.reject(new Error('not implemented'));
  },
  listPaymentProfiles(): Promise<{ paymentProfiles: PaymentProfile[] | null }> {
    return Promise.reject(new Error('not implemented'));
  },
  getPaymentProfiles(): Promise<PaymentProfile | null> {
    return Promise.reject(new Error('not implemented'));
  },
  setPaymentProfiles(): Promise<null> {
    return Promise.reject(new Error('not implemented'));
  },
  getAccountSettings(): Promise<Account | null> {
    return Promise.reject(new Error('not implemented'));
  },
  updateAccountSettings(): Promise<Account> {
    return Promise.reject(new Error('not implemented'));
  },
  deletePaymentProfile(): Promise<null> {
    return Promise.reject(new Error('not implemented'));
  },
  submitManualPayment(): Promise<null> {
    return Promise.reject(new Error('not implemented'));
  },
  checkEligibility(): Promise<EligibilityRequirementResult[]> {
    return Promise.reject(new Error('not implemented'));
  },
  buildUnlockServiceRequest(): ConsumerConfigurationRequest {
    throw new Error('not implemented');
  },
});

export const useCloudPricingClient = (): CloudPricingClientProvider => {
  const client = useContext(CloudPricingClientContext);
  if (client === null) {
    throw new Error('useCloudPricingClient must be used within a CloudPricingClientContext');
  }
  return client;
};

export const SEErrorStatusToMessageKey: { [key in StatusCodes]?: string } = {
  [StatusCodes.UNAUTHORIZED]: 'Error.NotAuthorized',
};
export const DEFAULT_ERROR_KEY = 'Error.TryAgainLater';
export const unlockServiceFormToRequest = (
  data: TUnlockServiceForm,
  serviceIndexRef: TResourceIndexInfo[],
  originalServiceConfigurations?: ServiceConfiguration[],
) => {
  return {
    serviceConfigurations: serviceIndexRef.map((serviceInfo, serviceIndex) => {
      const unlockConfig =
        data.unlockConfiguration.find((uc) => uc.serviceId === serviceInfo.serviceId) ??
        data.unlockConfiguration[serviceIndex];
      if (!unlockConfig) {
        throw new Error(
          `unlockServiceFormToRequest: missing unlockConfiguration for ${serviceInfo.serviceId}`,
        );
      }

      /*
        We handle the unlock form in three different ways:
        1. ServiceOnly: All resources are unlocked together
        2. ResourceOnly: Each resource is unlocked individually
        3. DataStore: Access and Storage are critical resources and are treated as a unique case
      */
      const isServiceOnly = unlockConfig.budgetLevel === BudgetLevel.ServiceOnly;
      const firstResource = unlockConfig.resourceConfigurations?.[0];
      const firstResourceUnlocked =
        isServiceOnly && firstResource ? firstResource.isUnlocked === true : false;

      // If the first resource is unlocked, and our budgetLevel is ServiceOnly then we need to create ServiceBudget
      // So we can set it as the serviceConfiguration's monthlyBudget
      // This is because there is not an isUnlocked field for the serviceConfiguration, we must assume that if a resource is unlocked
      // The entire service is unlocked.
      let serviceBudget = null;
      if (
        isServiceOnly &&
        firstResourceUnlocked &&
        serviceInfo.serviceId !== ServiceId.DataStoreStorage
      ) {
        const budgetStr = getServiceBudgetString(unlockConfig.serviceBudget);
        if (budgetStr && isValidMoneyString(budgetStr)) {
          serviceBudget = stringToMoney(budgetStr);
        }
      }

      const originalService = originalServiceConfigurations?.find(
        (s) => s.serviceId === serviceInfo.serviceId,
      );

      const isDataStoreServiceOnly =
        isServiceOnly &&
        serviceInfo.serviceId === ServiceId.DataStore &&
        (originalService?.resourceConfigurations?.length ?? 0) > 0;

      // Data Store is on a separate form, so we need to check if we're pulling from the original
      // serviceConfiguration form or the critical resource form.
      const resourceConfigurations = isDataStoreServiceOnly
        ? originalService!.resourceConfigurations!.map((originalResource) => ({
            resourceId: originalResource.resourceId,
            unlocked: firstResourceUnlocked,
            monthlyBudget: null,
            unitCost: originalResource.unitCost ?? {},
            price: (originalResource.price ?? {}) as ResourceConfigurationPrice,
          }))
        : serviceInfo.resourceIndexesInFormArray.map((_, index) => {
            const resourceFormData = unlockConfig.resourceConfigurations?.[index];
            if (!resourceFormData) {
              throw new Error(
                `unlockServiceFormToRequest: missing resourceConfigurations[${index}] for service ${serviceIndex}`,
              );
            }
            const originalResource = originalService?.resourceConfigurations?.[index];
            let unlocked: boolean;
            if (isServiceOnly) {
              unlocked = firstResourceUnlocked;
            } else {
              unlocked = resourceFormData.isUnlocked === true;
            }

            let resourceBudget = null;
            if (unlocked && !isServiceOnly) {
              const budgetStr =
                typeof resourceFormData.resourceBudget === 'string'
                  ? resourceFormData.resourceBudget
                  : '';
              if (budgetStr && isValidMoneyString(budgetStr)) {
                resourceBudget = stringToMoney(budgetStr);
              }
            }

            return {
              resourceId: resourceFormData.resourceId,
              unlocked,
              monthlyBudget: resourceBudget,
              unitCost: originalResource?.unitCost ?? resourceFormData.unitCost ?? {},
              price: (originalResource?.price ??
                resourceFormData.price ??
                {}) as ResourceConfigurationPrice,
            };
          });

      return {
        serviceId: serviceInfo.serviceId,
        budgetLevel: serviceInfo.budgetLevel as BudgetLevel,
        monthlyBudget: serviceBudget,
        resourceConfigurations,
      };
    }),
  };
};

export type TServiceEfficiencyClient = Pick<
  ServiceEfficiencyClient,
  | 'serviceEfficiencyApiGetBillingActivitiesByUser'
  | 'serviceEfficiencyApiGetBillingActivitiesByGroup'
  | 'serviceEfficiencyApiGetBillByUser'
  | 'serviceEfficiencyApiGetBillByGroup'
  | 'serviceEfficiencyApiGetConsumerConfigurationsByUniverse'
  | 'serviceEfficiencyApiUpdateConsumerConfigurationsByUniverse'
  | 'serviceEfficiencyApiCreatePaymentProfileForUser'
  | 'serviceEfficiencyApiListPaymentProfilesByUser'
  | 'serviceEfficiencyApiGetServiceEfficiencyPaymentMethodForUser'
  | 'serviceEfficiencyApiGetServiceEfficiencyPaymentMethodForGroup'
  | 'serviceEfficiencyApiSetServiceEfficiencyPaymentMethodForUser'
  | 'serviceEfficiencyApiSetServiceEfficiencyPaymentMethodForGroup'
  | 'serviceEfficiencyApiDeletePaymentProfileForUser'
  | 'serviceEfficiencyApiGetAccountForUser'
  | 'serviceEfficiencyApiGetAccountForGroup'
  | 'serviceEfficiencyApiUpdateAccountForUser'
  | 'serviceEfficiencyApiUpdateAccountForGroup'
  | 'serviceEfficiencyApiSubmitManualPaymentForUser'
  | 'serviceEfficiencyApiSubmitManualPaymentForGroup'
  | 'serviceEfficiencyApiCheckEligibilityForUser'
  | 'serviceEfficiencyApiCheckEligibilityForGroup'
>;

const CloudPricingClientProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const getAccountActivity = useCallback(
    async (
      creatorType: CreatorType,
      id: number,
      userIdOverride?: number,
      groupIdOverride?: number,
      startTime?: string | null, // YYYY-MM
      endTime?: string | null, // YYYY-MM
    ): Promise<{ balanceInfo: BalanceInfo; activityInfo: ActivityRowInfo[] }> => {
      const [startYear, startMonth] = startTime?.split('-').map(Number) ?? [];
      const [endYear, endMonth] = endTime?.split('-').map(Number) ?? [];
      let res: BillingActivitiesResponse;

      if (creatorType === CreatorType.User && !groupIdOverride) {
        const userId = userIdOverride || id;
        res = await serviceEfficiencyClient.serviceEfficiencyApiGetBillingActivitiesByUser({
          userId,
          startYear,
          startMonth,
          endYear,
          endMonth,
        });
      } else {
        const groupId = groupIdOverride || id;
        res = await serviceEfficiencyClient.serviceEfficiencyApiGetBillingActivitiesByGroup({
          groupId,
          startYear,
          startMonth,
          endYear,
          endMonth,
        });
      }
      if (
        !res.accountState ||
        !res.chargingThreshold ||
        !res.billSummaries ||
        !res.currentBalance
      ) {
        throw new Error('getAccountActivity failed, not valid response');
      }
      const balanceInfo = {
        accountState: res.accountState,
        outstandingBalance: moneyToNumber(res.currentBalance),
        chargingThreshold: moneyToNumber(res.chargingThreshold),
        monthToDateBalance: moneyToNumber(res.monthToDateBalance),
      };
      const activityInfo = res.billSummaries.map((summary) => {
        if (!summary.timestamp || !summary.totalAmount) {
          throw new Error('getAccountActivity failed, bill summary in response not valid');
        }
        return {
          id: summary.billId,
          date: new Date(summary.timestamp),
          amount: moneyToNumber(summary.totalAmount),
          status: summary.billStatus,
        } as ActivityRowInfo;
      });
      return { balanceInfo, activityInfo };
    },
    [],
  );

  const getBillingInfo = useCallback(
    async (
      id: number,
      creatorType: CreatorType,
      billingDate?: Date,
      latest?: boolean,
      userIdOverride?: number,
      groupIdOverride?: number,
    ): Promise<BillDetails> => {
      let res: BillDetailsResponse;
      let date = {};
      if (billingDate) {
        date = {
          year: billingDate.getUTCFullYear(),
          month: billingDate.getUTCMonth() + 1,
          date: billingDate.getUTCDate(),
        };
      }

      if (creatorType === CreatorType.User && !groupIdOverride) {
        const userId = userIdOverride || id;
        res = await serviceEfficiencyClient.serviceEfficiencyApiGetBillByUser({
          userId,
          ...date,
          latest: latest ?? false,
        });
      } else {
        const groupId = groupIdOverride || id;
        res = await serviceEfficiencyClient.serviceEfficiencyApiGetBillByGroup({
          groupId,
          ...date,
          latest: latest ?? false,
        });
      }
      if (
        !res.accountState ||
        typeof res.usageAmount === 'undefined' ||
        !Array.isArray(res.usages)
      ) {
        throw new Error('getBillingInfo failed, not valid response');
      }
      return {
        accountState: res.accountState,
        usageAmount: res.usageAmount,
        usages: res.usages,
        billId: res.billId ?? null,
        billStatus: res.billStatus,
        taxAmount: res.taxAmount,
        totalAmount: res.totalAmount,
        billingAddress: res.billingAddress,
        robloxAddress: res.robloxAddress ?? '',
        taxId: res.taxId !== undefined ? res.taxId : null,
        taxIdType: res.taxIdType !== undefined ? res.taxIdType : null,
        payments: res.payments,
      };
    },
    [],
  );

  const getUnlockServiceSettings = useCallback(
    async (universeId: number): Promise<UnlockServiceConfigurations> => {
      try {
        const res =
          await serviceEfficiencyClient.serviceEfficiencyApiGetConsumerConfigurationsByUniverse({
            universeId,
          });
        if (!isValidServiceConfigurationsResponse(res)) {
          throw new Error('getUnlockServiceSetting failed, not valid response');
        }
        return res;
      } catch (e) {
        let message: string = DEFAULT_ERROR_KEY;
        const status = getErrorStatus(e);
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const updateUnlockServiceSettings = useCallback(
    async (
      universeId: number,
      data: TUnlockServiceForm,
      serviceIndexRef: TResourceIndexInfo[],
      originalServiceConfigurations?: ServiceConfiguration[],
    ): Promise<UnlockServiceConfigurations> => {
      try {
        const request = unlockServiceFormToRequest(
          data,
          serviceIndexRef,
          originalServiceConfigurations,
        ) as ConsumerConfigurationRequest;
        const res =
          await serviceEfficiencyClient.serviceEfficiencyApiUpdateConsumerConfigurationsByUniverse({
            universeId,
            serviceEfficiencyApiUpdateConsumerConfigurationsByUniverseRequest: request,
          });
        if (!isValidServiceConfigurationsResponse(res)) {
          throw new Error('updateUnlockServiceSettings failed, not valid response');
        }
        return res;
      } catch (e) {
        const error = getResponseFromError(e);
        throw error;
      }
    },
    [],
  );

  const buildUnlockServiceRequest = useCallback(
    (
      data: TUnlockServiceForm,
      serviceIndexRef: TResourceIndexInfo[],
      originalServiceConfigurations?: ServiceConfiguration[],
    ): ConsumerConfigurationRequest => {
      return unlockServiceFormToRequest(
        data,
        serviceIndexRef,
        originalServiceConfigurations,
      ) as ConsumerConfigurationRequest;
    },
    [],
  );

  const sendUnlockServiceUpdate = useCallback(
    async (
      universeId: number,
      request: ConsumerConfigurationRequest,
    ): Promise<UnlockServiceConfigurations> => {
      try {
        const res =
          await serviceEfficiencyClient.serviceEfficiencyApiUpdateConsumerConfigurationsByUniverse({
            universeId,
            serviceEfficiencyApiUpdateConsumerConfigurationsByUniverseRequest: request,
          });
        if (!isValidServiceConfigurationsResponse(res)) {
          throw new Error('sendUnlockServiceUpdate failed, not valid response');
        }
        return res;
      } catch (e) {
        const error = getResponseFromError(e);
        throw error;
      }
    },
    [],
  );

  const createUserPaymentProfile = useCallback(
    async (userId: number): Promise<{ clientSecret: string }> => {
      let clientSecret: string;
      try {
        const res = await serviceEfficiencyClient.serviceEfficiencyApiCreatePaymentProfileForUser({
          userId,
        });
        if (res && res.clientSecret) {
          clientSecret = res.clientSecret;
        } else {
          throw new Error('createUserPaymentProfile failed, not valid response');
        }

        return { clientSecret };
      } catch (e) {
        let message: string = DEFAULT_ERROR_KEY;
        const status = getErrorStatus(e);
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const listPaymentProfiles = useCallback(
    async (
      userId: number,
      userIdOverride?: number,
    ): Promise<{ paymentProfiles: PaymentProfile[] | null }> => {
      let res: ListPaymentProfilesResponse;

      try {
        const id = userIdOverride || userId;
        res = await serviceEfficiencyClient.serviceEfficiencyApiListPaymentProfilesByUser({
          userId: id,
        });

        if (!res.paymentProfiles || res.paymentProfiles.length === 0) {
          return { paymentProfiles: null };
        }

        const paymentProfiles = res.paymentProfiles.map((paymentProfile) => {
          return {
            cardNetwork: paymentProfile.cardNetwork,
            expMonth: paymentProfile.expMonth,
            expYear: paymentProfile.expYear,
            last4Digits: paymentProfile.last4Digits,
            paymentProfileId: paymentProfile.paymentProfileId,
            paymentProfileOwnerType: paymentProfile.paymentProfileOwnerType,
          } as PaymentProfile;
        });
        return { paymentProfiles };
      } catch (e) {
        const statusCode = getResponseFromError(e)?.status;
        // We catch 404s because they only return if we disable "EnablePayments" in the backend
        // In these situations we don't want the page to fail to load, so we will return the same
        // Response as catching an empty array of paymentProfiles.
        if (statusCode === 404) {
          return { paymentProfiles: null };
        }
        const status = getErrorStatus(e);
        let message: string = DEFAULT_ERROR_KEY;
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const getPaymentProfiles = useCallback(
    async (
      creatorType: CreatorType,
      id: number,
      userIdOverride?: number,
      groupIdOverride?: number,
    ): Promise<PaymentProfile | null> => {
      let res: GetServiceEfficiencyPaymentMethodResponse;
      try {
        if (creatorType === CreatorType.User && !groupIdOverride) {
          const userId = userIdOverride || id;
          res =
            await serviceEfficiencyClient.serviceEfficiencyApiGetServiceEfficiencyPaymentMethodForUser(
              {
                userId,
              },
            );
        } else {
          const groupId = groupIdOverride || id;
          res =
            await serviceEfficiencyClient.serviceEfficiencyApiGetServiceEfficiencyPaymentMethodForGroup(
              {
                groupId,
              },
            );
        }

        if (!res.paymentProfile) {
          return null;
        }

        return {
          paymentProfileId: res.paymentProfile.paymentProfileId,
          paymentProfileOwnerType: res.paymentProfile.paymentProfileOwnerType,
          cardNetwork: res.paymentProfile.cardNetwork,
          last4Digits: res.paymentProfile.last4Digits,
          expMonth: res.paymentProfile.expMonth,
          expYear: res.paymentProfile.expYear,
        } as PaymentProfile;
      } catch (e) {
        const statusCode = getResponseFromError(e)?.status;
        // We watch 404s because they only return if we disable "EnablePayments" in the backend
        // In this situation we will return the same response as a null paymentProfile so the page
        // doesn't fail to load.
        if (statusCode === 404) {
          return null;
        }

        const status = getErrorStatus(e);
        let message: string = DEFAULT_ERROR_KEY;
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const setPaymentProfiles = useCallback(
    async (
      creatorType: CreatorType,
      id: number,
      paymentProfileId: string,
      paymentProfileOwnerType: string,
    ): Promise<null> => {
      try {
        if (creatorType === CreatorType.User) {
          await serviceEfficiencyClient.serviceEfficiencyApiSetServiceEfficiencyPaymentMethodForUser(
            {
              userId: id,
              paymentProfileId,
              paymentProfileOwnerType,
            },
          );
        } else {
          await serviceEfficiencyClient.serviceEfficiencyApiSetServiceEfficiencyPaymentMethodForGroup(
            {
              groupId: id,
              paymentProfileId,
              paymentProfileOwnerType,
            },
          );
        }

        return null;
      } catch (e) {
        const error = getResponseFromError(e);
        throw error;
      }
    },
    [],
  );

  const getAccountSettings = useCallback(
    async (
      id: number,
      creatorType: CreatorType,
      userIdOverride?: number,
      groupIdOverride?: number,
    ): Promise<Account | null> => {
      let res: GetAccountResponse;
      try {
        if (creatorType === CreatorType.User && !groupIdOverride) {
          const userId = userIdOverride || id;
          res = await serviceEfficiencyClient.serviceEfficiencyApiGetAccountForUser({
            userId,
          });
        } else {
          const groupId = groupIdOverride || id;
          res = await serviceEfficiencyClient.serviceEfficiencyApiGetAccountForGroup({
            groupId,
          });
        }

        // if account is null, return null so we know the user needs to populate these fields
        if (!res.account) {
          return null;
        }

        return {
          accountName: res.account.accountName,
          accountTaxType: res.account.accountTaxType,
          taxId: res.account.taxId,
          taxIdType: res.account.taxIdType,
        } as Account;
      } catch (e) {
        const message: string = DEFAULT_ERROR_KEY;
        const error = getResponseFromError(e);
        if (error?.status === 404) {
          return null;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const updateAccountSettings = useCallback(
    async (id: number, creatorType: CreatorType, account: Account): Promise<Account> => {
      let res: UpdateAccountResponse;
      const requestAccount = { account } as ServiceEfficiencyApiUpdateAccountForUserRequest;
      try {
        if (creatorType === CreatorType.User) {
          res = await serviceEfficiencyClient.serviceEfficiencyApiUpdateAccountForUser({
            userId: id,
            serviceEfficiencyApiUpdateAccountForUserRequest: requestAccount,
          });
        } else {
          res = await serviceEfficiencyClient.serviceEfficiencyApiUpdateAccountForGroup({
            groupId: id,
            serviceEfficiencyApiUpdateAccountForUserRequest: requestAccount,
          });
        }
        if (!res.account) {
          throw new Error('updateAccountSettings failed, not valid response');
        }

        return {
          accountName: res.account.accountName,
          accountTaxType: res.account.accountTaxType,
          taxId: res.account.taxId,
          taxIdType: res.account.taxIdType,
        } as Account;
      } catch (e) {
        const error = getResponseFromError(e);
        throw error;
      }
    },
    [],
  );

  const deletePaymentProfile = useCallback(
    async (userId: number, paymentProfileId: string): Promise<null> => {
      try {
        await serviceEfficiencyClient.serviceEfficiencyApiDeletePaymentProfileForUser({
          userId,
          paymentProfileId,
        });

        return null;
      } catch (e) {
        let message: string = DEFAULT_ERROR_KEY;
        const status = getErrorStatus(e);
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const submitManualPayment = useCallback(
    async (
      creatorType: CreatorType,
      creatorId: number,
      amount: Money,
      billId: string,
    ): Promise<null> => {
      try {
        if (creatorType === CreatorType.User) {
          await serviceEfficiencyClient.serviceEfficiencyApiSubmitManualPaymentForUser({
            userId: creatorId,
            serviceEfficiencyApiSubmitManualPaymentForUserRequest: { amount, billId },
          });
        } else {
          await serviceEfficiencyClient.serviceEfficiencyApiSubmitManualPaymentForGroup({
            groupId: creatorId,
            serviceEfficiencyApiSubmitManualPaymentForUserRequest: { amount, billId },
          });
        }

        return null;
      } catch (e) {
        let message: string = DEFAULT_ERROR_KEY;
        const status = getErrorStatus(e);
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const checkEligibility = useCallback(
    async (creatorType: CreatorType, id: number): Promise<EligibilityRequirementResult[]> => {
      try {
        let eligibilityResult;
        if (creatorType === CreatorType.User) {
          eligibilityResult =
            await serviceEfficiencyClient.serviceEfficiencyApiCheckEligibilityForUser({
              userId: id,
            });
        } else {
          eligibilityResult =
            await serviceEfficiencyClient.serviceEfficiencyApiCheckEligibilityForGroup({
              groupId: id,
            });
        }

        if (eligibilityResult && eligibilityResult.eligibilityRequirementResults) {
          return eligibilityResult.eligibilityRequirementResults;
        }

        return [];
      } catch (e) {
        let message: string = DEFAULT_ERROR_KEY;
        const status = getErrorStatus(e);
        if (typeof status !== 'undefined') {
          message = SEErrorStatusToMessageKey[status as StatusCodes] ?? DEFAULT_ERROR_KEY;
        }
        throw new Error(message);
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      getAccountActivity,
      getAccountSettings,
      getBillingInfo,
      getPaymentProfiles,
      getUnlockServiceSettings,
      listPaymentProfiles,
      setPaymentProfiles,
      updateUnlockServiceSettings,
      buildUnlockServiceRequest,
      sendUnlockServiceUpdate,
      createUserPaymentProfile,
      updateAccountSettings,
      deletePaymentProfile,
      submitManualPayment,
      checkEligibility,
    }),
    [
      getAccountActivity,
      getAccountSettings,
      getBillingInfo,
      getPaymentProfiles,
      getUnlockServiceSettings,
      listPaymentProfiles,
      setPaymentProfiles,
      updateUnlockServiceSettings,
      buildUnlockServiceRequest,
      sendUnlockServiceUpdate,
      createUserPaymentProfile,
      updateAccountSettings,
      deletePaymentProfile,
      submitManualPayment,
      checkEligibility,
    ],
  );

  return (
    <CloudPricingClientContext.Provider value={contextValue}>
      {children}
    </CloudPricingClientContext.Provider>
  );
};

export default CloudPricingClientProvider;
