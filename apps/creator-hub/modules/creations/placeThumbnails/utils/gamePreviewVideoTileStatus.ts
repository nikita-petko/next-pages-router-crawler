import { ModerationState } from '@rbx/client-assets-upload-api/v1';
import {
  getVideoUploadDisplayModerationState,
  type VideoContentQualityReviewStatusValue,
} from './videoReviewStatusUtils';

export const GamePreviewVideoTileStatus = {
  Loading: 'loading',
  Empty: 'empty',
  Approved: 'approved',
  Reviewing: 'reviewing',
  Rejected: 'rejected',
  Unavailable: 'unavailable',
  Error: 'error',
} as const;

export type GamePreviewVideoTileStatusValue =
  (typeof GamePreviewVideoTileStatus)[keyof typeof GamePreviewVideoTileStatus];

type GamePreviewVideoTileQueryState = {
  isEnabled: boolean;
  isPending: boolean;
  isError: boolean;
  videoPreviewId: number | null | undefined;
  moderationState: ModerationState | undefined;
  videoContentQualityReviewStatus: VideoContentQualityReviewStatusValue | undefined;
  isVideoContentQualityReviewStatusError: boolean;
};

export const getGamePreviewVideoTileStatus = ({
  isEnabled,
  isPending,
  isError,
  videoPreviewId,
  moderationState,
  videoContentQualityReviewStatus,
  isVideoContentQualityReviewStatusError,
}: GamePreviewVideoTileQueryState): GamePreviewVideoTileStatusValue => {
  if (!isEnabled || isPending) {
    return GamePreviewVideoTileStatus.Loading;
  }

  if (isError) {
    return GamePreviewVideoTileStatus.Error;
  }

  if (videoPreviewId == null) {
    return GamePreviewVideoTileStatus.Empty;
  }

  if (isVideoContentQualityReviewStatusError) {
    return GamePreviewVideoTileStatus.Unavailable;
  }

  const displayModerationState = getVideoUploadDisplayModerationState(
    moderationState ?? ModerationState.Unspecified,
    videoContentQualityReviewStatus,
  );

  if (displayModerationState === ModerationState.Rejected) {
    return GamePreviewVideoTileStatus.Rejected;
  }

  if (displayModerationState === ModerationState.Approved) {
    return GamePreviewVideoTileStatus.Approved;
  }

  return GamePreviewVideoTileStatus.Reviewing;
};
