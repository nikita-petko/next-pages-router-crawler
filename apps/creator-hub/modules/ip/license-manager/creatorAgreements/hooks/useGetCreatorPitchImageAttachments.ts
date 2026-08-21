import { useQuery } from '@tanstack/react-query';
import type { Asset } from '@rbx/client-assets-upload-api/v1';
import { ModerationState } from '@rbx/client-assets-upload-api/v1';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import contentLicensingClient from '@modules/clients/contentLicensing';
import {
  CreatorPitchAttachmentErrorType,
  CreatorPitchAttachmentStatus,
} from '@modules/licenses/utils/constants';
import type { CreatorPitchAttachment } from '@modules/licenses/utils/creatorPitchAttachmentTypes';
import { isNonEmptyString } from '@modules/miscellaneous/utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
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
}

export const useGetCreatorPitchImageAttachments = ({
  agreementId,
  enabled = true,
}: UseGetCreatorPitchImageAttachmentsParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_CREATOR_PITCH_IMAGE_ATTACHMENTS_QUERY_KEY(accountId, agreementId),
    queryFn: async (): Promise<CreatorPitchAttachment[]> => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      const pitchImages = await contentLicensingClient.getCreatorPitchImages(
        accountId,
        agreementId,
      );
      const assetIds = pitchImages.assetIds ?? [];

      return Promise.all(
        assetIds.map(async (assetId) => {
          const asset = await assetsUploadApiClient.getAsset(assetId, PITCH_IMAGE_ASSET_READ_MASK);
          return mapAssetToCreatorPitchAttachment(assetId, asset);
        }),
      );
    },
    enabled: enabled && !!accountId && !!agreementId,
  });
};

export default useGetCreatorPitchImageAttachments;
