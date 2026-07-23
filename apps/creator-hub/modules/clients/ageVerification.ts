import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { VerifiedAgeApi, VerifiedAgeResponse } from '@rbx/clients/ageVerificationService/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type { VerifiedAgeResponse };

export class AgeVerificationClient {
  private ageVerificationApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('age-verification-service')) {
    this.ageVerificationApi = new VerifiedAgeApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  isUserAgeVerified(): Promise<VerifiedAgeResponse> {
    return this.ageVerificationApi.verifiedAgeGetVerifiedAge();
  }
}

const ageVerificationClient = new AgeVerificationClient();
export default ageVerificationClient;
