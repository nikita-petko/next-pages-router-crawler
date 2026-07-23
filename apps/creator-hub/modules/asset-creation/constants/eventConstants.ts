import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';

const assetCreationAttemptEventModel = (
  assetType: string,
  fileSize: number,
  creatorId: number | undefined,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.AssetCreationAttempt,
  context: CreatorDashboardContext.Click,
  additionalProperties: {
    AssetType: assetType,
    FileSize: `${fileSize}`,
    CreatorId: `${creatorId}`,
  },
});

const assetCreationFailureEventModel = (
  assetType: string,
  creatorId: number | undefined,
  message: string,
): TrackerClientRequest => ({
  eventType: CreatorDashboardEventType.AssetCreationFailure,
  context: CreatorDashboardContext.Load,
  additionalProperties: {
    AssetType: assetType,
    CreatorId: `${creatorId}`,
    Message: message,
  },
});

export { assetCreationAttemptEventModel, assetCreationFailureEventModel };
