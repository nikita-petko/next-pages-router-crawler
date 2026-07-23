import type {
  AcceptanceInsertRequest,
  AgreementResolutionGetByContextRequest,
  PartialAcceptanceResponseArrayResult,
  AgreementResolutionResponse,
} from '@rbx/client-user-agreements-service/v1';
import {
  AcceptanceApi,
  AgreementResolutionApi,
  AgreementType,
  ClientType,
  RegulationType,
} from '@rbx/client-user-agreements-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { ClientType as UserAgreementClientType, AgreementType as UserAgreementType };

export type { AgreementResolutionResponse };
export type AgreementFetchRequest = AgreementResolutionGetByContextRequest;
export type AgreementUpdateRequest = AcceptanceInsertRequest;
export type AgreementUpdateResponse = PartialAcceptanceResponseArrayResult;

export type Agreement = {
  link: string;
  id: string;
};
export type LuobuUserAgreements = {
  Privacy: Agreement;
  TermOfService: Agreement;
};

export class UserAgreementsClient {
  private agreementResolutionApi: AgreementResolutionApi;

  private acceptanceApi: AcceptanceApi;

  constructor() {
    const baseConfiguration = createClientConfiguration('user-agreements', 'bedev2');
    this.agreementResolutionApi = new AgreementResolutionApi(baseConfiguration);
    this.acceptanceApi = new AcceptanceApi(baseConfiguration);
  }

  async acceptUserAgreements(agreementIds: string[]) {
    const request = {
      insertAcceptancesRequest: {
        acceptances: agreementIds.map((id) => ({ agreementId: id })),
      },
    };
    return this.acceptanceApi.acceptanceInsert(request);
  }

  async getLuobuUserAgreement(requestParameters: AgreementFetchRequest) {
    const response = await this.agreementResolutionApi.agreementResolutionGetByContext({
      clientType: requestParameters.clientType,
    });
    return response.filter((agreement) => agreement.regulationType !== RegulationType.Luobu);
  }

  getUserAgreements(params: AgreementResolutionGetByContextRequest) {
    return this.agreementResolutionApi.agreementResolutionGetByContext(params);
  }
}

const userAgreementsClient = new UserAgreementsClient();

export { userAgreementsClient };
