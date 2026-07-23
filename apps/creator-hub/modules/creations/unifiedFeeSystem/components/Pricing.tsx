import { useEffect, useState } from 'react';
import type {
  RobloxItemConfigurationApiGetItemResponse,
  RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice,
  RobloxItemConfigurationApiRentalOption,
} from '@rbx/client-itemconfiguration/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Checkbox,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Link,
  makeStyles,
  RobuxIcon,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { CreatorEarningsMessage } from '../../itemConfiguration/components/UnlimitedFormComponents';
import { useItemConfigureFormStyles } from '../helper/StyleHooks';
import {
  DefaultMaxCollectiblePrice,
  PurchasePlatformEnum,
} from '../helper/UnifiedFeeSystemConstants';
import { getTaxonomyDisplayName } from '../helper/UnifiedFeeSystemHelper';
import RegionalPricingPreviewPanel from './RegionalPricingPreviewPanel';

const useStyles = makeStyles()((theme) => ({
  description: {
    color: theme.palette.content.muted,
  },
  iconButton: {
    color: theme.palette.content.muted,
  },
  freePriceLabel: {
    color: theme.palette.actionV2.active.fill,
  },
}));

interface PricingProps {
  isBundle: boolean;
  isFree: boolean;
  is2dAsset?: boolean;
  isLimited: boolean;
  isOptOutRegionalPricing?: boolean;
  setIsOptOutRegionalPricing?: (isRegionalPricingEnabled: boolean) => void;
  price: number | undefined;
  setPrice: (price: number) => void;
  priceOffset: number | undefined;
  setPriceOffset: (priceOffset: number) => void;
  optionalPriceFloor: number | undefined;
  setOptionalPriceFloor: (optionalPriceFloor: number) => void;
  itemTypeString: string;
  collectiblesMetadata?: ItemConfigurationCollectiblesMetadataResponse;
  priceFloor: number;
  targetId: number;
  itemDetails?: RobloxItemConfigurationApiGetItemResponse;
  name: string;
  isRentableOptIn: boolean | undefined;
  rentalPricingData?: RobloxItemConfigurationApiRentalOption[];
  regionalRentalPricingData?: RobloxItemConfigurationApiModelsMarketplaceItemRegionalRentalPrice[];
  setShowTimedOptionsDialog: (show: boolean) => void;
}

