import { UniverseExperimentationAPIApi } from '@rbx/client-universe-configs-web-api/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const configuration = createClientConfiguration('universe-configs-web-api', 'bedev2');

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
  // MDE
  CalculateExperimentMdeResponse,
  // Latest experiment results
  GetLatestExperimentResultsResponse,
  GetExperimentStatsResponse,
  // Targeting
  TargetingCriteria,
  RpnRule,
  RpnToken,
  RpnOperand,
  Operator,
  LiteralValue,
  // Rollout
  V1UniversesUniverseIdExperimentExperimentIdRolloutpreviewPostRequest,
  V1UniversesUniverseIdExperimentExperimentIdRolloutapplyPostRequest,
  PreviewRolloutData,
  PreviewRolloutResponse,
  ApplyRolloutData,
  ApplyRolloutResponse,
  RolloutApplyOverrides,
  RolloutConflict,
  RolloutConflictKind,
  ConfigEntryStaged,
  ConfigEntryOverride,
  ConfigEntry,
  ConfigType,
  ConfigTypeConditionalValueData,
  ConfigTypeRuleData,
  ConfigTypeRuleOrderingData,
} from '@rbx/client-universe-configs-web-api/v1';
