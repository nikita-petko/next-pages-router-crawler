import React, { Fragment, FunctionComponent, useEffect, useState } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useTranslation, withTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import {
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  RobuxIcon,
  Select,
  Typography,
} from '@rbx/ui';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  RobloxItemConfigurationApiModelsResponseCategory,
  RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseAssetTypesEnum,
  RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseBundleTypesEnum,
  RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseItemFeaturesEnum,
  V1ItemsPriceFloorGetCollectibleItemTypeEnum,
  V1ItemsPriceFloorGetCreationTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import itemConfigurationClient, {
  ItemConfigurationCollectiblesMetadataResponse,
} from '@modules/clients/itemconfiguration';
import { Asset, EmptyGrid } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import {
  getTaxonomyDisplayName,
  itemTypeStringToLabelKey,
  translateAssetType,
  translateAssetTypeToAsset,
  translateBundleInfoTypeToBundleType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import { translateBundleType } from '../../avatarItem/utils/loadAvatarItemsUtils';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import usePricingCalculatorStyles from './PricingCalculator.styles';

enum LoadingStatus {
  LOADING = 0,
  FAILED = 1,
  SUCCESS = 2,
}

const assetTypeEnumToString = (
  assetType: RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseAssetTypesEnum,
): string => {
  return translateAssetTypeToAsset(
    assetType as RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  ) as string;
};

const bundleTypeEnumToString = (
  bundleType: RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseBundleTypesEnum,
): string => {
  return translateBundleType(bundleType as BundleType) as string;
};

const fetchPriceFloorVariables = async () => {
  const response = await itemConfigurationClient.getPriceFloorVariables();

  const assetTypes = response.assetTypes!.map(assetTypeEnumToString);
  const bundleTypes = response.bundleTypes!.map(bundleTypeEnumToString);

  const itemTypes = bundleTypes
    .concat(assetTypes)
    .filter((itemType: string | undefined): itemType is string => itemType !== undefined);
  const itemFeatures = response.itemFeatures!;

  const categories = response.categories!;

  return { itemTypes, categories, itemFeatures };
};

const QUERY_PARAM_KEYS = [
  'itemType',
  'category',
  'isBodysuit',
  'isPbr',
  'isLimited',
  'isIec',
] as const;

const parseBoolParam = (v: string | string[] | undefined): boolean => v === 'true' || v === '1';

const PricingCalculator: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const {
    classes: { robuxAmount, robuxAmountNumber, iconBig },
  } = usePricingCalculatorStyles();
  const { settings, isFetched } = useSettings();
  const [queryParams, setQueryParamValues] = useQueryParams(QUERY_PARAM_KEYS);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.LOADING);
  const [priceFloor, setPriceFloor] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<RobloxItemConfigurationApiModelsResponseCategory[]>(
    [],
  );
  const [itemFeatures, setItemFeatures] = useState<
    RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseItemFeaturesEnum[]
  >([]);

  const [collectiblesMetadata, setCollectiblesMetadata] =
    useState<ItemConfigurationCollectiblesMetadataResponse | null>();

  const itemType =
    typeof queryParams.itemType === 'string' && itemTypes.includes(queryParams.itemType)
      ? queryParams.itemType
      : undefined;
  const categoryCanonicalName =
    typeof queryParams.category === 'string' &&
    categories.some((c) => c.name === queryParams.category)
      ? queryParams.category
      : undefined;
  const categoryId = categoryCanonicalName
    ? categories.find((c) => c.name === categoryCanonicalName)?.id
    : undefined;
  const isIec = parseBoolParam(queryParams.isIec ?? undefined);
  const isLimited = parseBoolParam(queryParams.isLimited ?? undefined);
  const isPbr = parseBoolParam(queryParams.isPbr ?? undefined);

  const taxonomyEnabled = isFetched && settings.enableTaxonomyInPricingPage;
  const showCategorySelect = taxonomyEnabled && !isIec;
  const showItemTypeSelect = !taxonomyEnabled || isIec;

  const itemTypeForPriceFloor = showItemTypeSelect ? itemType : undefined;
  const categoryIdForPriceFloor = showCategorySelect ? categoryId : undefined;

  const updatePriceFloorVariables = async () => {
    try {
      const response = await fetchPriceFloorVariables();
      setItemTypes(response.itemTypes);
      setCategories(response.categories);
      setItemFeatures(response.itemFeatures);
      setLoadingStatus(LoadingStatus.SUCCESS);
    } catch {
      setLoadingStatus(LoadingStatus.FAILED);
    }
  };

  const updateCollectiblesMetadata = async () => {
    const response = await itemConfigurationClient.getCollectiblesMetadata();
    setCollectiblesMetadata(response);
  };

  useEffect(() => {
    updateCollectiblesMetadata();
  }, []);

  useEffect(() => {
    updatePriceFloorVariables();
  }, []);

  useEffect(() => {
    if (!isFetched) return;
    const hasItemTypeParam =
      queryParams.itemType != null &&
      queryParams.itemType !== '' &&
      !(Array.isArray(queryParams.itemType) && queryParams.itemType.length === 0);
    const hasCategoryParam =
      queryParams.category != null &&
      queryParams.category !== '' &&
      !(Array.isArray(queryParams.category) && queryParams.category.length === 0);

    const updates: {
      itemType?: undefined;
      category?: undefined;
    } = {};
    if (!showItemTypeSelect && hasItemTypeParam) {
      updates.itemType = undefined;
    }
    if (!showCategorySelect && hasCategoryParam) {
      updates.category = undefined;
    }
    if (Object.keys(updates).length > 0) {
      setQueryParamValues(updates, { skipHistory: true });
    }
  }, [
    isFetched,
    showItemTypeSelect,
    showCategorySelect,
    queryParams.itemType,
    queryParams.category,
    setQueryParamValues,
  ]);

  useEffect(() => {
    if (!isFetched) return;
    const limitedInUrl = queryParams.isLimited === 'true' || queryParams.isLimited === '1';
    const iecInUrl = queryParams.isIec === 'true' || queryParams.isIec === '1';

    if (isIec && limitedInUrl) {
      setQueryParamValues({ isLimited: undefined }, { skipHistory: true });
      return;
    }
    if (isLimited && iecInUrl) {
      setQueryParamValues({ isIec: undefined }, { skipHistory: true });
    }
  }, [isFetched, isIec, isLimited, queryParams.isIec, queryParams.isLimited, setQueryParamValues]);

  const isItemBodysuitEligible =
    itemTypeForPriceFloor !== undefined &&
    itemTypeForPriceFloor in Asset &&
    collectiblesMetadata?.bodysuitEligibleAssetTypes?.includes(
      translateAssetType(itemTypeForPriceFloor as Asset),
    );
  const isBodysuit = Boolean(
    parseBoolParam(queryParams.isBodysuit ?? undefined) && isItemBodysuitEligible,
  );

  useEffect(() => {
    if (
      itemTypeForPriceFloor !== undefined &&
      !isItemBodysuitEligible &&
      (queryParams.isBodysuit === 'true' || queryParams.isBodysuit === '1')
    ) {
      setQueryParamValues({ isBodysuit: undefined }, { skipHistory: true });
    }
  }, [itemTypeForPriceFloor, isItemBodysuitEligible, queryParams.isBodysuit, setQueryParamValues]);

  useEffect(() => {
    const fetchPriceFloor = async () => {
      const needsCategory = taxonomyEnabled && !isIec;
      const needsItemType = !needsCategory;

      if (needsCategory && categoryIdForPriceFloor === undefined) {
        setPriceFloor(undefined);
        return;
      }
      if (needsItemType && itemTypeForPriceFloor === undefined) {
        setPriceFloor(undefined);
        return;
      }
      try {
        const assetType =
          itemTypeForPriceFloor !== undefined && itemTypeForPriceFloor in Asset
            ? translateAssetType(itemTypeForPriceFloor as Asset)
            : undefined;
        const bundleType =
          itemTypeForPriceFloor !== undefined &&
          itemTypeForPriceFloor in
            RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum
            ? translateBundleInfoTypeToBundleType(
                itemTypeForPriceFloor as RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
              )
            : undefined;
        const response = await itemConfigurationClient.getPriceFloorFromVariables(
          isLimited
            ? V1ItemsPriceFloorGetCollectibleItemTypeEnum.NUMBER_1
            : V1ItemsPriceFloorGetCollectibleItemTypeEnum.NUMBER_2,
          isIec
            ? V1ItemsPriceFloorGetCreationTypeEnum.NUMBER_2
            : V1ItemsPriceFloorGetCreationTypeEnum.NUMBER_1,
          isPbr,
          isBodysuit,
          assetType,
          bundleType,
          categoryIdForPriceFloor,
        );
        setPriceFloor(response.priceFloor ?? 0);
        setErrorMessage(undefined);
      } catch {
        setPriceFloor(undefined);
        setErrorMessage(translate('Message.FailedToGetPriceFloor'));
      }
    };

    fetchPriceFloor();
  }, [
    translate,
    taxonomyEnabled,
    isIec,
    itemTypeForPriceFloor,
    categoryIdForPriceFloor,
    isBodysuit,
    isLimited,
    isPbr,
  ]);

  if (loadingStatus === LoadingStatus.LOADING) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (loadingStatus === LoadingStatus.FAILED) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
      />
    );
  }

  return (
    <Fragment>
      <div className='margin-bottom-large'>
        <Typography variant='h1'>{translate('Heading.PricingCalculatorTitle')}</Typography>
        <HubMeta title={buildTitle(translate('Heading.PricingCalculatorTitle'))} />
      </div>
      <Grid container>
        {errorMessage ? (
          <Typography color='error'>{errorMessage}</Typography>
        ) : (
          <Grid item container className={robuxAmount}>
            <RobuxIcon className={iconBig} />
            <Typography variant='hero' className={robuxAmountNumber}>
              {(priceFloor ?? 0).toLocaleString()}
            </Typography>
          </Grid>
        )}
      </Grid>
      <Divider className='margin-top-medium margin-bottom-medium' />
      <Grid direction='row'>
        {showItemTypeSelect ? (
          <Select
            size='medium'
            style={{ width: '200px' }}
            className='margin-right-medium margin-top-medium'
            label={translate('Label.ItemType')}
            value={itemType ?? ''}
            onChange={(e) =>
              setQueryParamValues(
                { itemType: (e.target.value as string) || undefined },
                { skipHistory: true },
              )
            }>
            {itemTypes
              .map((type) => ({
                type,
                localizedName: translate(itemTypeStringToLabelKey(type)) || type,
              }))
              .sort((a, b) =>
                a.localizedName.localeCompare(b.localizedName, undefined, { sensitivity: 'base' }),
              )
              .map(({ type, localizedName }) => {
                return (
                  <MenuItem key={type} value={type}>
                    {localizedName}
                  </MenuItem>
                );
              })}
          </Select>
        ) : undefined}
        {showCategorySelect ? (
          <Select
            size='medium'
            style={{ width: '200px' }}
            className='margin-right-medium margin-top-medium'
            label={translate('Label.Category')}
            value={categoryCanonicalName ?? ''}
            onChange={(e) =>
              setQueryParamValues(
                { category: (e.target.value as string) || undefined },
                { skipHistory: true },
              )
            }>
            {categories
              .map((cat) => ({
                name: cat.name!,
                localizedName: getTaxonomyDisplayName(cat.name!, translate),
              }))
              .sort((a, b) =>
                a.localizedName.localeCompare(b.localizedName, undefined, { sensitivity: 'base' }),
              )
              .map(({ name, localizedName }) => {
                return (
                  <MenuItem key={name} value={name}>
                    {localizedName}
                  </MenuItem>
                );
              })}
          </Select>
        ) : undefined}
        <Grid className='margin-top-small'>
          <FormControlLabel
            className='margin-right-medium margin-top-medium'
            control={
              <Checkbox
                checked={isIec}
                disabled={isLimited}
                onClick={() =>
                  setQueryParamValues(
                    isIec ? { isIec: false } : { isIec: true, isLimited: undefined },
                    { skipHistory: true },
                  )
                }
              />
            }
            label={translate('Label.InExperienceCreation')}
          />
          <FormControlLabel
            className='margin-right-medium margin-top-medium'
            control={
              <Checkbox
                checked={isLimited}
                disabled={isIec}
                onClick={() =>
                  setQueryParamValues(
                    isLimited ? { isLimited: false } : { isLimited: true, isIec: undefined },
                    { skipHistory: true },
                  )
                }
              />
            }
            label={translate('Label.Limited')}
          />
          {itemFeatures.includes(
            RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseItemFeaturesEnum.NUMBER_2,
          ) ? (
            <FormControlLabel
              className='margin-right-medium margin-top-medium'
              control={
                <Checkbox
                  checked={isPbr}
                  onClick={() => setQueryParamValues({ isPbr: !isPbr }, { skipHistory: true })}
                />
              }
              label={translate('Label.PBR')}
            />
          ) : undefined}
          {itemFeatures.includes(
            RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseItemFeaturesEnum.NUMBER_1,
          ) ? (
            <FormControlLabel
              className='margin-right-medium margin-top-medium'
              control={
                <Checkbox
                  checked={isBodysuit}
                  onClick={() =>
                    setQueryParamValues({ isBodysuit: !isBodysuit }, { skipHistory: true })
                  }
                />
              }
              label={translate('Label.ClassifiedAsBodysuit')}
              disabled={!isItemBodysuitEligible}
            />
          ) : undefined}
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default withTranslation(PricingCalculator, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Taxonomy,
]);
