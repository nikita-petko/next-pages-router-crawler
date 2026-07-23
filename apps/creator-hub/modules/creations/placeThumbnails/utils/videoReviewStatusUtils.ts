import { ModerationState } from '@rbx/client-assets-upload-api/v1';

export const VideoContentQualityReviewStatus = {
  Pending: 'pending',
  Passed: 'passed',
  Failed: 'failed',
} as const;

export type VideoContentQualityReviewStatusValue =
  (typeof VideoContentQualityReviewStatus)[keyof typeof VideoContentQualityReviewStatus];

/**
 * Combines the moderation and content quality review statuses into a single display state.
 */
export const getVideoUploadDisplayModerationState = (
  moderationState: ModerationState,
  videoContentQualityReviewStatus?: VideoContentQualityReviewStatusValue,
): ModerationState => {
  if (moderationState !== ModerationState.Approved) {
    return moderationState;
  }

  if (videoContentQualityReviewStatus === VideoContentQualityReviewStatus.Failed) {
    return ModerationState.Rejected;
  }

  if (videoContentQualityReviewStatus === VideoContentQualityReviewStatus.Pending) {
    return ModerationState.Reviewing;
  }

  return ModerationState.Approved;
};
