import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  BonusOptInModerationStatus as ModerationStatus,
  PaymentsBonusServiceApi,
  PaymentsBonusServiceCreateOrUpdateBonusOptInStatusOperationRequest,
  PaymentsBonusServiceGetBonusOptInInfoRequest,
  ProductType,
  type GetBonusOptInInfoResponse,
} from '@rbx/clients/paymentsBonusService/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export const GamePassProductType = ProductType.NUMBER_6;

export enum BonusOptInModerationStatus {
  Unspecified = ModerationStatus.NUMBER_0,
  PendingReview = ModerationStatus.NUMBER_1,
  Approved = ModerationStatus.NUMBER_2,
  Rejected = ModerationStatus.NUMBER_3,
}

export type { GetBonusOptInInfoResponse, PaymentsBonusServiceGetBonusOptInInfoRequest };

export class BonusItemClient {
  private bonusItemApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('payments-bonus-service')) {
    this.bonusItemApi = new PaymentsBonusServiceApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  getOptInStatus(
    request: PaymentsBonusServiceGetBonusOptInInfoRequest,
  ): Promise<GetBonusOptInInfoResponse> {
    // Skip PaymentsBonusService calls in Luobu environment
    if (process.env.buildTarget === 'luobu') {
      // Return a default response indicating the feature is not available
      return Promise.resolve({
        isBonusOptedIn: false,
        moderationStatus: BonusOptInModerationStatus.Unspecified,
        isEligible: false,
        isBonusOptInVisible: false,
      } as GetBonusOptInInfoResponse);
    }

    return this.bonusItemApi.paymentsBonusServiceGetBonusOptInInfo(request);
  }

  updateOptInStatus(
    request: PaymentsBonusServiceCreateOrUpdateBonusOptInStatusOperationRequest,
  ): Promise<object> {
    // Skip PaymentsBonusService calls in Luobu environment
    if (process.env.buildTarget === 'luobu') {
      // Return a resolved promise indicating the operation was skipped
      return Promise.resolve({});
    }

    return this.bonusItemApi.paymentsBonusServiceCreateOrUpdateBonusOptInStatus(request);
  }
}

const bonusItemClient = new BonusItemClient();
export default bonusItemClient;
