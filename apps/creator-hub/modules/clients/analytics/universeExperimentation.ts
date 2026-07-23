import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { UniverseExperimentationAPIApi } from '@rbx/clients/universeConfigsWebApi';
import { Configuration } from '@rbx/clients';
import { getBEDEV2ServiceBasePath } from '../utils';

const basePath = getBEDEV2ServiceBasePath('universe-configs-web-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const client = new UniverseExperimentationAPIApi(configuration);
export { client };

export type { UniverseExperimentationAPIApi };

export type {
  // get experiment
  V1UniversesUniverseIdExperimentExperimentIdGetRequest,
  GetExperimentResponse,
  ProductExperiment,
  ExperimentProductType,
  SingleConfigExperimentConfiguration,
  MatchmakingExperimentConfiguration,
  ExperimentConfiguration,
  VariantMeta,
  // get audience
  V1UniversesUniverseIdAudiencesGetRequest,
  GetAudiencesResponse,
  Audience,
  ExperimentApiError,
  // complete experiment
  V1UniversesUniverseIdExperimentExperimentIdcompletePostRequest,
  CompleteExperimentResponse,
  // get experiment operation status
  V1UniversesUniverseIdOperationOperationIdGetRequest,
  GetExperimentOperationStatusResponse,
  ExperimentOperation,
  // create experiment
  V1UniversesUniverseIdExperimentPostRequest,
  CreateExperimentResponse,
  // update experiment
  V1UniversesUniverseIdExperimentExperimentIdPatchRequest,
  UpdateExperimentResponse,
  // start experiment
  V1UniversesUniverseIdExperimentExperimentIdstartPostRequest,
  StartExperimentResponse,
  // get experiments
  V1UniversesUniverseIdExperimentsGetRequest,
  ListExperimentsResponse,
  ExperimentSummary,
  // discard experiment
  V1UniversesUniverseIdExperimentExperimentIddiscardPostRequest,
  DiscardExperimentResponse,
  // rollout experiment
  V1UniversesUniverseIdExperimentExperimentIdrolloutPostRequest,
  RolloutVariantResponse,
  // MDE
  CalculateExperimentMdeResponse,
  // Latest experiment results
  GetLatestExperimentResultsResponse,
  GetExperimentStatsResponse,
} from '@rbx/clients/universeConfigsWebApi';
