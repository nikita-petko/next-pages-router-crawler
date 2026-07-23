import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import type {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiModelsResponseCategory,
  RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseAssetTypesEnum,
  RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseBundleTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import {
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  V1ItemsPriceFloorGetCollectibleItemTypeEnum,
  V1ItemsPriceFloorGetCreationTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
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
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import { translateBundleType } from '../../avatarItem/utils/loadAvatarItemsUtils';
import {
  getTaxonomyDisplayName,
  itemTypeStringToLabelKey,
  translateAssetType,
  translateAssetTypeToAsset,
  translateBundleInfoTypeToBundleType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import usePricingCalculatorStyles from './PricingCalculator.styles';

function isAssetItemType(value: string): value is Asset {
  return Object.values(Asset).some((assetValue) => {
    const assetAsString: string = assetValue;
    return assetAsString === value;
  });
}

function isBundleInfoBundleType(
  value: string,
): value is RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum {
  return Object.values(RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum).some(
    (bundleValue) => {
      const bundleAsString: string = bundleValue;
      return bundleAsString === value;
    },
  );
}

enum LoadingStatus {
  LOADING = 0,
  FAILED = 1,
  SUCCESS = 2,
}

const assetTypeEnumToString = (
  assetType: RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseAssetTypesEnum,
): string | undefined => {
  return translateAssetTypeToAsset(
    assetType as RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  );
};

const bundleTypeEnumToString = (
  bundleType: RobloxItemConfigurationApiModelsResponseGetPriceFloorVariablesResponseBundleTypesEnum,
): string => {
  return translateBundleType(bundleType as BundleType) as string;
};

const fetchPriceFloorVariables = async () => {
  const response = await itemConfigurationClient.getPriceFloorVariables();

  const assetTypeLabels = (response.assetTypes ?? [])
    .map(assetTypeEnumToString)
    .filter((label): label is Asset => label !== undefined);
  const bundleTypes = (response.bundleTypes ?? []).map(bundleTypeEnumToString);

  const itemTypes = bundleTypes.concat(assetTypeLabels);

  const categories = response.categories ?? [];

  return { itemTypes, categories };
};

const QUERY_PARAM_KEYS = ['itemType', 'category', 'isPbr', 'isLimited', 'isIec'] as const;

const parseBoolParam = (v: string | string[] | undefined): boolean => v === 'true' || v === '1';

const PricingCalculator: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const {
    classes: { robuxAmount, robuxAmountNumber, iconBig },
  } = usePricingCalculatorStyles();
  const [queryParams, setQueryParamValues] = useQueryParams(QUERY_PARAM_KEYS);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.LOADING);
  const [priceFloor, setPriceFloor] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<RobloxItemConfigurationApiModelsResponseCategory[]>(
    [],
  );

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

  const showCategorySelect = !isIec;
  const showItemTypeSelect = isIec;

  const itemTypeForPriceFloor = showItemTypeSelect ? itemType : undefined;
  const categoryIdForPriceFloor = showCategorySelect ? categoryId : undefined;

  const updatePriceFloorVariables = async () => {
    try {
      const response = await fetchPriceFloorVariables();
      setItemTypes(response.itemTypes);
      setCategories(response.categories);
      setLoadingStatus(LoadingStatus.SUCCESS);
    } catch {
      setLoadingStatus(LoadingStatus.FAILED);
    }
  };

  useEffect(() => {
    void updatePriceFloorVariables();
  }, []);

  useEffect(() => {
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
    showItemTypeSelect,
    showCategorySelect,
    queryParams.itemType,
    queryParams.category,
    setQueryParamValues,
  ]);

  useEffect(() => {
    const limitedInUrl = queryParams.isLimited === 'true' || queryParams.isLimited === '1';
    const iecInUrl = queryParams.isIec === 'true' || queryParams.isIec === '1';

    if (isIec && limitedInUrl) {
      setQueryParamValues({ isLimited: undefined }, { skipHistory: true });
      return;
    }
    if (isLimited && iecInUrl) {
      setQueryParamValues({ isIec: undefined }, { skipHistory: true });
    }
  }, [isIec, isLimited, queryParams.isIec, queryParams.isLimited, setQueryParamValues]);

  useEffect(() => {
    const fetchPriceFloor = async () => {
      const needsCategory = !isIec;
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
          itemTypeForPriceFloor !== undefined && isAssetItemType(itemTypeForPriceFloor)
            ? translateAssetType(itemTypeForPriceFloor)
            : undefined;
        const bundleType =
          itemTypeForPriceFloor !== undefined && isBundleInfoBundleType(itemTypeForPriceFloor)
            ? translateBundleInfoTypeToBundleType(itemTypeForPriceFloor)
            : undefined;
        const response = await itemConfigurationClient.getPriceFloorFromVariables(
          isLimited
            ? V1ItemsPriceFloorGetCollectibleItemTypeEnum.NUMBER_1
            : V1ItemsPriceFloorGetCollectibleItemTypeEnum.NUMBER_2,
          isIec
            ? V1ItemsPriceFloorGetCreationTypeEnum.NUMBER_2
            : V1ItemsPriceFloorGetCreationTypeEnum.NUMBER_1,
          isPbr,
          false,
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

    void fetchPriceFloor();
  }, [translate, isIec, itemTypeForPriceFloor, categoryIdForPriceFloor, isLimited, isPbr]);

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
    <>
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
              setQueryParamValues({ itemType: e.target.value || undefined }, { skipHistory: true })
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
              setQueryParamValues({ category: e.target.value || undefined }, { skipHistory: true })
            }>
            {categories
              .filter(
                (cat): cat is RobloxItemConfigurationApiModelsResponseCategory & { name: string } =>
                  cat.name != null && cat.name !== '',
              )
              .map((cat) => ({
                name: cat.name,
                localizedName: getTaxonomyDisplayName(cat.name, translate),
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
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(PricingCalculator, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Taxonomy,
]);
