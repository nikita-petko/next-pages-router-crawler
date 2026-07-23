import { QueryClient } from '@tanstack/react-query';
import { cloneDeep } from 'lodash';
import moment from 'moment';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { emailClient } from '@clients/accountSettings';
import { EventName, logNativeErrorEvent } from '@clients/unifiedLogger';
import { AdFormatDisplayType } from '@constants/ad';
import {
  AdAccountPaymentFailureReasonEnum,
  AdAccountPaymentStatusEnum,
} from '@constants/advertiser';
import { AdAccountType, OrganizationType } from '@constants/app';
import { appDataDefaults } from '@constants/appStore';
import { ServerPaymentType } from '@constants/campaign';
import ErrorCodes from '@constants/errorCodes';
import { appMetadataDefaults } from '@constants/metadata';
import Routes from '@constants/routes';
import { adAccountPaymentStatus } from '@services/ads/adAccountFinanceService';
import {
  getCurrentUser,
  getUserBirthdate,
  getValidateDisplayName,
} from '@services/ads/adAccountService';
import { getAdvertiser } from '@services/ads/getAdvertiserService';
import { getCampaigns } from '@services/ads/getEntitiesService';
import { getAdsMetadata } from '@services/ads/getMetadataService';
import { getPaymentProfiles } from '@services/ads/paymentProfileService';
import { getAdCreditBalance } from '@services/ads/paymentService';
import { getRobuxBalance } from '@services/economy/robuxService';
import { AdFormatType, ServerGetAdRowResponse } from '@type/ad';
import { AdSetResponseType, ServerGetAdSetRowResponse } from '@type/adSet';
import {
  AdAccountPaymentStatusResponseType,
  AdAccountShape,
  AdAccountStatusInfoType,
  AdvertiserType,
  OrganizationInfoType,
  OrganizationResponseShape,
} from '@type/advertiser';
import {
  AppStoreActionType,
  AppStoreStateType,
  CurrentUserType,
  V1EmailGetResponse,
} from '@type/appStore';
import { ServerGetCampaignRowResponse } from '@type/campaign';
import { TableSummaryRowData } from '@type/classicTables';
import { getHttpStatusFromError } from '@type/errorResponse';
import { GenAiCreativesQuotaType, GetAdsMetadataResponseType } from '@type/metadata';
import {
  GetAdCreditBalanceResponseType,
  GetRobuxBalanceResponse,
  PaymentProfileType,
} from '@type/payment';
import { applyMetadataToAppData } from '@utils/applyMetadataToAppData';
import { UsdToMicroUsd } from '@utils/currency';
import { CaptureException } from '@utils/error';
import {
  applyMetadataBooleanOverrides,
  mergeMetadataDefaultsWithResponse,
} from '@utils/metadataOverrides';
import { GetEmptyRequestState, GetInitialRequestState } from '@utils/zustandUtils';

export interface AppStoreType extends AppStoreStateType, AppStoreActionType {}

const microUsdMultiplier = 1 * 1000 * 1000;

const organizationIsBusiness = (organizationInfo?: OrganizationInfoType): boolean => {
  if (!organizationInfo) {
    return false;
  }

  return organizationInfo.type === OrganizationType.ORGANIZATION_TYPE_BUSINESS;
};

const noValidPaymentMethodTooltip = 'Tooltip.ValidPaymentRequired';
const invalidBusinessNameTooltip = 'Tooltip.InvalidBusinessName';
const paymentFailureTooltip = 'Tooltip.UpdatePaymentMethod';

const DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED: string[] = [
  // ORDER MATTERS HERE
  'getAccountMetadata',
  'getAdvertiser',
  'getCurrentUser',
  'getUserBirthday',
  'getEmailVerified',
  'getAdCredit',
  'getAdAccountStatus',
];

const APP_PROVIDER_FETCH_STATE_NAMES: Record<string, string> = {
  getAccountMetadata: 'appMetadataState',
  getAdAccountStatus: 'adAccountStatusState',
  getAdCredit: 'adCreditState',
  getAdvertiser: 'advertiserState',
  getCurrentUser: 'currentUserState',
  getEmailVerified: 'verifiedEmailState',
  getHasNewFlowCampaign: 'hasNewFlowCampaign',
  getPaymentProfiles: 'getPaymentProfilesState',
  getUserBirthday: 'userBirthdayState',
  getUserHasValidDisplayName: 'userHasValidDisplayNameState',
};

const alwaysForceRefresh = ['getHasNewFlowCampaign'];

const URL_PATHS_WITH_CUSTOM_ESSENTIAL_DATA_FETCHES: Record<string, string[]> = {
  [Routes.ACCOUNT_OVERVIEW]: [
    'getAccountMetadata',
    'getAdvertiser',
    'getCurrentUser',
    'getUserBirthday',
    'getEmailVerified',
  ],
  [Routes.CLASSIC]: [...DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED],
  [Routes.HOME]: [...DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED],
  [Routes.LANDING]: [
    'getAccountMetadata',
    'getAdvertiser',
    'getCurrentUser',
    'getUserBirthday',
    'getEmailVerified',
  ],
  [Routes.MANAGE]: [
    ...DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED,
    // If this is required for a banner on every page - put in DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED
    'getUserHasValidDisplayName',
    'getPaymentProfiles',
    'getAdAccountStatus',
    'getHasNewFlowCampaign',
  ],
};

