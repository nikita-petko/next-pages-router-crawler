import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, OpenInNewIcon } from '@rbx/ui';
import AssetCreationEntryway from '@modules/asset-creation/components/AssetCreationEntryway';
import { isCreateAssetAvailable } from '@modules/asset-creation/constants/AssetTypeConstants';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import type { Asset } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';
import creationsMenuManager from '../../../../menu/implementations/CreationsMenuManager';

const { dashboard } = creatorHub;
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
