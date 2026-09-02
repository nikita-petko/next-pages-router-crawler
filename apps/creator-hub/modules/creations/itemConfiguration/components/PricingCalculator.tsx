import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import {
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  V1ItemsPriceFloorGetCollectibleItemTypeEnum,
  V1ItemsPriceFloorGetCreationTypeEnum,
  V1PermissionsActionAllowedForItemTypeGetActionEnum,
  V1PermissionsActionAllowedForItemTypeGetAssetTypeEnum,
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import { HubMeta, buildTitle } from '@rbx/creator-hub-history';
import {
  Divider,
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  ProgressCircle,
  Checkbox,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import itemConfigurationClient, {
  CategoryDomain,
  type CategoryNode,
} from '@modules/clients/itemconfiguration';
import { Asset } from '@modules/miscellaneous/common';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  getTaxonomyDisplayName,
  itemTypeStringToLabelKey,
  translateAssetType,
  translateBundleInfoTypeToBundleType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';

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

type PricingCalculatorCategory = {
  id: string;
  name: string;
};

function flattenPublishableCategories(nodes: CategoryNode[]): PricingCalculatorCategory[] {
  const result: PricingCalculatorCategory[] = [];

  nodes.forEach((node) => {
    if (node.id && node.name && node.isPublishable === true) {
      result.push({ id: node.id, name: node.name });
    }
    if (node.children?.length) {
      result.push(...flattenPublishableCategories(node.children));
    }
  });

  return result;
}

function parseAllowedItemTypes(
  allowedAssetTypes: string[] | undefined,
  allowedBundleTypes: string[] | undefined,
): string[] {
  const itemTypes: string[] = [];

  allowedAssetTypes?.forEach((assetType) => {
    let parsedAssetType = assetType;

    if (parsedAssetType === 'TshirtAccessory') {
      parsedAssetType = 'TShirtAccessory';
    }

    if (isAssetItemType(parsedAssetType)) {
      itemTypes.push(parsedAssetType);
    }
  });

  allowedBundleTypes?.forEach((bundleType) => {
    if (isBundleInfoBundleType(bundleType)) {
      itemTypes.push(bundleType);
    }
  });

  return itemTypes;
}

const fetchPricingCalculatorOptions = async () => {
  const [categoriesResponse, allowedItemTypesResponse] = await Promise.all([
    itemConfigurationClient.getItemCategories(CategoryDomain.NUMBER_3),
    itemConfigurationClient.getAllowedAssetTypes(
      V1PermissionsItemTypesGetActionEnum.NUMBER_3, // IecCreation
      [
        V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0,
        V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1,
      ],
    ),
  ]);

  const categories = flattenPublishableCategories(categoriesResponse.categories ?? []);
  const itemTypes = parseAllowedItemTypes(
    allowedItemTypesResponse.allowedAssetTypes,
    allowedItemTypesResponse.allowedBundleTypes,
  );

  return { itemTypes, categories };
};

const QUERY_PARAM_KEYS = [
  'itemType',
  'category',
  'isPbr',
  'isEmissive',
  'isLimited',
  'isIec',
] as const;

const parseBoolParam = (v: string | string[] | undefined): boolean => v === 'true' || v === '1';

const PricingCalculator: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const [queryParams, setQueryParamValues] = useQueryParams(QUERY_PARAM_KEYS);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(LoadingStatus.LOADING);
  const [priceFloor, setPriceFloor] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<PricingCalculatorCategory[]>([]);

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
  const { settings } = useSettings();
  const [isEmissivePermitted, setIsEmissivePermitted] = useState(false);
  const isEmissiveEnabled = settings?.enableEmissive && isEmissivePermitted;
  const isEmissive = isEmissiveEnabled && parseBoolParam(queryParams.isEmissive ?? undefined);

  const showCategorySelect = !isIec;
  const showItemTypeSelect = isIec;

  const itemTypeForPriceFloor = showItemTypeSelect ? itemType : undefined;
  const categoryIdForPriceFloor = showCategorySelect ? categoryId : undefined;

  useEffect(() => {
    const loadPricingCalculatorOptions = async () => {
      try {
        const response = await fetchPricingCalculatorOptions();
        setItemTypes(response.itemTypes);
        setCategories(response.categories);
        setLoadingStatus(LoadingStatus.SUCCESS);
      } catch {
        setLoadingStatus(LoadingStatus.FAILED);
      }
    };
    void loadPricingCalculatorOptions();
  }, []);

  useEffect(() => {
    if (!settings?.enableEmissive) {
      return;
    }
    const fetchMetadataPermissions = async () => {
      // Hardcoded to check if the metadata is allowed for a BackAccessory since the categories use taxonomy and not asset/bundle types.
      // Assumes future metadata will be allowed for BackAccessory - if not, this will need to be updated to check for a correct asset/bundle type.
      const response = await itemConfigurationClient.isActionAllowedForItemType(
        V1PermissionsActionAllowedForItemTypeGetActionEnum.NUMBER_6,
        undefined,
        V1PermissionsActionAllowedForItemTypeGetAssetTypeEnum.NUMBER_46,
        undefined,
        true,
      );
      setIsEmissivePermitted(response.metadataPermissions?.EmissiveResult === true);
    };
    void fetchMetadataPermissions();
  }, [settings?.enableEmissive]);

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
          assetType,
          bundleType,
          categoryIdForPriceFloor,
          isEmissive,
        );
        setPriceFloor(response.priceFloor ?? 0);
        setErrorMessage(undefined);
      } catch {
        setPriceFloor(undefined);
        setErrorMessage(translate('Message.FailedToGetPriceFloor'));
      }
    };

    void fetchPriceFloor();
  }, [
    translate,
    isIec,
    itemTypeForPriceFloor,
    categoryIdForPriceFloor,
    isLimited,
    isPbr,
    isEmissive,
  ]);

  if (loadingStatus === LoadingStatus.LOADING) {
    return (
      <div className='flex justify-center padding-y-xlarge'>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          data-testid='loading'
          size='Large'
          variant='Indeterminate'
        />
      </div>
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
    <div className='flex flex-col gap-xlarge'>
      <div className='flex flex-col gap-small'>
        <h1 className='text-heading-large content-emphasis margin-none'>
          {translate('Heading.PricingCalculatorTitle')}
        </h1>
        <HubMeta title={buildTitle(translate('Heading.PricingCalculatorTitle'))} />
      </div>
      {errorMessage ? (
        <p className='text-body-large content-system-alert margin-none' role='alert'>
          {errorMessage}
        </p>
      ) : (
        <div className='flex items-center gap-small margin-top-small'>
          <Icon name='icon-filled-robux' size='XXLarge' aria-hidden />
          <span className='text-display-medium content-emphasis'>
            {(priceFloor ?? 0).toLocaleString()}
          </span>
        </div>
      )}
      <Divider />
      <div className='flex flex-col gap-xxlarge'>
        <div className='flex wrap items-end gap-medium'>
          {showItemTypeSelect ? (
            <Dropdown
              ariaLabel={translate('Label.ItemType')}
              className='[width:240px] max-width-full'
              label={translate('Label.ItemType')}
              onValueChange={(value) =>
                setQueryParamValues({ itemType: value || undefined }, { skipHistory: true })
              }
              placeholder={translate('Label.ItemType')}
              size='Large'
              value={itemType ?? ''}>
              <Menu>
                {itemTypes
                  .map((type) => ({
                    type,
                    localizedName: translate(itemTypeStringToLabelKey(type)) || type,
                  }))
                  .sort((a, b) =>
                    a.localizedName.localeCompare(b.localizedName, undefined, {
                      sensitivity: 'base',
                    }),
                  )
                  .map(({ type, localizedName }) => {
                    return <MenuItem key={type} title={localizedName} value={type} />;
                  })}
              </Menu>
            </Dropdown>
          ) : undefined}
          {showCategorySelect ? (
            <Dropdown
              ariaLabel={translate('Label.Category')}
              className='[width:240px] max-width-full'
              label={translate('Label.Category')}
              onValueChange={(value) =>
                setQueryParamValues({ category: value || undefined }, { skipHistory: true })
              }
              placeholder={translate('Label.Category')}
              size='Large'
              value={categoryCanonicalName ?? ''}>
              <Menu>
                {categories
                  .map((cat) => ({
                    name: cat.name,
                    localizedName: getTaxonomyDisplayName(cat.name, translate),
                  }))
                  .sort((a, b) =>
                    a.localizedName.localeCompare(b.localizedName, undefined, {
                      sensitivity: 'base',
                    }),
                  )
                  .map(({ name, localizedName }) => {
                    return <MenuItem key={name} title={localizedName} value={name} />;
                  })}
              </Menu>
            </Dropdown>
          ) : undefined}
        </div>
        <div className='flex wrap gap-medium'>
          <Checkbox
            isChecked={isIec}
            isDisabled={isLimited}
            label={translate('Label.InExperienceCreation')}
            onCheckedChange={() =>
              setQueryParamValues(
                isIec ? { isIec: false } : { isIec: true, isLimited: undefined },
                { skipHistory: true },
              )
            }
            placement='Start'
            size='Large'
          />
          <Checkbox
            isChecked={isLimited}
            isDisabled={isIec}
            label={translate('Label.Limited')}
            onCheckedChange={() =>
              setQueryParamValues(
                isLimited ? { isLimited: false } : { isLimited: true, isIec: undefined },
                { skipHistory: true },
              )
            }
            placement='Start'
            size='Large'
          />
          <Checkbox
            isChecked={isPbr}
            label={translate('Label.PBR')}
            onCheckedChange={() => setQueryParamValues({ isPbr: !isPbr }, { skipHistory: true })}
            placement='Start'
            size='Large'
          />
          {isEmissiveEnabled && (
            <Checkbox
              isChecked={isEmissive}
              label={translate('Label.Emissive')}
              onCheckedChange={() =>
                setQueryParamValues({ isEmissive: !isEmissive }, { skipHistory: true })
              }
              placement='Start'
              size='Large'
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default withTranslation(PricingCalculator, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Taxonomy,
]);
