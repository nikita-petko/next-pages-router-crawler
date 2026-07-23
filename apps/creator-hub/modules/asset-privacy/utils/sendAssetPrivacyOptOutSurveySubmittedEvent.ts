import type { AssetPrivacyOptOutSurveyPayload } from '@modules/asset-privacy/types/assetPrivacyOptOutSurvey';
import type { TrackerClient } from '@modules/eventStream/tracker';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';

const REASON_SHARING_WITH_FRIENDS_IDS = [
  'userSharingWithFriendsTooMuchFriction',
  'groupSharingWithFriendsTooMuchFriction',
] as const;

const REASON_SHARING_WITH_GROUPS_IDS = [
  'userSharingWithGroupsTooMuchFriction',
  'groupSharingWithGroupsTooMuchFriction',
] as const;

/** Maps survey selections to AssetPrivacyOptOutSurveySubmitted proto fields (optional bools). */
export function buildAssetPrivacyOptOutSurveySubmittedParameters(
  payload: AssetPrivacyOptOutSurveyPayload,
  creatorType: 'user' | 'group',
): Record<string, string> {
  const selected = new Set(payload.reasonIds);
  const params: Record<string, string> = {
    ingest_timestamp_milliseconds: String(Date.now()),
    creator_type: creatorType,
  };

  if (REASON_SHARING_WITH_FRIENDS_IDS.some((id) => selected.has(id))) {
    params.reason_sharing_with_friends_too_much_friction = 'true';
  }
  if (REASON_SHARING_WITH_GROUPS_IDS.some((id) => selected.has(id))) {
    params.reason_sharing_with_groups_too_much_friction = 'true';
  }
  if (selected.has('offlineWorkflowsNotSupported')) {
    params.reason_offline_workflows_not_supported = 'true';
  }
  if (selected.has('tooManyPermissionErrorsOnInsert')) {
    params.reason_too_many_permission_errors_on_insert = 'true';
  }
  if (selected.has('wantUniversalAccessWithoutCreatorStore')) {
    params.reason_want_universal_access_without_creator_store = 'true';
  }

  const freeform = payload.additionalFeedback.trim();
  if (freeform.length > 0) {
    params.freeform_text = freeform;
  }

  return params;
}

function hasSurveySubmissionContent(payload: AssetPrivacyOptOutSurveyPayload): boolean {
  return payload.reasonIds.length > 0 || payload.additionalFeedback.trim().length > 0;
}

/** Sends AssetPrivacyOptOutSurveySubmitted via EventStream. UnifiedLogger double-write is skipped (see `tracker.ts`). */
export function sendAssetPrivacyOptOutSurveySubmittedEvent(options: {
  trackerClient: TrackerClient;
  creatorType: 'user' | 'group';
  payload: AssetPrivacyOptOutSurveyPayload;
}): void {
  if (!hasSurveySubmissionContent(options.payload)) {
    return;
  }

  const additionalProperties = buildAssetPrivacyOptOutSurveySubmittedParameters(
    options.payload,
    options.creatorType,
  );
  const eventPayload = {
    eventType: CreatorDashboardEventType.AssetPrivacyOptOutSurveySubmitted,
    context: CreatorDashboardContext.Click,
    additionalProperties,
  };
  // eslint-disable-next-line no-console -- debug: remove before shipping
  options.trackerClient.sendEvent(eventPayload);
}
