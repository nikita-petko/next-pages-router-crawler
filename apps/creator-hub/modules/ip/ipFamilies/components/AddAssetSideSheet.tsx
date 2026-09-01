import { useState } from 'react';
import {
  Button,
  Chip,
  ProgressCircle,
  SearchInput,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/components';
import { SupportedRobloxAssetTypeEnum } from '../constants';
import { useSearchAssets, type UserAsset } from '../hooks/useUserAssets';
import AssetListItem from './AssetListItem';

interface AddAssetSideSheetProps {
  onClose: () => void;
  selectedAssets: UserAsset[];
  onConfirm: (selected: UserAsset[]) => void;
}

const supportedAssetTypes = [
  SupportedRobloxAssetTypeEnum.Decal,
  SupportedRobloxAssetTypeEnum.Mesh,
  SupportedRobloxAssetTypeEnum.MeshPart,
];

// AddAssetSideSheet is used to select Roblox assets for an IP Content.
const AddAssetSideSheet = ({ onClose, selectedAssets, onConfirm }: AddAssetSideSheetProps) => {
  const { translate } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<UserAsset[]>(selectedAssets);
  const [assetType, setAssetType] = useState<SupportedRobloxAssetTypeEnum>(
    SupportedRobloxAssetTypeEnum.Decal,
  );

  const { data: assets = [], isLoading, isError } = useSearchAssets(assetType, searchQuery);

  const chips = supportedAssetTypes.map((type) => (
    <Chip
      key={type}
      text={translate(`Label.${type}`)}
      isChecked={assetType === type}
      size='Medium'
      onCheckedChange={(isChecked) => isChecked && setAssetType(type)}
    />
  ));

  const onOpenChange = (open: boolean) => !open && onClose();
  const onSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);

  const onAssetToggle = (asset: UserAsset) => (isChecked: boolean) => {
    if (isChecked) {
      setSelected((prev) => [...prev, asset]);
    } else {
      setSelected((prev) => prev.filter((d) => d.assetId !== asset.assetId));
    }
  };

  const handleConfirmClick = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <SheetRoot open onOpenChange={onOpenChange}>
      <SheetContent
        largeScreenVariant='side'
        closeLabel={translate('Label.Close')}
        largeScreenClassName='![max-width:480px]'>
        <SheetTitle>{translate('Heading.AddAssets')}</SheetTitle>
        <div className='flex flex-col gap-medium padding-x-xlarge padding-bottom-medium'>
          <SearchInput
            aria-label={translate('Label.Search')}
            placeholder={translate('Label.Search')}
            value={searchQuery}
            onChange={onSearchQueryChange}
            size='Large'
            leadingIconName='icon-regular-magnifying-glass'
            inputContainerClassName='[&:focus-within]:![border-color:inherit] [&:focus-within]:![box-shadow:none]'
          />
          <div className='flex flex-row gap-xsmall'>{chips}</div>
        </div>
        <SheetBody>
          <div key={assetType} className='flex flex-col gap-medium'>
            {isLoading && (
              <div className='flex justify-center padding-top-large'>
                <ProgressCircle variant='Indeterminate' ariaLabel={translate('Label.Loading')} />
              </div>
            )}
            {isError && (
              <span className='text-body-medium content-system-alert padding-top-small'>
                {translate('Error.FailedToLoadAssets')}
              </span>
            )}
            {!isLoading && !isError && assets.length === 0 && (
              <EmptyStateBorder>
                <EmptyState
                  title={translate('Heading.NoResults')}
                  description={translate('Description.NoResults')}
                  size='small'
                  illustration='oof'
                />
              </EmptyStateBorder>
            )}
            {!isLoading &&
              !isError &&
              assets.map((asset) => (
                <AssetListItem
                  key={asset.assetId}
                  asset={asset}
                  variant='selecting'
                  isSelected={selected.some((d) => d.assetId === asset.assetId)}
                  onToggle={onAssetToggle(asset)}
                />
              ))}
          </div>
        </SheetBody>
        <SheetActions className='flex flex-row gap-small'>
          <div className='grow-1 basis-0'>
            <Button
              isDisabled={selected.length === 0}
              onClick={handleConfirmClick}
              className='width-full'>
              {translate('Action.SelectItems', {
                count: selected.length === 0 ? '' : String(selected.length),
              })}
            </Button>
          </div>
          <div className='grow-1 basis-0'>
            <Button variant='Standard' onClick={onClose} className='width-full'>
              {translate('Action.Cancel')}
            </Button>
          </div>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default AddAssetSideSheet;