// TODO @mryumae: durables - pass wear time to pricing
function Pricing(props: PricingProps) {
  const {
    isBundle,
    isFree,
    is2dAsset = false,
    isLimited,
    isOptOutRegionalPricing = false,
    setIsOptOutRegionalPricing = () => {},
    price,
    setPrice,
    priceOffset,
    setPriceOffset,
    optionalPriceFloor,
    setOptionalPriceFloor,
    itemTypeString,
    collectiblesMetadata,
    priceFloor,
    targetId,
    itemDetails,
    name,
    isRentableOptIn,
    rentalPricingData,
    regionalRentalPricingData,
    setShowTimedOptionsDialog,
  } = props;
  const { translate } = useTranslation();
  const { classes } = useItemConfigureFormStyles();
  const [isRegionalPricingPanelOpen, setIsRegionalPricingPanelOpen] = useState(false);
  const [creatorEarningsPercentage, setCreatorEarningsPercentage] = useState<number | undefined>(
    undefined,
  );
  const { settings } = useSettings();
  const { classes: styles } = useStyles();

  const isRentablesEnabled = settings?.enableRentables;

  // Returns the price floor type, which is used in
  // "Current Price Floor of {Type}"
  // todo: MKTPL-12007 - replace the regex with translated strings.
  const getPriceFloorType = () => {
    const formattedItemType = itemTypeString.replaceAll(/([A-Z])/g, ' $1').trim();
    if (collectiblesMetadata?.isGetPriceFloorEnabled) {
      // If taxonomy is changed, return the formatted item type with the taxonomy name in parentheses
      const taxonomyDisplayName = getTaxonomyDisplayName(
        itemDetails?.item?.taxonomyDetails?.dpfTaxonomyName ?? '',
        translate,
      );
      if (
        itemDetails?.item?.taxonomyDetails?.dpfTaxonomyIsDefaultTaxonomy === false &&
        taxonomyDisplayName
      ) {
        return `${formattedItemType} (${taxonomyDisplayName})`;
      }
      // Just return the formatted item type.
      return formattedItemType;
    }
    return formattedItemType;
  };

  const maxCollectiblePrice =
    collectiblesMetadata?.maxCollectiblePrice ?? DefaultMaxCollectiblePrice;

  const getRentalPricingDisplayText = () => {
    if (rentalPricingData == null || rentalPricingData.length === 0) {
      return '';
    }

    const minPrice = Math.min(
      ...rentalPricingData.map((item) => item.priceInRobux ?? Infinity),
    ).toString();
    const maxPrice = Math.max(
      ...rentalPricingData
        .filter((item) => item.rentalDays !== undefined)
        .map((item) => item.priceInRobux ?? 0),
    ).toString();
    return `${minPrice} - ${maxPrice}`;
  };

  const pricePrompt2d = (minPrice: number | undefined) => {
    if (!minPrice || minPrice < priceFloor) {
      return translate('Error.MinimumPrice', {
        price: priceFloor.toString(),
      });
    }

    if (minPrice > maxCollectiblePrice) {
      return translate('Error.MaximumPrice', {
        price: maxCollectiblePrice.toString(),
      });
    }
    return '';
  };

  useEffect(() => {
    const fetchRevenueSplit = async () => {
      const revenueSplitResponse = await itemconfigurationClient.getRevenueSplit(
        isBundle,
        targetId.toString(),
        isLimited,
        // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: a 0 floor should fall back to the minimum of 1
        optionalPriceFloor || 1,
        priceOffset ?? 0,
        PurchasePlatformEnum.Marketplace,
      );
      setCreatorEarningsPercentage(revenueSplitResponse.revenueSplit?.creatorSplitPercentage);
    };
    void fetchRevenueSplit();
  }, [
    isBundle,
    isLimited,
    optionalPriceFloor,
    priceOffset,
    setCreatorEarningsPercentage,
    targetId,
  ]);

  const get2DPricingUI = () => {
    return collectiblesMetadata?.unifyConfigureUI ? (
      <div>
        <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
          {translate('Label.Pricing')}
        </Typography>
        <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
          <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.CurrentTypePriceFloor', {
                type: getPriceFloorType(),
              })}
            </Typography>
            <br />
            <Typography variant='body2' className={styles.description}>
              {translate('Message.ItemMinimumPrice')}{' '}
              <Link
                href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/dashboard/creations/pricing`}
                target='_blank'>
                {translate('Action.LearnMore')}
              </Link>
            </Typography>
          </Grid>
          <Grid item XSmall={12} Large={7} alignItems='center' container>
            <RobuxIcon />
            <Typography style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
              {priceFloor}
            </Typography>
          </Grid>
          <Grid
            container
            item
            XSmall={12}
            rowGap={2}
            style={{ marginTop: '40px', color: 'inherit' }}>
            <Grid item XSmall={12} Large={5} style={{ paddingRight: '64px' }}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {translate('Label.PriceConfigurations')}
              </Typography>
              <br />
              <Typography variant='body2' className={styles.description}>
                {translate('Message.SetPrice')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7}>
              <TextField
                id='amountAbovePriceFloor'
                fullWidth
                label={translate('Label.AmountAbovePriceFloor')}
                value={
                  // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
                  priceOffset || ''
                }
                onChange={(event) => {
                  const value = +event.target.value;
                  if (value >= 0 && value <= maxCollectiblePrice) {
                    setPriceOffset(value);
                  }
                }}
                disabled={isFree}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={translate('Message.PriceOffsetDescription')} placement='top'>
                      <IconButton aria-label='iconbutton' className={styles.iconButton}>
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />

              <TextField
                id='price floor'
                fullWidth
                label={translate('Label.DoNotPriceBelow')}
                value={
                  // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
                  optionalPriceFloor || ''
                }
                onChange={(event) => {
                  const value = +event.target.value;
                  if (value >= 0 && value <= maxCollectiblePrice) {
                    setOptionalPriceFloor(value);
                  }
                }}
                disabled={isFree}
                style={{ marginTop: '16px' }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title={translate('Message.OptionalPriceFloorDescription')}>
                      <IconButton aria-label='iconbutton' className={styles.iconButton}>
                        <InfoOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Grid item XSmall={12} Large={5}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.ItemPriceTitle')}
            </Typography>
          </Grid>
          <Grid item XSmall={12} Large={7}>
            <Grid item XSmall={12} Large={7} alignItems='center' marginBottom='3px' container>
              <RobuxIcon />
              <Typography style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
                {Math.max(
                  optionalPriceFloor ?? 1,
                  priceOffset ? priceFloor + priceOffset : priceFloor,
                )}
              </Typography>
            </Grid>
            <Typography variant='body2' className={styles.description}>
              {translate('Label.PriceFloorBreakdown')}
            </Typography>
          </Grid>
          <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
            <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {translate('Label.RegionalPricing')}
              </Typography>
              <br />
              <Typography variant='body2' className={styles.description}>
                {translate('Message.RegionalPricePreviewDescription')}{' '}
                {!settings.disableJuneNinthLaunchAnnouncementRegionalPricing &&
                  translate('Message.JuneNinthTesting')}{' '}
                <Button
                  onClick={() => setIsRegionalPricingPanelOpen(true)}
                  variant='text'
                  color='primary'
                  size='small'
                  className={classes.viewDetailsButton}
                  style={{ textDecoration: 'underline' }}>
                  {translate('Action.ViewDetails')}
                </Button>
              </Typography>
            </Grid>
            <Grid
              item
              XSmall={12}
              Large={7}
              alignItems='center'
              container
              className={classes.regionalPricingCheckbox}>
              <Checkbox
                size='large'
                color='secondary'
                checked={!isOptOutRegionalPricing}
                onChange={(event) => setIsOptOutRegionalPricing(!event.target.checked)}
              />
              <Typography>{translate('Label.EnableRegionalPricing')}</Typography>
            </Grid>
          </Grid>
          {creatorEarningsPercentage ? (
            <CreatorEarningsMessage creatorEarningsPercentage={creatorEarningsPercentage} />
          ) : null}
        </Grid>
      </div>
    ) : (
      <div style={{ opacity: isFree ? '24%' : '100%' }}>
        <Grid container item XSmall={12} Large={6} rowGap={2}>
          <TextField
            id='price'
            fullWidth
            label={translate('Label.SetPrice')}
            type='Number'
            value={
              // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
              optionalPriceFloor || ''
            }
            style={{ marginBottom: '4px' }}
            error={
              !optionalPriceFloor ||
              optionalPriceFloor > maxCollectiblePrice ||
              optionalPriceFloor < priceFloor
            }
            helperText={pricePrompt2d(optionalPriceFloor)}
            onChange={(event) => {
              const value = +event.target.value;
              if (value >= 0 && value <= maxCollectiblePrice) {
                setOptionalPriceFloor(value);
              }
            }}
          />
          {creatorEarningsPercentage ? (
            <CreatorEarningsMessage creatorEarningsPercentage={creatorEarningsPercentage} />
          ) : null}
        </Grid>
      </div>
    );
  };

  return (
    <div>
      {is2dAsset ? (
        get2DPricingUI()
      ) : (
        <div style={{ opacity: isFree ? '24%' : '100%' }}>
          <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
            {translate('Label.Pricing')}
          </Typography>

          <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
            <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
              <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                {translate('Label.CurrentTypePriceFloor', {
                  type: getPriceFloorType(),
                })}
              </Typography>
              <br />
              <Typography variant='body2' className={styles.description}>
                {translate('Message.ItemMinimumPrice')}{' '}
                <Link
                  href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/dashboard/creations/pricing`}
                  target='_blank'>
                  {translate('Action.LearnMore')}
                </Link>
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={7} alignItems='center' container>
              <RobuxIcon />
              <Typography style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
                {priceFloor}
              </Typography>
            </Grid>
          </Grid>

          {(!isBundle || collectiblesMetadata?.isNewBundleUIEnabled) && (
            <Grid
              container
              item
              XSmall={12}
              rowGap={2}
              style={{ marginTop: '40px', color: 'inherit' }}>
              <Grid item XSmall={12} Large={5} style={{ paddingRight: '64px' }}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.PriceConfigurations')}
                </Typography>
                <br />
                <Typography variant='body2' className={styles.description}>
                  {translate('Message.SetPrice')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <TextField
                  id='amountAbovePriceFloor'
                  fullWidth
                  label={translate('Label.AmountAbovePriceFloor')}
                  value={
                    // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
                    priceOffset || ''
                  }
                  onChange={(event) => {
                    const value = +event.target.value;
                    if (value >= 0 && value <= maxCollectiblePrice) {
                      setPriceOffset(value);
                    }
                  }}
                  disabled={isFree}
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={translate('Message.PriceOffsetDescription')} placement='top'>
                        <IconButton aria-label='iconbutton' className={styles.iconButton}>
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />

                <TextField
                  id='price floor'
                  fullWidth
                  label={translate('Label.DoNotPriceBelow')}
                  value={
                    // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
                    optionalPriceFloor || ''
                  }
                  onChange={(event) => {
                    const value = +event.target.value;
                    if (value >= 0 && value <= maxCollectiblePrice) {
                      setOptionalPriceFloor(value);
                    }
                  }}
                  disabled={isFree}
                  style={{ marginTop: '16px' }}
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={translate('Message.OptionalPriceFloorDescription')}>
                        <IconButton aria-label='iconbutton' className={styles.iconButton}>
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          )}

          {!isFree && (
            <Grid container item XSmall={12} rowGap={2} alignItems='center' marginTop='40px'>
              <Grid item XSmall={12} Large={5}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.ItemPriceTitle')}
                </Typography>
              </Grid>

              {isBundle && collectiblesMetadata?.isNewBundleUIEnabled === false ? (
                <Grid item XSmall={12} Large={7}>
                  <TextField
                    id='price'
                    label='Price'
                    type='Number'
                    value={
                      // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- intentional falsy coalescing: 0 should render as an empty field
                      price || ''
                    }
                    error={!price || price > maxCollectiblePrice || price < priceFloor}
                    helperText={
                      price != null && price < priceFloor
                        ? `Price cannot be lower than ${priceFloor} `
                        : ''
                    }
                    onChange={(event) => {
                      const value = +event.target.value;
                      if (value >= 0 && value <= maxCollectiblePrice) {
                        setPrice(value);
                      }
                    }}
                    fullWidth
                  />
                </Grid>
              ) : (
                <Grid item XSmall={12} Large={7}>
                  <Grid item XSmall={12} Large={7} alignItems='center' marginBottom='3px' container>
                    <RobuxIcon />
                    <Typography style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
                      {Math.max(
                        optionalPriceFloor ?? 1,
                        priceOffset ? priceFloor + priceOffset : priceFloor,
                      )}
                    </Typography>
                  </Grid>
                  <Typography variant='body2' className={styles.description}>
                    {translate('Label.PriceFloorBreakdown')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {isRentablesEnabled && isRentableOptIn && (
            <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
              <Grid item XSmall={12} Large={5} style={{ paddingRight: '64px' }}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Title.TimedOptions')}
                </Typography>
                <br />
                <Typography variant='body2' className={styles.description}>
                  {translate('Label.BasedOnTheSalePrice')}
                </Typography>
              </Grid>
              <Grid item XSmall={12} Large={7}>
                <Grid item XSmall={12} Large={7} alignItems='center' marginBottom='3px' container>
                  <RobuxIcon />
                  <Typography style={{ fontSize: '18px', fontWeight: '425', marginLeft: '6px' }}>
                    {getRentalPricingDisplayText()}
                  </Typography>
                  <IconButton
                    aria-label='iconbutton'
                    className={styles.iconButton}
                    onClick={() => setShowTimedOptionsDialog(true)}>
                    <InfoOutlinedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          )}

          {!isLimited && collectiblesMetadata?.isRegionalPricingEnabled && (
            <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '32px' }}>
              <Grid item XSmall={12} Large={5} style={{ paddingRight: '20px' }}>
                <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
                  {translate('Label.RegionalPricing')}
                </Typography>
                <br />
                <Typography variant='body2' className={styles.description}>
                  {translate('Message.RegionalPricePreviewDescription')}{' '}
                  {!settings.disableJuneNinthLaunchAnnouncementRegionalPricing &&
                    translate('Message.JuneNinthTesting')}{' '}
                  <Button
                    onClick={() => setIsRegionalPricingPanelOpen(true)}
                    variant='text'
                    color='primary'
                    size='small'
                    className={classes.viewDetailsButton}
                    style={{ textDecoration: 'underline' }}>
                    {translate('Action.ViewDetails')}
                  </Button>
                </Typography>
              </Grid>
              <Grid
                item
                XSmall={12}
                Large={7}
                alignItems='center'
                container
                className={classes.regionalPricingCheckbox}>
                <Checkbox
                  size='large'
                  color='secondary'
                  checked={!isOptOutRegionalPricing}
                  onChange={(event) => setIsOptOutRegionalPricing(!event.target.checked)}
                />
                <Typography>{translate('Label.EnableRegionalPricing')}</Typography>
              </Grid>
            </Grid>
          )}
        </div>
      )}
      {isFree && (
        <Grid container item XSmall={12} rowGap={2} style={{ marginTop: '40px' }}>
          <Grid item XSmall={5}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.ItemSalePriceToday')}
            </Typography>
          </Grid>
          <Grid item XSmall={7} alignItems='center' container>
            <Typography
              className={styles.freePriceLabel}
              style={{ fontSize: '18px', fontWeight: '425' }}>
              {translate('Label.Free')}
            </Typography>
          </Grid>
        </Grid>
      )}
      {isRegionalPricingPanelOpen && (
        <RegionalPricingPreviewPanel
          isOpen={isRegionalPricingPanelOpen}
          onClose={() => setIsRegionalPricingPanelOpen(false)}
          priceOffset={priceOffset}
          minimumPrice={optionalPriceFloor ?? 1}
          isBundle={isBundle}
          targetId={targetId}
          itemDetails={itemDetails}
          name={name}
          isLimited={isLimited}
          isRentableOptIn={isRentableOptIn}
          regionalRentalPricingData={regionalRentalPricingData}
        />
      )}
    </div>
  );
}

export default Pricing;
