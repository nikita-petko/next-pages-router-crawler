import { CreatorConfigsPublicApiHttpError } from '@modules/clients/creatorConfigsPublicApi';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { convertBackendErrorToTranslationKey } from './utils/convertBackendErrorToTranslationKey';

export const LEADERBOARD_PAGE_LOADED_EVENT = 'leaderboard_config_page_loaded';
export const LEADERBOARD_CREATE_RESULT_EVENT = 'leaderboard_config_create_result';
export const LEADERBOARD_EDIT_RESULT_EVENT = 'leaderboard_config_edit_result';
export const LEADERBOARD_DELETE_RESULT_EVENT = 'leaderboard_config_delete_result';

const LEADERBOARD_TELEMETRY_TAG = 'leaderboards';

type LeaderboardFailureReason = 'permission_denied' | 'validation_failed' | 'backend_error';

const HTTP_FORBIDDEN = 403;

const stringifyUniverseId = (universeId: string | number | undefined): string =>
  universeId != null ? String(universeId) : '';

export function classifyLeaderboardFailure(error: unknown): LeaderboardFailureReason {
  if (error instanceof CreatorConfigsPublicApiHttpError && error.status === HTTP_FORBIDDEN) {
    return 'permission_denied';
  }
  if (error instanceof CreatorConfigsPublicApiHttpError) {
    const parsed = convertBackendErrorToTranslationKey(error);
    if (Object.keys(parsed.fieldErrors).length > 0) {
      return 'validation_failed';
    }
  }
  return 'backend_error';
}

export function logLeaderboardPageLoaded(args: {
  universeId: string | number | undefined;
  isEditable: boolean;
  count: number;
}) {
  unifiedLoggerClient.logImpressionEvent({
    eventName: LEADERBOARD_PAGE_LOADED_EVENT,
    parameters: {
      universe_id: stringifyUniverseId(args.universeId),
      is_editable: String(args.isEditable),
      count: String(args.count),
    },
    tags: [LEADERBOARD_TELEMETRY_TAG],
  });
}

type MutationResultArgs = {
  universeId: string | number | undefined;
  success: boolean;
  failureReason?: LeaderboardFailureReason;
};

function logMutationResult(eventName: string, args: MutationResultArgs) {
  const parameters: Record<string, string> = {
    universe_id: stringifyUniverseId(args.universeId),
    success: String(args.success),
  };
  if (args.failureReason !== undefined) {
    parameters.failure_reason = args.failureReason;
  }
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters,
    tags: [LEADERBOARD_TELEMETRY_TAG],
  });
}

export function logLeaderboardCreateResult(args: MutationResultArgs) {
  logMutationResult(LEADERBOARD_CREATE_RESULT_EVENT, args);
}

export function logLeaderboardEditResult(args: MutationResultArgs) {
  logMutationResult(LEADERBOARD_EDIT_RESULT_EVENT, args);
}

export function logLeaderboardDeleteResult(args: MutationResultArgs) {
  logMutationResult(LEADERBOARD_DELETE_RESULT_EVENT, args);
}
