import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Asset } from '@rbx/client-assets-upload-api/v1';
import { ModerationState } from '@rbx/client-assets-upload-api/v1';
import { RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum } from '@rbx/client-thumbnails/v1';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import contentLicensingClient from '@modules/clients/contentLicensing';
import {
  CreatorPitchAttachmentErrorType,
  CreatorPitchAttachmentStatus,
} from '@modules/licenses/utils/constants';
import type { CreatorPitchAttachment } from '@modules/licenses/utils/creatorPitchAttachmentTypes';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { usePitchImageThumbnailUrlsQuery } from '../../agreements/hooks/usePitchImageThumbnailUrlsQuery';
import { GET_CREATOR_PITCH_IMAGE_ATTACHMENTS_QUERY_KEY } from '../../queryKeys';

const PITCH_IMAGE_ASSET_READ_MASK = [FieldMask.MODERATION_RESULT, FieldMask.DISPLAY_NAME];

const mapModerationStateToAttachmentFields = (
  moderationState: ModerationState,
): Pick<CreatorPitchAttachment, 'status' | 'errorType'> => {
  switch (moderationState) {
    case ModerationState.Rejected:
      return {
        status: CreatorPitchAttachmentStatus.Error,
        errorType: CreatorPitchAttachmentErrorType.Moderated,
      };
    case ModerationState.Reviewing:
      return {
        status: CreatorPitchAttachmentStatus.PendingModeration,
      };
    case ModerationState.Approved:
    case ModerationState.Unspecified:
    default:
      return {
        status: CreatorPitchAttachmentStatus.Ready,
      };
  }
};

/**
 * The rights holder reads pitch images through contextual thumbnails, so the batch state is the
 * only moderation signal available. Only a terminal `Blocked` result is mapped off `Ready`:
 * `usePitchImageAttachmentsInspector` fetches full-size images for `Ready` assets via asset
 * delivery, which does not depend on thumbnail generation. Mapping a still-polling state such as
 * `InReview` to `PendingModeration` would drop the asset from that path, toast it as unavailable,
 * and — for `?inspect=<assetId>` — strip the deep link so it cannot recover when polling completes.
 */
const mapThumbnailStateToAttachmentFields = (
  state: RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum | undefined,
): Pick<CreatorPitchAttachment, 'status' | 'errorType'> => {
  switch (state) {
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Blocked:
      return {
        status: CreatorPitchAttachmentStatus.Error,
        errorType: CreatorPitchAttachmentErrorType.Moderated,
      };
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Completed:
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Error:
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.InReview:
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.Pending:
    case RobloxWebResponsesThumbnailsThumbnailBatchResponseStateEnum.TemporarilyUnavailable:
    case undefined:
    default:
      return {
        status: CreatorPitchAttachmentStatus.Ready,
      };
  }
};

export const mapAssetToCreatorPitchAttachment = (
  assetId: number,
  asset: Asset,
): CreatorPitchAttachment => {
  const { status, errorType } = mapModerationStateToAttachmentFields(
    asset.moderationResult?.moderationState ?? ModerationState.Unspecified,
  );
  const displayName = asset.displayName?.trim();

  return {
    id: String(assetId),
    fileName: isNonEmptyString(displayName) ? displayName : String(assetId),
    status,
    assetId,
    ...(errorType != null ? { errorType } : {}),
  };
};

interface UseGetCreatorPitchImageAttachmentsParams {
  agreementId: string;
  enabled?: boolean;
  isIpHolderView?: boolean;
}

type PitchImageQueryData =
  | {
      type: 'creator';
      attachments: CreatorPitchAttachment[];
    }
  | {
      type: 'ipHolder';
      assetIds: number[];
      accessContext?: string | null;
    };

export type CreatorPitchImageAttachmentsQueryData = {
  attachments: CreatorPitchAttachment[];
  accessContext?: string;
};

export const useGetCreatorPitchImageAttachments = ({
  agreementId,
  enabled = true,
  isIpHolderView = false,
}: UseGetCreatorPitchImageAttachmentsParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  const pitchImagesQuery = useQuery({
    queryKey: GET_CREATOR_PITCH_IMAGE_ATTACHMENTS_QUERY_KEY(accountId, agreementId, isIpHolderView),
    queryFn: async (): Promise<PitchImageQueryData> => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!agreementId) {
        throw new Error('Missing agreement ID');
      }

      if (isIpHolderView) {
        const { assetIds, accessContext } = await contentLicensingClient.getIphPitchImages(
          accountId,
          agreementId,
        );
        return {
          type: 'ipHolder',
          assetIds: assetIds ?? [],
          accessContext,
        };
      }

      const pitchImages = await contentLicensingClient.getCreatorPitchImages(
        accountId,
        agreementId,
      );
      const attachments = await Promise.all(
        (pitchImages.assetIds ?? []).map(async (assetId) => {
          const asset = await assetsUploadApiClient.getAsset(assetId, PITCH_IMAGE_ASSET_READ_MASK);
          return mapAssetToCreatorPitchAttachment(assetId, asset);
        }),
      );
      return {
        type: 'creator',
        attachments,
      };
    },
    enabled: enabled && !!accountId && !!agreementId,
  });

  const ipHolderData =
    pitchImagesQuery.data?.type === 'ipHolder' ? pitchImagesQuery.data : undefined;
  const accessContext =
    ipHolderData != null && isNonEmptyString(ipHolderData.accessContext)
      ? ipHolderData.accessContext
      : undefined;
  const thumbnailUrlsQuery = usePitchImageThumbnailUrlsQuery({
    assetIds: accessContext != null ? ipHolderData?.assetIds : undefined,
    accessContext,
  });
  const isThumbnailUrlsPending =
    accessContext != null &&
    (ipHolderData?.assetIds.length ?? 0) > 0 &&
    thumbnailUrlsQuery.isPending;

  const attachments = useMemo((): CreatorPitchAttachment[] | undefined => {
    if (isThumbnailUrlsPending) {
      return undefined;
    }
    if (pitchImagesQuery.data?.type === 'creator') {
      return pitchImagesQuery.data.attachments;
    }

    return pitchImagesQuery.data?.assetIds.map((assetId) => {
      const imageUrl = thumbnailUrlsQuery.data?.urls.get(assetId);
      const { status, errorType } = mapThumbnailStateToAttachmentFields(
        thumbnailUrlsQuery.data?.states.get(assetId),
      );
      return {
        id: String(assetId),
        fileName: String(assetId),
        status,
        assetId,
        ...(errorType != null ? { errorType } : {}),
        ...(imageUrl != null && { imageUrl }),
      };
    });
  }, [isThumbnailUrlsPending, pitchImagesQuery.data, thumbnailUrlsQuery.data]);

  const isPending = pitchImagesQuery.isPending || isThumbnailUrlsPending;
  const isError = pitchImagesQuery.isError;
  const data: CreatorPitchImageAttachmentsQueryData | undefined =
    attachments == null
      ? undefined
      : {
          attachments,
          ...(accessContext != null ? { accessContext } : {}),
        };

  return {
    data,
    isPending,
    isError,
    isSuccess: !isPending && !isError && attachments != null,
  };
};

export default useGetCreatorPitchImageAttachments;
