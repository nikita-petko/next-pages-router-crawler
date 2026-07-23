import { useCallback } from 'react';
import type {
  RobloxItemConfigurationApiCollectiblesMetadataResponse,
  RobloxItemConfigurationApiGetItemResponse,
} from '@rbx/client-itemconfiguration/v1';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import { Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import {
  TextField,
  FormControlLabel,
  Typography,
  Grid,
  Chip,
  Tooltip,
  InfoOutlinedIcon,
  makeStyles,
  useTheme,
} from '@rbx/ui';
import {
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
  Asset,
  assetTypeToItemType,
} from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import ScheduleReleaseToggle from '../../itemConfiguration/components/ScheduleReleaseToggle';
import { useItemConfigureFormStyles } from '../helper/StyleHooks';
import { mapAssetTypeToString, mapBundleTypeToString } from '../helper/UnifiedFeeSystemConstants';
import { getItemTypeChipIconSrc, getTaxonomyDisplayName } from '../helper/UnifiedFeeSystemHelper';
import CoreContentGatedBanner from './CoreContentGatedBanner';
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
  isHd?: boolean;
}

const useStyles = makeStyles()(() => ({
  iecInfoIcon: {
    marginLeft: 5,
  },
  chipItemTypeIconImg: {
    padding: '5px',
  },
}));

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
    isHd,
  } = props;
  const { settings } = useSettings();
  const theme = useTheme();

  const mappedAssetType = mapAssetTypeToString(
    itemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
      RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
  );
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- mapAssetTypeToString yields Asset keys used downstream
  const assetType = mappedAssetType as Asset;
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
    classes: { iecInfoIcon, chipItemTypeIconImg },
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

  const showCoreContentGatedBanner =
    settings.enableCoreContentGatedBanner &&
    itemDetails?.item?.discoverabilityDetails?.isCoreContentGated;

  return (
    <div>
      {showMarketplaceVisibilityBanner && (
        <Grid marginBottom={2}>
          <MarketplaceVisibilityBanner />
        </Grid>
      )}
      {showCoreContentGatedBanner && (
        <Grid marginBottom={2}>
          <CoreContentGatedBanner />
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
                icon={
                  <img
                    src={getItemTypeChipIconSrc(itemType, theme.palette.mode === 'dark')}
                    alt=''
                    className={chipItemTypeIconImg}
                  />
                }
                variant='outlined'
                color='secondary'
                label={translate(`Label.${itemType}`)}
              />
            </Tooltip>
            {isTaxonomyChanged && taxonomyDisplayName && (
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
