import { CreatorDevexAPIApi } from '@rbx/client-creator-devex-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { O18Eligibility } from '@rbx/client-creator-devex-api/v1';
export type {
  GetUniverseO18EligibilityResponse,
  EligibilityCriteria,
} from '@rbx/client-creator-devex-api/v1';

const creatorDevexApiClient = new CreatorDevexAPIApi(
  createClientConfiguration('creator-devex', 'bedev2'),
);

export const getO18Eligibility = (universeId: number, options?: RequestInit) =>
  creatorDevexApiClient.v1UniverseUniverseIdO18EligibilityGet({ universeId }, options);
