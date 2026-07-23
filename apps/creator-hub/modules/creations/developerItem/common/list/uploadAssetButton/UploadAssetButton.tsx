import React, { FunctionComponent } from 'react';
import { Button, OpenInNewIcon } from '@rbx/ui';
import { creationsMenuManager } from '@modules/creations/menu';
import { Asset, urls } from '@modules/miscellaneous/common';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { useTranslation } from '@rbx/intl';
import AssetCreationEntryway from '@modules/asset-creation/components/AssetCreationEntryway';
import { isCreateAssetAvailable } from '@modules/asset-creation/constants/AssetTypeConstants';

const {
  creatorHub: { dashboard },
} = urls;
export type TUploadAssetButtonProps = {
  assetType: Asset.TShirt | Asset.Shirt | Asset.Pants | Asset.Decal | Asset.Audio | Asset.Video;
  hasIcon?: boolean;
};

const UploadAssetButton: FunctionComponent<React.PropsWithChildren<TUploadAssetButtonProps>> = (
  props,
) => {
  const { assetType, hasIcon = true } = props;
  const { translate } = useTranslation();

  const { organization, permissions } = useCurrentOrganization();

  // If the developer item is owned by a group and the user does not have permission to create assets, return null
  if (organization?.groupId && !permissions?.canCreateAssets) {
    return null;
  }

  const assetUploadLink = dashboard.getUploadUrl(assetType);
  return isCreateAssetAvailable(assetType) ? (
    <AssetCreationEntryway assetType={assetType} containerHasData={() => true} />
  ) : (
    <Button
      color='primaryBrand'
      component='a'
      data-testid='upload-button-slug'
      endIcon={hasIcon && <OpenInNewIcon />}
      href={assetUploadLink}
      target='__blank'
      variant='contained'
      size='large'>
      {translate('Action.UploadDevelopmentItems', {
        itemType: translate(creationsMenuManager.getAssetFullNameKey(assetType)),
      })}
    </Button>
  );
};

export default UploadAssetButton;
