import React, { useCallback } from 'react';
import {
  TextField,
  FormControlLabel,
  Typography,
  Grid,
  Chip,
  Tooltip,
  InfoOutlinedIcon,
  makeStyles,
} from '@rbx/ui';
import {
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
  Asset,
  assetTypeToItemType,
} from '@modules/miscellaneous/common';
import { ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiCollectiblesMetadataResponse,
  RobloxItemConfigurationApiGetItemResponse,
} from '@rbx/client-itemconfiguration/v1';
import { Toggle } from '@rbx/foundation-ui';
import ScheduleReleaseToggle from '../../itemConfiguration/components/ScheduleReleaseToggle';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import { useItemConfigureFormStyles } from '../helper/StyleHooks';
import { getTaxonomyDisplayName } from '../helper/UnifiedFeeSystemHelper';
import { mapAssetTypeToString, mapBundleTypeToString } from '../helper/UnifiedFeeSystemConstants';
import MarketplaceVisibilityBanner from './MarketplaceVisibilityBanner';

interface ItemDetailsProps {
  cannotBeSold: boolean;
  isBundle: boolean;
  isCollectible: boolean;
  isOnSale: boolean;
  setIsOnSale: (isOnSale: boolean) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  targetId: number;
  itemDetails?: RobloxItemConfigurationApiGetItemResponse;
  setStartDate: (date: Date | null) => void;
  startDate: Date | null;
  setEndDate: (date: Date | null) => void;
  endDate: Date | null;
  collectiblesMetadata: RobloxItemConfigurationApiCollectiblesMetadataResponse | undefined;
  scheduledSaleChanged: boolean;
  setScheduledSaleChanged: (scheduledSaleChanged: boolean) => void;
  isBodySuit: boolean;
  isHd?: boolean;
}

const useStyles = makeStyles()(() => ({
  iecInfoIcon: {
    marginLeft: 5,
  },
}));

const getImageSrc = (itemType: string) => {
  if ([Asset.TShirt, Asset.Pants, Asset.Shirt].includes(itemType as Asset)) {
    // re-use TShirtAccessory, ShirtAccessory, PantsAccessory icons for 2D asset types.
    return `${process.env.assetPathPrefix}/unifiedFeeSystem/${itemType?.toLowerCase()}accessory.svg`;
  }
  return `${process.env.assetPathPrefix}/unifiedFeeSystem/${itemType?.toLowerCase()}.svg`;
};

