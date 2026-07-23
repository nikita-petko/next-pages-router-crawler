import type {
  PaymentsBonusServiceCreateOrUpdateBonusOptInStatusOperationRequest,
  PaymentsBonusServiceGetBonusOptInInfoRequest,
} from '@rbx/client-payments-bonus-service/v1';
import {
  BonusOptInModerationStatus as ModerationStatus,
  PaymentsBonusServiceApi,
  ProductType,
  type GetBonusOptInInfoResponse,
} from '@rbx/client-payments-bonus-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

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

  constructor() {
    this.bonusItemApi = new PaymentsBonusServiceApi(
      createClientConfiguration('payments-bonus-service', 'bedev2'),
    );
  }

  getOptInStatus(
    request: PaymentsBonusServiceGetBonusOptInInfoRequest,
  ): Promise<GetBonusOptInInfoResponse> {
    // Skip PaymentsBonusService calls in Luobu environment
    if (process.env.buildTarget === 'luobu') {
      // Return a default response indicating the feature is not available
      // oxlint-disable-next-line no-unsafe-type-assertion -- object literal matches GetBonusOptInInfoResponse; dual value/type export pattern confuses TS
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
