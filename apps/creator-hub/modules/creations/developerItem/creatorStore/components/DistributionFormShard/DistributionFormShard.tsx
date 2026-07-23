import type { FunctionComponent } from 'react';
import { Fragment, useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { RobloxMarketplaceFiatSharedV1Beta1BasePriceMapping as BasePriceMapping } from '@rbx/client-marketplace-fiat-service/v1';
import type { GetRequirementsResponse } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { useLocalization, useTranslation } from '@rbx/intl';
import {
  Divider,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Select,
  Switch,
  Typography,
  Alert,
  AlertTitle,
  Tooltip,
} from '@rbx/ui';
import type { CreatorStoreProduct } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import type { DeveloperItemDistributionQuota } from '@modules/clients/publish';
import DataSharingTabKey from '@modules/data-collection/enums/DataSharingTabKey';
import {
  DataSharingDisplayState,
  FREE_BASE_PRICE,
  getDataSharingDisplayState,
  getPriceDisplayStringFromMoney,
  isFiatPriceStringPriced,
} from '@modules/marketplaceFiatService/utils/fiatUtils';
import { Asset, CreatorType } from '@modules/miscellaneous/common';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getDataCollectionSettingsUrl } from '@modules/miscellaneous/urls/creatorHub';
import { capitalizeFirstLetter } from '@modules/miscellaneous/utils/helperUtils';
import OverviewInlineUrlTranslationLabel from '../../../../common/components/OverviewInlineUrlTranslationLabel';
import type { DistributionErrorState } from '../../../common/common';
import SettingsForm from '../../../common/SettingsForm/SettingsForm';
import type { DeveloperItemDetails } from '../../../common/types';
import PricingAlert from '../PricingAlert/PricingAlert';
import useDistributionFormShardStyles from './DistributionFormShard.styles';

const { docs } = creatorHub;

export type DistributionFormShardProps = {
  assetConfigurationRequirements: GetRequirementsResponse;
  assetType: Asset;
  basePrices: BasePriceMapping[];
  developerItemDetails: DeveloperItemDetails;
  fiatProduct: CreatorStoreProduct;
  frontendFlagEnableModelPricingTransition: boolean;
  isDataSharingEligible: boolean;
  isItemDistributedValue: boolean;
  isOpenUseAsset: boolean;
  quota: DeveloperItemDistributionQuota;
  distributionErrorState?: DistributionErrorState;
  isBackendFiatProductDistributed?: boolean;
};