// Query keys for React Query
const QUERY_KEYS = {
  ADVERTISER: 'advertiser',
  VALIDATE_DISPLAY_NAME: 'validateDisplayName',
} as const;

const getAdvertiserQueryKey = (groupId?: number): [string] | [string, number] =>
  groupId ? [QUERY_KEYS.ADVERTISER, groupId] : [QUERY_KEYS.ADVERTISER];

const getEmptyGroupScopedAccountState = () => ({
  adAccountStatusState: GetEmptyRequestState<AdAccountStatusInfoType>(),
  adCreditState: GetEmptyRequestState<GetAdCreditBalanceResponseType>(),
  advertiserState: GetEmptyRequestState<AdvertiserType>(),
});

const getAdAccountStatusInfo = (
  adAccountPaymentStatusResponse: AdAccountPaymentStatusResponseType,
): AdAccountStatusInfoType => {
  const { reason, status } = adAccountPaymentStatusResponse;

  const profileNotVerified =
    status === AdAccountPaymentStatusEnum.FAILED &&
    reason === AdAccountPaymentFailureReasonEnum.PROFILE_NOT_VERIFIED;
  const hasFailedPayment = status === AdAccountPaymentStatusEnum.FAILED;
  const hasTransactionFailure =
    status === AdAccountPaymentStatusEnum.FAILED &&
    [
      AdAccountPaymentFailureReasonEnum.TRANSACTION_FAILURE,
      AdAccountPaymentFailureReasonEnum.TRANSACTION_FAILURE_AND_PROFILE_NOT_VERIFIED,
    ].includes(reason);
  const hasUnknownPaymentStatus =
    status === AdAccountPaymentStatusEnum.UNKNOWN &&
    reason === AdAccountPaymentFailureReasonEnum.PROFILE_NOT_VERIFIED;

  return {
    hasFailedPayment,
    hasTransactionFailure,
    hasUnknownPaymentStatus,
    profileNotVerified,
    reason,
    status,
  };
};

const getErrorCodeFromError = (error: unknown): string | undefined => {
  const code = (error as { response?: { data?: { error?: { code?: unknown } } } })?.response?.data
    ?.error?.code;
  return typeof code === 'string' ? code : undefined;
};

