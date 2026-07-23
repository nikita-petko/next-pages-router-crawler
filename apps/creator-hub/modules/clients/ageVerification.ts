import type { VerifiedAgeResponse } from '@rbx/client-age-verification-service/v1';
import { VerifiedAgeApi } from '@rbx/client-age-verification-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { VerifiedAgeResponse };

export class AgeVerificationClient {
  private ageVerificationApi;

  constructor() {
    this.ageVerificationApi = new VerifiedAgeApi(
      createClientConfiguration('age-verification-service', 'bedev2'),
    );
  }

  isUserAgeVerified(): Promise<VerifiedAgeResponse> {
    return this.ageVerificationApi.verifiedAgeGetVerifiedAge();
  }
}

const ageVerificationClient = new AgeVerificationClient();
export default ageVerificationClient;
