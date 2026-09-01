import { Checkbox, IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { creatorHub } from '@modules/miscellaneous/urls';
import type { UserAsset } from '../hooks/useUserAssets';

const THUMBNAIL_SIZE = 60;

type AssetListItemProps =
  | {
      // Item is being picked from the search list
      variant: 'selecting';
      asset: UserAsset;
      isSelected: boolean;
      onToggle: (isChecked: boolean) => void;
    }
  | {
      // Item has already been selected and is shown in the IP Content creation form
      variant: 'selected';
      asset: UserAsset;
      onRemove: () => void;
    };

// AssetListItem is used to display a single asset in the "Add Roblox Asset" side sheet or the Create IP Content container.
const AssetListItem = (props: AssetListItemProps) => {
  const { asset, variant } = props;
  const { translate } = useTranslation();
  const assetUrl = creatorHub.dashboard.getConfigureCreatorStoreItemUrl(asset.assetId);

  return (
    <div className='flex flex-row items-center gap-medium padding-y-small'>
      <a
        href={assetUrl}
        target='_blank'
        rel='noreferrer'
        className='shrink-0 radius-small clip'
        style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}>
        <Thumbnail2d
          targetId={asset.assetId}
          type={ThumbnailTypes.assetThumbnail}
          alt={asset.name}
          returnPolicy={ReturnPolicy.PlaceHolder}
          containerClass='block'
          // eslint-disable-next-line no-underscore-dangle -- external enum
          size={AssetThumbnailSize._150x150}
        />
      </a>
      <span className='grow min-width-0 text-truncate-end'>
        <a
          href={assetUrl}
          target='_blank'
          rel='noreferrer'
          className='text-title-medium content-emphasis no-underline hover:underline'>
          {asset.name}
        </a>
      </span>
      {variant === 'selecting' ? (
        <div className='shrink-0'>
          <Checkbox
            size='Medium'
            placement='End'
            aria-label={asset.name}
            isChecked={props.isSelected}
            onCheckedChange={(isChecked) => props.onToggle(isChecked === true)}
          />
        </div>
      ) : (
        <div className='shrink-0'>
          <IconButton
            variant='Utility'
            size='Medium'
            icon='icon-regular-trash-can'
            ariaLabel={translate('Action.Delete')}
            onClick={props.onRemove}
          />
        </div>
      )}
    </div>
  );
};

export default AssetListItem;