export const useAppStore = create<AppStoreType>()(
  immer((set, get) => ({
    adAccountIsExternalManaged: () => {
      const adAccountInfo = get().appData?.adAccountInfo;

      if (!adAccountInfo) {
        return false;
      }

      return adAccountInfo.type === AdAccountType.AD_ACCOUNT_TYPE_MANAGED;
    },
    adAccountIsInternalManaged: () => {
      const adAccountInfo = get().appData?.adAccountInfo;

      if (!adAccountInfo) {
        return false;
      }

      return adAccountInfo.type === AdAccountType.AD_ACCOUNT_TYPE_INTERNAL;
    },
    adAccountStatusState: GetEmptyRequestState<AdAccountStatusInfoType>(),
    adCreditState: GetEmptyRequestState<GetAdCreditBalanceResponseType>(),
    // Toggle is enabled IFF: The user is managed/internal OR
    // The user is over 13
    // The user has an ad account
    // The user has a verified email
    // The user does not have payment failures OR this is an ad credit nampaign
    adTogglingShouldBeEnabled: (paymentType: ServerPaymentType) => {
      const { adAccountId, hasVerifiedEmail, paymentFailure, userOver13 } = get().appData;

      if (
        (get().adAccountIsInternalManaged() || get().adAccountIsExternalManaged()) &&
        adAccountId
      ) {
        return { disabledTooltip: undefined, togglingEnabled: true };
      }

      const enableAdvertising = !!(
        userOver13 &&
        adAccountId &&
        (!paymentFailure || paymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT) &&
        hasVerifiedEmail
      );

      return {
        disabledTooltip:
          !paymentFailure || paymentType === ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT
            ? undefined
            : paymentFailureTooltip,
        togglingEnabled: enableAdvertising,
      };
    },
    advertiserState: GetEmptyRequestState<AdvertiserType>(),
    // Create is enabled IFF: The user is managed/internal and account has valid name OR
    // The user is over 18
    // The user has an ad account
    // The user has a verified email
    // The user has a verified payment on file and does not have payment failures OR has sufficient ad credit
    // The account has valid name (if business account)
    advertisingShouldBeEnabled: (forPaymentStatusToast?: boolean) => {
      const {
        accountHasValidName,
        adAccountId,
        adCreditActivated,
        adCreditBalance,
        campaignMinimumDailyBudgetUsd,
        hasVerifiedEmail,
        paymentFailure,
        // TODO: Work this in and replace the hasVerifiedPaymentProfiles logic after migration
        // profileNotVerified,
        paymentProfiles = [],
        userOver13,
      } = get().appData;

      const isAdAccountAutoCreateEnabled =
        get().appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false;
      if (isAdAccountAutoCreateEnabled && !adAccountId && userOver13) {
        return { advertisingShouldBeEnabled: true, disabledTooltip: undefined };
      }

      if (
        (get().adAccountIsExternalManaged() || get().adAccountIsInternalManaged()) &&
        adAccountId
      ) {
        const validName = !!accountHasValidName;
        return {
          advertisingShouldBeEnabled: validName,
          disabledTooltip: !validName ? invalidBusinessNameTooltip : undefined,
        };
      }

      if (!forPaymentStatusToast) {
        const advertisingShouldBeEnabled = !!(
          userOver13 &&
          adAccountId &&
          hasVerifiedEmail &&
          accountHasValidName
        );
        return {
          advertisingShouldBeEnabled,
          disabledTooltip: !accountHasValidName ? invalidBusinessNameTooltip : undefined,
        };
      }

      const hasVerifiedPaymentProfiles = paymentProfiles.some(
        (paymentProfile) => paymentProfile?.is_verified,
      );

      const profileNotVerifiedAndAllAdCreditCampaigns =
        get()?.appData?.adAccountStatus?.hasUnknownPaymentStatus;

      const sufficientAdCredit =
        adCreditBalance &&
        campaignMinimumDailyBudgetUsd &&
        adCreditBalance >= UsdToMicroUsd(campaignMinimumDailyBudgetUsd);

      let enableAdvertising = !!(
        userOver13 &&
        adAccountId &&
        // TODO: Work this in and replace the hasVerifiedPaymentProfiles logic after migration
        // !profileNotVerified &&
        ((hasVerifiedPaymentProfiles &&
          (!paymentFailure || profileNotVerifiedAndAllAdCreditCampaigns)) ||
          sufficientAdCredit) &&
        hasVerifiedEmail
      );

      enableAdvertising = !!(enableAdvertising && accountHasValidName);

      const adCreditTooltipCondition =
        !hasVerifiedPaymentProfiles && adCreditActivated && !sufficientAdCredit;
      const invalidPaymentMethodCondition = !hasVerifiedPaymentProfiles || paymentFailure;
      const invalidNameCondition = !accountHasValidName;
      let disabledTooltip: string | undefined;
      if (!enableAdvertising) {
        if (adCreditTooltipCondition) {
          disabledTooltip = 'Tooltip.MinimumAdCreditRequired';
        } else if (invalidPaymentMethodCondition) {
          disabledTooltip = noValidPaymentMethodTooltip;
        } else if (invalidNameCondition) {
          disabledTooltip = invalidBusinessNameTooltip;
        }
      }

      return { advertisingShouldBeEnabled: enableAdvertising, disabledTooltip };
    },
    appData: cloneDeep(appDataDefaults),
    applyLocalMetadataOverrides: () => {
      const baseMetadata = get().appMetadataBaseData ?? get().appMetadataState.data;
      if (!baseMetadata) {
        return;
      }

      const resolvedMetadata = applyMetadataBooleanOverrides(baseMetadata);

      set((draft) => {
        draft.appMetadataState.data = resolvedMetadata;
        draft.appData = applyMetadataToAppData(get().appData, resolvedMetadata);
      });
    },
    appMetadataState: GetInitialRequestState<GetAdsMetadataResponseType>(appMetadataDefaults),
    appStoreProviderQueryClient: new QueryClient(),
    currentUserState: GetEmptyRequestState<Awaited<ReturnType<typeof getCurrentUser>>>(),
    fetchEssentialAppInfo: async (
      config: { forceRefresh?: boolean; groupId?: number; urlPath?: string } = {},
    ) => {
      const getMapOfPromiseFunctions = (promiseFunctionNamesDict: string[]) => {
        const promiseMap = new Map();

        promiseFunctionNamesDict.forEach((key: string) => {
          // @ts-ignore - The promise map always has a string as a key but the value are misc promise functions
          promiseMap.set(key, get()[key]);
        });

        return promiseMap;
      };

      const { forceRefresh, groupId, urlPath } = config;

      const haveEntryForConfigUrlPath =
        urlPath && urlPath in URL_PATHS_WITH_CUSTOM_ESSENTIAL_DATA_FETCHES;

      const customFetches =
        haveEntryForConfigUrlPath && URL_PATHS_WITH_CUSTOM_ESSENTIAL_DATA_FETCHES[urlPath];

      const defaultFetchesPromiseMap = getMapOfPromiseFunctions(
        DEFAULT_ESSENTIAL_APP_DATA_FETCH_FUNCTION_NAMES_ORDERED,
      );

      const promiseMap = customFetches
        ? getMapOfPromiseFunctions(customFetches)
        : defaultFetchesPromiseMap;

      const values = await Promise.allSettled(
        // @ts-ignore - The promise map always has a string as a key but the value are misc promise functions
        Array.from(promiseMap.entries()).map(([promiseName, promiseFn]) => {
          if (
            promiseName in APP_PROVIDER_FETCH_STATE_NAMES &&
            !forceRefresh &&
            !alwaysForceRefresh.includes(promiseName)
          ) {
            if (promiseName === 'getAccountMetadata' && get().appMetadataBaseData) {
              return Promise.resolve(get().appMetadataBaseData);
            }

            const stateName = APP_PROVIDER_FETCH_STATE_NAMES[promiseName];
            // @ts-ignore - The promise map always has a string as a key but the value are misc promise results
            const state = get()[stateName];
            if (state.data) {
              return Promise.resolve(state.data);
            }
          }

          if (promiseName === 'getAdvertiser') {
            return promiseFn(forceRefresh, groupId);
          }
          if (promiseName === 'getAdAccountStatus') {
            return promiseFn(groupId);
          }
          if (promiseName === 'getAdCredit') {
            return promiseFn(groupId);
          }
          return promiseFn(forceRefresh);
        }),
      );

      const mapKeys = Array.from(promiseMap.keys());

      for (let i = 0; i < values.length; i += 1) {
        promiseMap.set(mapKeys[i], values[i]);
      }

      const results = Object.fromEntries(promiseMap);

      return results;
    },
    getAccountMetadata: async () => {
      const inFlight = get().metadataInFlight;
      if (inFlight) {
        return inFlight;
      }

      const metadataPromise: Promise<GetAdsMetadataResponseType> = (async () => {
        try {
          const metaDataResponse = await getAdsMetadata();
          set((draft) => {
            draft.appMetadataState.isError = false;
            draft.appMetadataState.isLoading = true;

            if (metaDataResponse) {
              const baseMetadata = mergeMetadataDefaultsWithResponse(metaDataResponse);
              const resolvedMetadata = applyMetadataBooleanOverrides(baseMetadata);

              draft.appMetadataBaseData = baseMetadata;
              draft.appMetadataState.data = resolvedMetadata;
              draft.appData = applyMetadataToAppData(get().appData, resolvedMetadata);
            } else {
              draft.appMetadataState.isError = true;
              draft.appMetadataState.isLoading = false;
              return;
            }

            draft.appMetadataState.isError = false;
            draft.appMetadataState.isLoading = false;
          });

          return metaDataResponse;
        } catch (_e) {
          set((draft) => {
            draft.appMetadataState.isError = true;
            draft.appMetadataState.isLoading = false;
          });

          throw new Error('Error fetching metadata');
        } finally {
          set((draft) => {
            draft.metadataInFlight = null;
          });
        }
      })();

      set((draft) => {
        draft.metadataInFlight = metadataPromise;
      });

      return metadataPromise;
    },
    getAdAccountStatus: async (groupId?: number) => {
      try {
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adAccountStatusState.isError = false;
            draft.groupScopedAccountStateByGroupId[groupId].adAccountStatusState.isLoading = true;
          } else {
            draft.adAccountStatusState.isError = false;
            draft.adAccountStatusState.isLoading = true;
          }
        });
        const adAccountPaymentStatusResponse = await adAccountPaymentStatus(groupId);
        const adAccountStatusInfo = getAdAccountStatusInfo(adAccountPaymentStatusResponse);
        if (!groupId) {
          get().setPaymentFailure(adAccountStatusInfo.hasFailedPayment);
        }

        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adAccountStatusState = {
              data: adAccountStatusInfo,
              isError: false,
              isLoading: false,
            };
          } else {
            draft.appData.adAccountStatus = adAccountStatusInfo;
            draft.adAccountStatusState.data = adAccountStatusInfo;
            draft.adAccountStatusState.isError = false;
            draft.adAccountStatusState.isLoading = false;
          }
        });

        return adAccountStatusInfo;
      } catch (e) {
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adAccountStatusState.isError = true;
            draft.groupScopedAccountStateByGroupId[groupId].adAccountStatusState.isLoading = false;
          } else {
            draft.adAccountStatusState.isError = true;
            draft.adAccountStatusState.isLoading = false;
          }
        });
        throw e;
      }
    },
    getAdCredit: async (groupId?: number) => {
      try {
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adCreditState.isLoading = true;
            draft.groupScopedAccountStateByGroupId[groupId].adCreditState.isError = false;
          } else {
            draft.adCreditState.isLoading = true;
            draft.adCreditState.isError = false;
          }
        });

        const adCreditResponse = await getAdCreditBalance(groupId);

        const { ad_credit_balance_in_micro, is_account_activated } = adCreditResponse;

        if (!groupId) {
          get().setAdCreditActivated(is_account_activated);

          if (ad_credit_balance_in_micro) {
            // TODO(dlouie): rename this usage in the codebase after migration to adCreditBalanceMicroUsd
            get().setAdCreditBalance(ad_credit_balance_in_micro);
          }
        }

        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adCreditState = {
              data: adCreditResponse,
              isError: false,
              isLoading: false,
            };
          } else {
            draft.adCreditState = { data: adCreditResponse, isError: false, isLoading: false };
          }
        });

        return adCreditResponse;
      } catch (e) {
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].adCreditState.isError = true;
            draft.groupScopedAccountStateByGroupId[groupId].adCreditState.isLoading = false;
          } else {
            draft.adCreditState.isError = true;
            draft.adCreditState.isLoading = false;
          }
        });
        throw e;
      }
    },
    getAdvertiser: async (forceRefresh?: boolean, groupId?: number) => {
      try {
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.isLoading = true;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.isError = false;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.errorCode = undefined;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.errorStatus = undefined;
          } else {
            draft.advertiserState.isLoading = true;
            draft.advertiserState.isError = false;
          }
        });

        const queryKey = getAdvertiserQueryKey(groupId);
        if (forceRefresh) {
          get().appStoreProviderQueryClient.invalidateQueries({
            queryKey,
          });
        }

        const advertiserResponse = await get().appStoreProviderQueryClient.fetchQuery({
          gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
          queryFn: () => getAdvertiser(groupId),
          queryKey,
          staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
        });

        // This is returned from api-gateway (not our normal errors)
        if (advertiserResponse.error) {
          if (
            advertiserResponse.error?.code === ErrorCodes.ORGANIZATION_NOT_FOUND ||
            advertiserResponse.error?.code === ErrorCodes.AD_ACCOUNT_NOT_FOUND
          ) {
            // No organization or ad account attached to this account
            set((draft) => {
              if (groupId) {
                draft.groupScopedAccountStateByGroupId[groupId] ??=
                  getEmptyGroupScopedAccountState();
                draft.groupScopedAccountStateByGroupId[groupId].advertiserState = {
                  data: advertiserResponse,
                  errorCode: advertiserResponse.error?.code,
                  errorStatus: undefined,
                  isError: true,
                  isLoading: false,
                };
              } else {
                draft.appData.organizationId = null;
                draft.appData.adAccountId = null;
              }

              // TODO: when this is app-wide, need to store in LocalStorage: Expire in 7 days - ADS-7185
              // SetLocalStorage(StorageKeys.ORGANIZATION_ID, null, 604800);
              // SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, null, 604800);
            });
          }
        } else if (advertiserResponse.errors?.length) {
          set((draft) => {
            if (groupId) {
              draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
              draft.groupScopedAccountStateByGroupId[groupId].advertiserState = {
                data: advertiserResponse,
                errorCode: undefined,
                errorStatus: undefined,
                isError: true,
                isLoading: false,
              };
            } else {
              draft.appData.organizationId = null;
              draft.appData.adAccountId = null;
            }
            // TODO: when this is app-wide, need to store in LocalStorage: Expire in 7 days - ADS-7185
            // SetLocalStorage(StorageKeys.ORGANIZATION_ID, null, 604800);
            // SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, null, 604800);
          });
        }

        if (groupId && (advertiserResponse.error || advertiserResponse.errors?.length)) {
          return advertiserResponse;
        }

        let newAdAccountPrepaidBalance = 0;
        if (advertiserResponse.ad_account_prepaid_balance) {
          newAdAccountPrepaidBalance =
            advertiserResponse.ad_account_prepaid_balance / microUsdMultiplier;
        }
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState = {
              data: advertiserResponse,
              errorCode: undefined,
              errorStatus: undefined,
              isError: false,
              isLoading: false,
            };
          } else if (get().appData) {
            draft.appData.organizationId = advertiserResponse?.organization?.id ?? null;
            draft.appData.organizationInfo = advertiserResponse?.organization ?? null;
            draft.appData.adAccountId = advertiserResponse?.ad_account?.id ?? null;
            draft.appData.adAccountInfo = advertiserResponse?.ad_account ?? null;
            draft.appData.isAdIntegrationRewardedPlacementsEnabled =
              advertiserResponse?.is_ad_integration_rewarded_placements_enabled ?? false;
            // Needs to happen after the metadata call to override this value correctly
            draft.appData.campaignLimit = advertiserResponse?.entity_limits?.campaign_limit;
            draft.appData.adSetLimit = advertiserResponse?.entity_limits?.ad_set_limit;
            draft.appData.adLimit = advertiserResponse?.entity_limits?.ad_limit;
            draft.appData.isCampaignLimitMax =
              advertiserResponse?.entity_limits?.is_campaign_limit_max;
            draft.appData.adAccountPrepaidBalance = newAdAccountPrepaidBalance;
            if (organizationIsBusiness(advertiserResponse?.organization)) {
              draft.appData.advertiserName = advertiserResponse.organization.business_name.name;
            } else {
              draft.appData.advertiserName = advertiserResponse.ad_account?.name || '';
            }
            draft.advertiserState = { data: advertiserResponse, isError: false, isLoading: false };
          }
        });
        return advertiserResponse;
      } catch (e) {
        const errorStatus = getHttpStatusFromError(e);
        const errorCode = getErrorCodeFromError(e);
        set((draft) => {
          if (groupId) {
            draft.groupScopedAccountStateByGroupId[groupId] ??= getEmptyGroupScopedAccountState();
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.isError = true;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.isLoading = false;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.errorCode = errorCode;
            draft.groupScopedAccountStateByGroupId[groupId].advertiserState.errorStatus =
              errorStatus;
          } else {
            draft.appData.organizationId = null;
            draft.appData.adAccountId = null;
            draft.advertiserState.isError = true;
            draft.advertiserState.isLoading = false;
          }
          // TODO: when this is app-wide, need to store in LocalStorage: Expire in 7 days - ADS-7185
          // Expire in 7 days
          // SetLocalStorage(StorageKeys.ORGANIZATION_ID, null, 604800);
          // Expire in 7 days
          // SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, null, 604800);
        });
        throw e;
      }
      // TODO: when this is app-wide, need to store in LocalStorage: Expire in 7 days - ADS-7185
      // } finally {
      //   // Expire in 7 days
      //   SetLocalStorage(StorageKeys.ORGANIZATION_ID, get().appData.organizationId || null, 604800);
      //   // Expire in 7 days
      //   SetLocalStorage(StorageKeys.AD_ACCOUNT_ID, get().appData.adAccountId || null, 604800);
      //   // For now this breaks things
      //   get().setOrganizationId(get().appData.organizationId);
      //   get().setAdAccountId(get().appData.adAccountId);
      // }
    },
    getCurrentUser: async () => {
      try {
        set((draft) => {
          draft.currentUserState.isError = false;
          draft.currentUserState.isLoading = true;
        });
        const currentUserResponse = await getCurrentUser();
        const { error } = currentUserResponse;
        if (error) {
          throw currentUserResponse;
        } else {
          set((draft) => {
            draft.appData.currentUser = currentUserResponse;
            draft.currentUserState = {
              data: currentUserResponse,
              isError: false,
              isLoading: false,
            };
          });
          return currentUserResponse;
        }
      } catch (e) {
        set((draft) => {
          draft.currentUserState.isError = true;
          draft.currentUserState.isLoading = false;
        });
        throw e;
      }
    },
    getEmailVerified: async () => {
      try {
        set((draft) => {
          draft.verifiedEmailState.isError = false;
          draft.verifiedEmailState.isLoading = true;
        });
        const verifiedEmailResponse = (await emailClient.v1EmailGet()) as V1EmailGetResponse;
        const { verified } = verifiedEmailResponse;

        set((draft) => {
          draft.appData.hasVerifiedEmail = verified;
          draft.verifiedEmailState = {
            data: verifiedEmailResponse,
            isError: false,
            isLoading: false,
          };
        });

        return verifiedEmailResponse;
      } catch (e) {
        set((draft) => {
          draft.appData.hasVerifiedEmail = null;
          draft.verifiedEmailState.isError = true;
          draft.verifiedEmailState.isLoading = false;
        });
        throw e;
      }
    },
    getHasNewFlowCampaign: async () => {
      set((draft) => {
        draft.hasNewFlowCampaign.isLoading = true;
      });
      try {
        const campaignResponse = await getCampaigns({ pageSize: 1 });
        const hasCampaign = !!(campaignResponse.campaigns && campaignResponse.campaigns.length > 0);
        set((draft) => {
          draft.hasNewFlowCampaign = { data: hasCampaign, isError: false, isLoading: false };
        });
        return hasCampaign;
      } catch (error) {
        set((draft) => {
          draft.hasNewFlowCampaign = { data: true, isError: true, isLoading: false };
        });
        logNativeErrorEvent({
          error,
          eventName: EventName.DateFilteringError,
        });
      }
      return true;
    },
    getMetaDataState: GetEmptyRequestState<AdAccountPaymentStatusResponseType>(),
    getPaymentProfiles: async (isAuthorizeOnly: boolean = true) => {
      try {
        set((draft) => {
          draft.getPaymentProfilesState.isError = false;
          draft.getPaymentProfilesState.isLoading = true;
        });
        const getPaymentProfilesResponse = await getPaymentProfiles(isAuthorizeOnly);
        const { data } = getPaymentProfilesResponse;

        if (data.length) {
          get().setPaymentProfiles(data);
        }
        set((draft) => {
          draft.getPaymentProfilesState = {
            data: getPaymentProfilesResponse,
            isError: false,
            isLoading: false,
          };
        });

        return getPaymentProfilesResponse;
      } catch (e) {
        set((draft) => {
          draft.getPaymentProfilesState.isError = true;
          draft.getPaymentProfilesState.isLoading = false;
        });
        throw e;
      }
    },
    getPaymentProfilesState: GetEmptyRequestState<Awaited<ReturnType<typeof getPaymentProfiles>>>(),
    getRobuxBalance: async () => {
      try {
        set((draft) => {
          draft.robuxBalanceState.isLoading = true;
          draft.robuxBalanceState.isError = false;
        });

        const robuxResponse = await getRobuxBalance();

        set((draft) => {
          draft.robuxBalanceState = { data: robuxResponse, isError: false, isLoading: false };
        });

        return robuxResponse;
      } catch (e) {
        set((draft) => {
          draft.robuxBalanceState.isError = true;
          draft.robuxBalanceState.isLoading = false;
        });
        throw e;
      }
    },
    getUserBirthday: async () => {
      try {
        set((draft) => {
          draft.userBirthdayState.isError = false;
          draft.userBirthdayState.isLoading = true;
        });

        const userBirthdayResponse = await getUserBirthdate();

        const { birthDay, birthMonth, birthYear } = userBirthdayResponse;
        if (!birthMonth || !birthDay || !birthYear) {
          set((draft) => {
            draft.userBirthdayState.isError = false;
            draft.userBirthdayState.isLoading = true;
          });
        } else {
          const eighteenthBirthday = moment(`${birthMonth}/${birthDay}/${birthYear}`).add(
            18,
            'years',
          );
          const userOver18 = eighteenthBirthday <= moment(Date.now());
          const thirteenthBirthday = moment(`${birthMonth}/${birthDay}/${birthYear}`).add(
            13,
            'years',
          );

          const userOver13 = thirteenthBirthday <= moment(Date.now());

          set((draft) => {
            draft.appData.userOver18 = userOver18;
            draft.appData.userOver13 = userOver13;
          });
        }

        set((draft) => {
          draft.userBirthdayState = {
            data: userBirthdayResponse,
            isError: false,
            isLoading: false,
          };
        });

        return userBirthdayResponse;
      } catch (e) {
        set((draft) => {
          draft.appData.userOver18 = null;
          draft.appData.userOver13 = null;
          draft.userBirthdayState.isError = true;
          draft.userBirthdayState.isLoading = false;
        });
        throw e;
      }
    },
    getUserHasValidDisplayName: async (nameToValidate?: string) => {
      try {
        set((draft) => {
          draft.userHasValidDisplayNameState.isError = false;
          draft.userHasValidDisplayNameState.isLoading = true;
        });

        await get().getAdvertiser();

        if (get().organizationIsBusiness()) {
          const validDisplayNameResponse = await getValidateDisplayName(
            nameToValidate || get().appData?.organizationInfo?.business_name?.name || '',
          );

          const isValid = validDisplayNameResponse?.is_valid || false;

          get().setAccountHasValidName(isValid);

          set((draft) => {
            draft.userHasValidDisplayNameState = {
              data: validDisplayNameResponse,
              isError: false,
              isLoading: false,
            };
          });
        } else {
          get().setAccountHasValidName(true);
          set((draft) => {
            draft.userHasValidDisplayNameState = {
              data: { is_valid: true },
              isError: false,
              isLoading: false,
            };
          });
        }
      } catch (e) {
        set((draft) => {
          draft.userHasValidDisplayNameState.isError = true;
          draft.userHasValidDisplayNameState.isLoading = false;
        });
        throw e;
      }

      return get().userHasValidDisplayNameState.data;
    },
    groupScopedAccountStateByGroupId: {},
    hasNewFlowCampaign: GetInitialRequestState<boolean>(true), // assume account has new flow campaign to avoid re-showing onboarding
    markGenAiCreativeQuotaExhausted: () => {
      set((draft) => {
        const quota = draft.appMetadataState.data?.genAiCreativesQuota;
        if (quota == null) {
          return;
        }
        quota.used = quota.limit;
        quota.remaining = 0;
      });
    },
    metadataInFlight: null,
    organizationIsBusiness: () => {
      const organizationInfo = get().appData?.organizationInfo;
      return organizationIsBusiness(organizationInfo);
    },
    paymentProfiles: [],
    recordGenAiCreativeGenerated: () => {
      set((draft) => {
        const quota = draft.appMetadataState.data?.genAiCreativesQuota;
        if (quota == null) {
          return;
        }
        quota.used += 1;
        quota.remaining = Math.max(0, quota.remaining - 1);
      });
    },
    refreshAdCreditAndRobuxBalances: async () => {
      try {
        await get().getAdCredit();
        await get().getRobuxBalance();
      } catch (e) {
        CaptureException(e as Error);
      }
    },
    refreshPaymentStatusToastStates: async () => {
      try {
        const checkPaymentDeclined = (await get().getAdAccountStatus()).hasFailedPayment;
        const paymentProfiles = await get().getPaymentProfiles(false);
        let checkUnverifiedCardStatus = false;
        if (paymentProfiles && paymentProfiles.data && paymentProfiles.data.length > 0) {
          checkUnverifiedCardStatus = !paymentProfiles.data[0].is_verified;
        }
        return checkPaymentDeclined || checkUnverifiedCardStatus;
      } catch (error) {
        CaptureException(error as Error);
        return false;
      }
    },
    robuxBalanceState: GetEmptyRequestState<GetRobuxBalanceResponse>(),
    setAccountHasValidName: (newAccountHasValidName: boolean) => {
      set((draft) => {
        draft.appData.accountHasValidName = newAccountHasValidName;
      });
    },

    setAdAccountId: (adAccountId?: string | null) => {
      set((draft) => {
        draft.appData.adAccountId = adAccountId;
      });
    },

    setAdAccountInfo: (adAccountInfo: AdAccountShape) => {
      set((draft) => {
        draft.appData.adAccountInfo = adAccountInfo;
        draft.appData.isDefaultBillingTier = adAccountInfo?.ad_billing_tier === 5;
      });
    },

    setAdAccountPrepaidBalance: (newAdAccountPrepaidBalanceUSD: number) => {
      set((draft) => {
        draft.appData.adAccountPrepaidBalance = newAdAccountPrepaidBalanceUSD;
      });
    },

    setAdCreditActivated: (adCreditActivated: boolean) => {
      set((draft) => {
        draft.appData.adCreditActivated = adCreditActivated;
      });
    },

    setAdCreditBalance: (newAdCreditBalance: number) => {
      set((draft) => {
        draft.appData.adCreditBalance = newAdCreditBalance;
      });
    },

    setAdFormats: (newAdFormats: AdFormatDisplayType[]) => {
      set((draft) => {
        draft.appData.adFormats = newAdFormats;
      });
    },

    setAds: (newAds: ServerGetAdRowResponse[]) => {
      set((draft) => {
        draft.appData.ads = newAds;
      });
    },

    setAdSets: (newAdSets: ServerGetAdSetRowResponse[]) => {
      set((draft) => {
        draft.appData.adSets = newAdSets;
      });
    },

    setAdSetsSummaryInfo: (newAdSetsSummaryInfo: TableSummaryRowData) => {
      set((draft) => {
        draft.appData.adSetsSummaryInfo = newAdSetsSummaryInfo;
      });
    },

    setAdsSummaryInfo: (newAdsSummaryInfo: TableSummaryRowData) => {
      set((draft) => {
        draft.appData.adsSummaryInfo = newAdsSummaryInfo;
      });
    },

    setCampaigns: (newCampaigns: ServerGetCampaignRowResponse[]) => {
      set((draft) => {
        draft.appData.campaigns = newCampaigns;
      });
    },

    setCampaignsSummaryInfo: (newCampaignsSummaryInfo: TableSummaryRowData) => {
      set((draft) => {
        draft.appData.campaignsSummaryInfo = newCampaignsSummaryInfo;
      });
    },

    setCurrentUser: (newCurrentUser: CurrentUserType) => {
      set((draft) => {
        draft.appData.currentUser = newCurrentUser;
      });
    },

    setFilteredAds: (newFilteredAds: AdFormatType[]) => {
      set((draft) => {
        draft.appData.filteredAds = newFilteredAds;
      });
    },

    setFilteredAdSets: (newFilteredAdSets: AdSetResponseType[]) => {
      set((draft) => {
        draft.appData.filteredAdSets = newFilteredAdSets;
      });
    },

    setGenAiCreativesQuota: (quota: GenAiCreativesQuotaType) => {
      set((draft) => {
        if (draft.appMetadataState.data == null) {
          return;
        }
        draft.appMetadataState.data.genAiCreativesQuota = quota;
      });
    },
    setHasVerifiedEmail: (emailIsVerified: boolean) => {
      set((draft) => {
        draft.appData.hasVerifiedEmail = emailIsVerified;
      });
    },
    setIsAdAccountBlocked: (isAdAccountBlocked: boolean) => {
      set((draft) => {
        draft.appData.isAdAccountBlocked = isAdAccountBlocked;
      });
    },

    setOrganizationId: (organizationId?: string | null) => {
      set((draft) => {
        draft.appData.organizationId = organizationId;
      });
    },
    setOrganizationInfo: (organizationInfo: Partial<OrganizationResponseShape>) => {
      set((draft) => {
        draft.appData.organizationInfo = organizationInfo;
      });
    },

    // TODO: Transition this to appData.adAccountStatus.hasFailedPayment when ripping out old context
    setPaymentFailure: (newPaymentFailure: boolean) => {
      set((draft) => {
        draft.appData.paymentFailure = newPaymentFailure;
      });
    },
    setPaymentProfiles: (newPaymentProfiles: PaymentProfileType[]) => {
      set((draft) => {
        draft.appData.paymentProfiles = newPaymentProfiles;
      });
    },

    setProfileNotVerified: (profileNotVerified: boolean) => {
      set((draft) => {
        draft.appData.profileNotVerified = profileNotVerified;
      });
    },

    setSelectedAds: (newSelectedAds: ServerGetAdRowResponse[]) => {
      set((draft) => {
        draft.appData.selectedAds = newSelectedAds;
      });
    },

    setSelectedAdSets: (newSelectedAdSets: string[]) => {
      set((draft) => {
        draft.appData.selectedAdSets = newSelectedAdSets;
      });
    },

    setSelectedAdSetsLoading: (newSelectedAdSetsLoading: boolean) => {
      set((draft) => {
        draft.appData.selectedAdSetsLoading = newSelectedAdSetsLoading;
      });
    },

    setSelectedAdsLoading: (newSelectedAdsLoading: boolean) => {
      set((draft) => {
        draft.appData.selectedAdsLoading = newSelectedAdsLoading;
      });
    },

    setSelectedCampaigns: (newSelectedCampaigns: string[]) => {
      set((draft) => {
        draft.appData.selectedCampaigns = newSelectedCampaigns;
      });
    },

    setSelectedCampaignsLoading: (newSelectedCampaignsLoading: boolean) => {
      set((draft) => {
        draft.appData.selectedCampaignsLoading = newSelectedCampaignsLoading;
      });
    },
    shouldUseWorkspaceUniverseFiltering: () => {
      const isAdAccountAutoCreateEnabled =
        get().appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false;

      return (
        isAdAccountAutoCreateEnabled &&
        !get().adAccountIsInternalManaged() &&
        !get().adAccountIsExternalManaged()
      );
    },
    userBirthdayState: GetEmptyRequestState<Awaited<ReturnType<typeof getUserBirthdate>>>(),
    userHasValidDisplayNameState:
      GetEmptyRequestState<Awaited<ReturnType<typeof getValidateDisplayName>>>(),
    verifiedEmailState: GetEmptyRequestState<Awaited<V1EmailGetResponse>>(),
  })),
);
