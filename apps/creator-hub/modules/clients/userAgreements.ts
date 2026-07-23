import {
  AcceptanceApi,
  AcceptanceInsertRequest,
  AgreementResolutionApi,
  AgreementResolutionGetByContextRequest,
  AgreementType,
  ClientType,
  PartialAcceptanceResponseArrayResult,
  RegulationType,
  AgreementResolutionResponse,
} from '@rbx/clients/userAgreementsService/v1';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from './utils';

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

  constructor(basePathUserAgreements = getBEDEV2ServiceBasePath('user-agreements')) {
    const baseConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathUserAgreements,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
      // User-agreement Service is using Specified UserAgent to verify Luobu requests like below
      // `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0  RobloxApp/2 (CJVDist; TencentAppStore)`
      // Its implemented in robloxdev.cn proxy owned by Luobu, since many browser is not support to send request with
      // customized User-agent
    });
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
