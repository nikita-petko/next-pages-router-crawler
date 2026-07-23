import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { UniverseConfigsWebAPIApi } from '@rbx/clients/universeConfigsWebApi';
import { Configuration } from '@rbx/clients';
import { getBEDEV2ServiceBasePath } from '../utils';

const basePath = getBEDEV2ServiceBasePath('universe-configs-web-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const client = new UniverseConfigsWebAPIApi(configuration);
export { client };

// eslint-disable-next-line no-barrel-files/no-barrel-files -- backwards compat
export type { UniverseConfigsWebAPIApi };

// eslint-disable-next-line no-barrel-files/no-barrel-files -- backwards compat
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
} from '@rbx/clients/universeConfigsWebApi';
