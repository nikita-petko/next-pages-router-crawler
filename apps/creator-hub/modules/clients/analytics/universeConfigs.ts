import { UniverseConfigsWebAPIApi } from '@rbx/client-universe-configs-web-api/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const configuration = createClientConfiguration('universe-configs-web-api', 'bedev2');

const client = new UniverseConfigsWebAPIApi(configuration);
export { client };

export type { UniverseConfigsWebAPIApi };

export type {
  V1ChangelogUniversesUniverseIdGetRequest,
  V1ConfigurationsUniversesUniverseIdLatestGetRequest,
  V1DraftUniversesUniverseIdCancelPostRequest,
  V1DraftUniversesUniverseIdDeleteRequest,
  V1DraftUniversesUniverseIdForcePostRequest,
  V1DraftUniversesUniverseIdGetRequest,
  V1DraftUniversesUniverseIdPostRequest,
  V1DraftUniversesUniverseIdPublishPostRequest,
  V1DraftUniversesUniverseIdPutRequest,
  V2DraftUniversesUniverseIdPostRequest,
  V2DraftUniversesUniverseIdDeleteRequest,
  V2DraftUniversesUniverseIdPutRequest,
  V2DraftUniversesUniverseIdConditionPutRequest,
  V2DraftUniversesUniverseIdRuleOrderingPutRequest,
  V1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest,
  PublishingMetadata,
  ConfigChangeResultData,
  CustomError,
  UpdateConfigurationResponse,
  GetStagedChangesResponse,
  ConfigEntryOverride,
  ConfigEntry,
  ConfigEntryInfo,
  PublishStagedChangesResponse,
  ConfigEntryChange,
  CreateConfigurationData,
  UpdateConfigurationData,
  CreateConfigurationResponse,
  GetConfigurationHistoryResponse,
  ConfigChangeResult,
  ForcePublishingResponse,
  CancelPublishingResponse,
  GetLatestConfigurationResponse,
  DiscardStagedChangesResponse,
  ConfigEntryStaged,
  Status,
  ChangelogEntry,
  PublishData,
  UpdateConditionData,
  UpdateConditionResponse,
  UpdateRuleOrderingResponse,
  ErrorType,
  EntryTypeFilter,
  SortOrder,
  SortKey,
} from '@rbx/client-universe-configs-web-api/v1';