const DistributionFormShard: FunctionComponent<DistributionFormShardProps> = ({
  assetConfigurationRequirements,
  assetType,
  basePrices,
  developerItemDetails,
  fiatProduct,
  frontendFlagEnableModelPricingTransition, // temporary parameter for model pricing transition state, remove with FrontendFlagEnableModelPricingTransition
  isDataSharingEligible,
  isItemDistributedValue,
  isOpenUseAsset,
  quota,
  distributionErrorState,
  isBackendFiatProductDistributed = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: {
      currencyPricingContainer,
      hiddenContainer,
      indentContainer,
      pricingCaptionContainer,
      subtitleContainer,
      settingsContainer,
      switchContainer,
      switchLabel,
    },
    cx,
  } = useDistributionFormShardStyles();
  const { control, watch, setValue } = useFormContext();

  const fiatPriceValue = watch('fiatPrice');
  const dataSharingEnabledValue = watch('dataSharingEnabled');

  const assetId = parseInt(developerItemDetails.id, 10);
  const isGroupOwnedAsset = developerItemDetails?.creator.type === CreatorType.Group;

  const isBackendFiatProductPriced =
    fiatProduct?.basePrice?.quantity?.significand !== undefined &&
    fiatProduct?.basePrice?.quantity?.significand !== null &&
    Number(fiatProduct?.basePrice?.quantity?.significand) > 0;

  const assetTypeIsMonetizable =
    assetConfigurationRequirements?.pricing?.restrictions &&
    !assetConfigurationRequirements.pricing.restrictions.includes(Restriction.AssetType);
  const dataSharingDisplayState = getDataSharingDisplayState(
    assetType,
    isDataSharingEligible,
    isItemDistributedValue,
    fiatPriceValue,
    assetConfigurationRequirements,
  );
  // TODO with model monetization, update this to also depend on if models are in the onboarding stage
  // There's some complexity to this since assetTypeIsMonetizable depends on MarketplacePublishingRequirementsService
  // If we add models there to the monetizable list, we need to gate models specifically
  // to show the pricing window regardless of whether or not they distribute the asset
  // until the onboarding stage is over
  const showFiatPricingSection = assetTypeIsMonetizable && isItemDistributedValue;

  // Open use assets cannot be priced
  // If open use, set the price to free when the distribution toggle is enabled
  useEffect(() => {
    if (isOpenUseAsset && isItemDistributedValue) {
      setValue('fiatPrice', JSON.stringify(FREE_BASE_PRICE));
    }
  }, [isOpenUseAsset, setValue, isItemDistributedValue]);

  const fiatProductBasePriceJsonString = JSON.stringify(fiatProduct.basePrice);

  const renderSelectOptions = () => {
    const currentBasePriceMoney = basePrices.find(
      (basePriceMapping: BasePriceMapping) =>
        JSON.stringify(basePriceMapping.basePriceMoney) === fiatProductBasePriceJsonString,
    )?.basePriceMoney;

    // if the backend product is already priced but now pricing.isAllowed is false, show only [Free, currentBasePriceMoney]
    if (
      isBackendFiatProductPriced &&
      currentBasePriceMoney &&
      !assetConfigurationRequirements.pricing?.isAllowed
    ) {
      const freeBasePriceMoney = basePrices.find(
        (basePriceMapping: BasePriceMapping) =>
          basePriceMapping.basePriceMoney?.quantity?.significand ===
          FREE_BASE_PRICE.quantity.significand,
      )?.basePriceMoney;

      return [
        <MenuItem
          value={JSON.stringify(freeBasePriceMoney)}
          key={JSON.stringify(freeBasePriceMoney)}>
          {capitalizeFirstLetter(locale, translate('Label.Free'))}
        </MenuItem>,
        <MenuItem
          value={JSON.stringify(currentBasePriceMoney)}
          key={JSON.stringify(currentBasePriceMoney)}>
          {getPriceDisplayStringFromMoney(currentBasePriceMoney, locale)}
        </MenuItem>,
      ];
    }

    return basePrices.map((basePriceMapping: BasePriceMapping) => {
      const { basePriceMoney } = basePriceMapping;
      const isPaidBasePrice =
        basePriceMoney?.quantity?.significand && basePriceMoney.quantity.significand >= 0;
      return (
        <MenuItem value={JSON.stringify(basePriceMoney)} key={JSON.stringify(basePriceMoney)}>
          {isPaidBasePrice
            ? getPriceDisplayStringFromMoney(basePriceMoney, locale)
            : capitalizeFirstLetter(locale, translate('Label.Free'))}
        </MenuItem>
      );
    });
  };

  const selectEnabled =
    (isBackendFiatProductPriced && assetConfigurationRequirements.publishing?.isAllowed) || // if the backend product is already priced and publishing is allowed, allow the user to set it to free
    (assetConfigurationRequirements.pricing?.isAllowed && !isOpenUseAsset); // if pricing is allowed and the asset is not open use, show all pricing options

  return (
    <Grid container item>
      <Grid item XSmall={12} classes={{ root: subtitleContainer }}>
        <Typography component='h3' variant='h3'>
          {translate('Heading.Distribution')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} classes={{ root: settingsContainer }}>
        <SettingsForm
          assetId={assetId}
          creator={developerItemDetails.creator}
          distributionErrorState={distributionErrorState}
          isBackendFiatProductDistributed={isBackendFiatProductDistributed}
          isDistributed={isItemDistributedValue}
          quota={quota}
        />
      </Grid>
      <Grid
        container
        data-testid='fiat-pricing-section'
        item
        style={{ display: showFiatPricingSection ? 'inherit' : 'none', marginBottom: 24 }}
        XSmall={12}>
        <Grid item XSmall={12}>
          <Divider style={{ marginTop: 24, marginBottom: 48 }} />
        </Grid>
        <Grid item XSmall={12}>
          <Typography component='h3' variant='h3' classes={{ root: currencyPricingContainer }}>
            {translate('Label.CurrencyPricing')}
          </Typography>
          <Grid container item classes={{ root: pricingCaptionContainer }}>
            <Typography color='secondary' variant='body2'>
              {translate('Label.PricingAllowsYouToMonetize')}
            </Typography>
            {assetType === Asset.Model && (
              <Typography color='secondary' variant='body2'>
                {translateHTML('Label.AssetPrivacyBeforeImportingModel', [
                  {
                    opening: 'reqLinkStart',
                    closing: 'reqLinkEnd',
                    content: (chunks) => (
                      <Link href={ASSET_ACCESS_PRIVACY} target='_blank'>
                        {chunks}
                      </Link>
                    ),
                  },
                ])}
              </Typography>
            )}
          </Grid>
          <PricingAlert assetConfigurationRequirements={assetConfigurationRequirements} />
          <Grid
            item
            container
            rowSpacing={2}
            XSmall={12}
            style={{ display: isGroupOwnedAsset ? 'none' : 'inherit' }}>
            <Grid item XSmall={12}>
              <Controller
                name='fiatPrice'
                control={control}
                defaultValue={fiatProductBasePriceJsonString}
                render={({ field }) => {
                  return (
                    <Tooltip
                      title={isOpenUseAsset && translate('Message.OpenUsePricedRestriction')}>
                      <Select
                        {...field}
                        data-testid='fiat-price-select'
                        disabled={!selectEnabled}
                        fullWidth
                        id='fiatPrice'
                        label={translate('Label.SetAPrice')}>
                        {renderSelectOptions()}
                      </Select>
                    </Tooltip>
                  );
                }}
              />
            </Grid>
            {frontendFlagEnableModelPricingTransition &&
              assetType === Asset.Model &&
              isItemDistributedValue &&
              isFiatPriceStringPriced(fiatPriceValue) && (
                <Grid item XSmall={12}>
                  <Alert severity='warning' variant='standard'>
                    <AlertTitle>{translate('Label.ModelPricingNotice')}</AlertTitle>
                    <OverviewInlineUrlTranslationLabel
                      anchorTargetUrl={ASSET_ACCESS_PRIVACY}
                      closing='linkEnd'
                      typographyVariantOverride='smallLabel2'
                      typographyColorOverride='inherit'
                      linkVariantOverride='body2'
                      opening='linkStart'
                      translationKey='Message.ModelPricingTransitionNotice'
                    />
                  </Alert>
                </Grid>
              )}
          </Grid>
          <Grid
            data-testid='group-assets-ineligibility-message'
            item
            style={{ display: isGroupOwnedAsset ? 'inherit' : 'none' }}
            XSmall={12}>
            <OverviewInlineUrlTranslationLabel
              anchorTargetUrl={docs.getSellingOnCreatorStoreUrl()}
              closing='docLinkEnd'
              typographyVariantOverride='body2'
              linkVariantOverride='body2'
              opening='docLinkStart'
              translationKey='Label.GroupOwnedAssetsIneligible'
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid
        classes={{
          root: cx({
            [hiddenContainer]: dataSharingDisplayState === DataSharingDisplayState.NotApplicable,
          }),
        }}
        marginTop={4}
        container
        data-testid='data-sharing-section'
        item>
        <Grid item XSmall={12} classes={{ root: subtitleContainer }}>
          <Typography component='h3' variant='h3'>
            {translate('Heading.DataSharing')}
          </Typography>
        </Grid>
        <Grid
          item
          XSmall={12}
          classes={{
            root: cx(indentContainer, {
              [hiddenContainer]: dataSharingDisplayState !== DataSharingDisplayState.Configurable,
            }),
          }}
          data-testid='data-sharing-toggle'>
          <Controller
            name='dataSharingEnabled'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                classes={{ root: switchContainer }}
                control={
                  <Switch
                    data-testid='open-for-comments-switch'
                    aria-label={translate('Label.AllowTraining')}
                    onChange={(e) => field.onChange(e.target.checked)}
                    checked={!!field.value}
                  />
                }
                label={
                  <>
                    <Typography variant='body1' color='primary' classes={{ root: switchLabel }}>
                      {translate('Label.AllowTraining')}
                    </Typography>
                    <Typography variant='smallLabel2' color='secondary'>
                      {dataSharingEnabledValue ? (
                        <OverviewInlineUrlTranslationLabel
                          anchorTargetUrl={getDataCollectionSettingsUrl(
                            false,
                            false,
                            DataSharingTabKey.CreatorStoreAssets,
                          )}
                          closing='linkEnd'
                          typographyVariantOverride='smallLabel2'
                          typographyColorOverride='inherit'
                          linkVariantOverride='inherit'
                          opening='linkStart'
                          translationKey='Message.PricedAssetsOptIn'
                        />
                      ) : (
                        <Fragment>
                          <Typography variant='smallLabel2' color='warning'>
                            {translate('Message.DataSharingNudge')}
                          </Typography>
                          <br />
                          <OverviewInlineUrlTranslationLabel
                            anchorTargetUrl={getDataCollectionSettingsUrl(
                              false,
                              false,
                              DataSharingTabKey.CreatorStoreAssets,
                            )}
                            closing='linkEnd'
                            typographyVariantOverride='smallLabel2'
                            typographyColorOverride='inherit'
                            linkVariantOverride='inherit'
                            opening='linkStart'
                            translationKey='Message.DataSharingFullyAnonymized'
                          />
                        </Fragment>
                      )}
                      <span>{` `}</span>
                      <Link href={docs.getAiDataSharingUrl()} target='_blank'>
                        {translate('Label.LearnMore')}
                      </Link>
                    </Typography>
                  </>
                }
              />
            )}
          />
        </Grid>
        <Grid
          classes={{
            root: cx({
              [hiddenContainer]: !(
                dataSharingDisplayState === DataSharingDisplayState.FairUseGeneric ||
                dataSharingDisplayState === DataSharingDisplayState.FairUseReseller
              ),
            }),
          }}
          data-testid='data-sharing-copy'>
          <Typography variant='smallLabel2' color='secondary'>
            <span>
              {dataSharingDisplayState === DataSharingDisplayState.FairUseGeneric
                ? translate('Message.FreeAssetsAreFairUse')
                : translate('Message.ResellerAssetsAreFairUse')}
            </span>
            <span>{` `}</span>
            <Link href={docs.getAiDataSharingUrl()} target='_blank'>
              {translate('Label.LearnMore')}
            </Link>
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DistributionFormShard;
