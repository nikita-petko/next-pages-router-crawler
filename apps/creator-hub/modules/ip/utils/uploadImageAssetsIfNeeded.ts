import { AssetPrivacy } from '@rbx/client-assets-upload-api/v1';
import { uploadAsset } from '../rights/hooks/useUploadAsset';

/**
 * Since we delay the creation of image assets until the IP Listing submission, and we also
 * want to support edit flows, we need to represents image assets as either existing or new
 * so we know how to handle them.
 */
export type ImageAsset = { type: 'existing'; assetId: number } | { type: 'new'; file: File };

/**
 * Uploads private image assets if they are new.
 *
 * Uploads assets used as images across different license-manager surfaces. In the future it might be possible to
 * also specify an existing asset, in which case we would not upload it since only new images need to be uploaded.
 *
 */
const uploadImageAssetsIfNeeded = async ({
  imageAssets,
  userId,
  isOpenUse = false,
}: {
  imageAssets: ImageAsset[];
  userId: number;
  isOpenUse?: boolean;
}) => {
  const imageAssetIds = await Promise.all(
    imageAssets.map(async (image, index) => {
      if (image.type === 'new') {
        const asset = await uploadAsset({
          file: image.file,
          asset: {
            // TODO: [future] do we need to handle groups? (abech)
            creationContext: {
              creator: { userId },
              assetPrivacy: isOpenUse ? AssetPrivacy.OpenUse : AssetPrivacy.Restricted,
            },
            assetType: 'Image',
            displayName: `ip_asset_${index + 1}`,
          },
        });
        const assetIdRaw = asset.assetId;
        if (!assetIdRaw) {
          throw new Error('Missing asset ID');
        }
        // NOTE: assetId is typed incorrectly by the upload asset API. We're actually getting
        // a string instead of a number. Our API expects a number, so we need to parse it.
        return typeof assetIdRaw === 'number' ? assetIdRaw : parseInt(assetIdRaw, 10);
      }
      return image.assetId;
    }),
  );

  return { imageAssetIds };
};

export default uploadImageAssetsIfNeeded;