function ItemDetails(props: ItemDetailsProps) {
  const {
    classes: { itemCardImg, moderatedCardImg },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  const {
    cannotBeSold,
    isBundle,
    isCollectible,
    isOnSale,
    setIsOnSale,
    name,
    setName,
    description,
    setDescription,
    targetId,
    itemDetails,
    setStartDate,
    startDate,
    setEndDate,
    endDate,
    collectiblesMetadata,
    scheduledSaleChanged,
    setScheduledSaleChanged,
    isBodySuit,
    isHd,
  } = props;
  const { settings } = useSettings();

  const assetType = mapAssetTypeToString(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
      RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
  ) as Asset;
  const bundleType = mapBundleTypeToString(
    itemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType ??
      RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_0,
  );
  const itemType = isBundle ? bundleType : assetType;
  const itemTypeThumbnail = isBundle
    ? assetTypeToItemType[Asset.Hat]
    : assetTypeToItemType[assetType];
  const isGroup = itemDetails && itemDetails?.item?.creator?.group !== undefined;
  const {
    classes: { iecInfoIcon },
  } = useStyles();

  const onSaleToggle = useCallback(() => {
    if (cannotBeSold) {
      return (
        <Grid item XSmall={2}>
          <Grid container>
            <Typography variant='body2' color='secondary'>
              {translate('Label.CannotBeSold')}
            </Typography>
            <InfoOutlinedIcon classes={{ root: iecInfoIcon }} />
          </Grid>
        </Grid>
      );
    }
    if (!collectiblesMetadata?.isScheduledPublishingEnabled) {
      return (
        <Grid item XSmall={2}>
          <FormControlLabel
            control={
              <Toggle
                label=''
                placement='Start'
                size='Medium'
                aria-label={translate('Label.OnSale')}
                isChecked={isOnSale}
                onCheckedChange={() => setIsOnSale(!isOnSale)}
              />
            }
            label={translate('Label.OnSale')}
          />
        </Grid>
      );
    }

    return (
      <Grid item XSmall={8} Medium={2} marginTop='8px'>
        <ScheduleReleaseToggle
          isOnSale={isOnSale}
          setIsOnSale={setIsOnSale}
          scheduledSaleChanged={scheduledSaleChanged}
          setScheduledSaleChanged={setScheduledSaleChanged}
          collectiblesMetadata={collectiblesMetadata}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          startDate={startDate}
          endDate={endDate}
          isCollectible={isCollectible}
        />
      </Grid>
    );
  }, [
    cannotBeSold,
    collectiblesMetadata,
    endDate,
    iecInfoIcon,
    isCollectible,
    isOnSale,
    scheduledSaleChanged,
    setEndDate,
    setIsOnSale,
    setScheduledSaleChanged,
    setStartDate,
    startDate,
    translate,
  ]);

  const isTaxonomyChanged =
    itemDetails?.item?.taxonomyDetails?.dpfTaxonomyIsDefaultTaxonomy === false;
  const taxonomyDisplayName = getTaxonomyDisplayName(
    itemDetails?.item?.taxonomyDetails?.dpfTaxonomyName ?? '',
    translate,
  );

  const showMarketplaceVisibilityBanner =
    settings.enableReducedMarketplaceVisibilityBanner &&
    itemDetails?.item?.discoverabilityDetails?.isDiscoverabilityReduced;

  return (
    <div>
      {showMarketplaceVisibilityBanner && (
        <Grid marginBottom={2}>
          <MarketplaceVisibilityBanner />
        </Grid>
      )}
      <Grid
        container
        alignItems='center'
        marginBottom={!collectiblesMetadata?.isScheduledPublishingEnabled ? 2 : 4}>
        <Grid item XSmall={8} Medium={3.5}>
          <Typography variant='h1' style={{ fontSize: '40px', fontWeight: '550' }}>
            {translate('Label.ManageItem')}
          </Typography>
        </Grid>
        <Grid item XSmall={6.5} sx={{ display: { xs: 'none', md: 'block' } }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title={translate('Label.ItemTypeDescription')} placement='top'>
              <Chip
                icon={<img src={getImageSrc(itemType)} alt='icon' style={{ padding: '5px' }} />}
                variant='outlined'
                color='secondary'
                label={translate(`Label.${itemType}`)}
              />
            </Tooltip>
            {isBodySuit && !settings.enableTaxonomyInConfigurePage && (
              <Chip
                variant='outlined'
                color='secondary'
                label={translate('Label.ItemType.BodysuitAccessory')}
              />
            )}
            {isTaxonomyChanged && settings.enableTaxonomyInConfigurePage && taxonomyDisplayName && (
              <Chip variant='outlined' color='secondary' label={taxonomyDisplayName} />
            )}
            {settings.isHdEnabled && isHd && (
              <Tooltip title={translate('Label.HDDescription')} placement='top'>
                <Chip variant='outlined' color='secondary' label={translate('Label.HD')} />
              </Tooltip>
            )}
          </div>
        </Grid>
        {onSaleToggle()}
      </Grid>
      <Grid container spacing={2}>
        <Grid item Large={4} XLarge={3.5}>
          <div style={{ maxWidth: '248px', maxHeight: '248px', marginTop: '15px' }}>
            <ItemThumbnail
              containerClass={itemCardImg}
              moderatedContainerClass={moderatedCardImg}
              type={
                isBundle
                  ? ThumbnailTypes.bundleThumbnail
                  : itemTypeToThumbnailType[itemTypeThumbnail]
              }
              targetId={targetId}
              bundleModerationStatus={itemDetails?.item?.moderationStatus}
              returnPolicy={
                isGroup ? ReturnPolicy.PlaceHolder : itemTypeToReturnPolicyType[itemTypeThumbnail]
              }
              alt={itemDetails?.item?.name ?? ''}
              isPendingNewTarget={false}
            />
          </div>
        </Grid>
        <Grid item Large={7} XLarge={8}>
          <TextField
            id='name'
            label={translate('Label.ItemName')}
            fullWidth
            margin='normal'
            disabled={isBundle && isCollectible && !settings.allowUpdatingBundleName}
            inputProps={{ maxLength: 50 }}
            value={name}
            onChange={(event) => setName(event.target.value)}
            helperText={`${name.length}/50`}
          />
          <TextField
            id='description'
            label={translate('Label.ItemDescription')}
            fullWidth
            multiline
            margin='normal'
            inputProps={{ maxLength: 1000 }}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            helperText={`${description.length}/1000`}
            error={!description}
          />
        </Grid>
      </Grid>
    </div>
  );
}

export default ItemDetails;
