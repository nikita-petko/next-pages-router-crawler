import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RobloxCatalogApiMultigetItemDetailsRequestItem } from '@rbx/client-catalog/v1';
import { RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum } from '@rbx/client-catalog/v1';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import useLocale from '@modules/charts-generic/context/useLocale';
import { AvatarItemTargetType } from '@modules/clients/analytics';
import catalogClient from '@modules/clients/catalog';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useAnalyticsOwnerOverride } from '@modules/experience-analytics-shared/context/AnalyticsOwnerOverrideProvider';
import { AvatarItemNamesMapProvider } from '@modules/experience-analytics-shared/context/AvatarItemNamesMapProvider';
import { CreatorResourceProvider } from '@modules/experience-analytics-shared/context/resourceContexts/CreatorResourceProvider';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type {
  AvatarItemDetailsClient,
  ParsedAvatarItemKey,
  CatalogItemDetailsMap,
} from './buildAvatarItemPageConfig';
import { buildAvatarItemPageConfig, keyToString } from './buildAvatarItemPageConfig';

// Catalog API returns BundleType per the canonical bundles_service.proto
// (Body=1, AvatarAnimations=2, Shoes=3, DynamicHead=4). DAA emits, and
// AvatarItemType encodes, BundlesGatewayService.proto values
// (Body=1, DynamicHead=2, Shoes=3, AvatarAnimations=4). Translate at this
// boundary so CatalogItemDetailsMap.bundleType matches the AvatarItemType
// convention used downstream.
const catalogBundleTypeToAvatarItemTypeBundleValue: Record<number, number> = {
  1: 1, // Body
  2: 4, // AvatarAnimations
  3: 3, // Shoes
  4: 2, // DynamicHead
};

const getCatalogItemDetailsMap = async (
  request: RobloxCatalogApiMultigetItemDetailsRequestItem[],
): Promise<CatalogItemDetailsMap> => {
  const res = await catalogClient.postItemDetails(request);
  const catalogItemDetailsMap: CatalogItemDetailsMap = new Map();
  res?.data?.forEach((element) => {
    if (!element.id) {
      return;
    }
    const itemKey: ParsedAvatarItemKey = {
      itemId: element.id,
      targetType: element.bundleType ? AvatarItemTargetType.Bundle : AvatarItemTargetType.AssetItem,
    };
    const translatedBundleType =
      element.bundleType !== undefined
        ? (catalogBundleTypeToAvatarItemTypeBundleValue[element.bundleType] ?? element.bundleType)
        : undefined;
    catalogItemDetailsMap.set(keyToString(itemKey), {
      name: element.name ?? '',
      taxonomy: element.taxonomy?.at(0)?.taxonomyName ?? '',
      assetType: element.assetType,
      bundleType: translatedBundleType,
      itemCreatedUtc: element.itemCreatedUtc ? new Date(element.itemCreatedUtc) : new Date(0),
    });
  });
  return catalogItemDetailsMap;
};

const MigratedAvatarTabContent: FunctionComponent = () => {
  const locale = useLocale();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { translate } = useRAQIV2TranslationDependencies();
  const owner = useOwner();
  const ownerOverride = useAnalyticsOwnerOverride();
  const queryClient = useQueryClient();
  const { settings, isFetched } = useSettings();

  const [avatarItemNamesMap, setAvatarItemNamesMap] = useState<Map<string, string>>(new Map());

  const dateDescriptionElement = useMemo(
    () => (
      <Typography variant='body1' data-testid='date-description'>
        {translate(
          translationKey('Description.DataFromDateRange', TranslationNamespace.Analytics),
          {
            startDate: formatSingleDate(locale, startDate),
            endDate: formatSingleDate(locale, endDate),
          },
        )}
      </Typography>
    ),
    [translate, locale, startDate, endDate],
  );

  // Create the client for fetching avatar item details with caching
  const avatarItemDetailsClient: AvatarItemDetailsClient = useMemo(() => {
    const getCachedItemDetails = async (
      assetIds: number[],
      bundleIds: number[],
    ): Promise<CatalogItemDetailsMap> => {
      const normalizedAssetIds = Array.from(new Set(assetIds)).sort((a, b) => a - b);
      const normalizedBundleIds = Array.from(new Set(bundleIds)).sort((a, b) => a - b);
      const request: RobloxCatalogApiMultigetItemDetailsRequestItem[] = assetIds
        .map(
          (id) =>
            ({
              itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_1,
              id,
            }) as RobloxCatalogApiMultigetItemDetailsRequestItem,
        )
        .concat(
          bundleIds.map(
            (id) =>
              ({
                itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_2,
                id,
              }) as RobloxCatalogApiMultigetItemDetailsRequestItem,
          ),
        );
      const res = await queryClient.ensureQueryData({
        queryKey: ['catalog', 'getItemDetails', normalizedAssetIds, normalizedBundleIds],
        queryFn: () => getCatalogItemDetailsMap(request),
        staleTime: 60_000,
      });

      const newMap = new Map<string, string>();
      res.forEach((value, key) => {
        const itemId = key.split('_')[1];
        if (itemId) {
          newMap.set(itemId, value.name);
        }
      });
      setAvatarItemNamesMap(newMap);

      return res;
    };

    return { getCachedItemDetails };
  }, [queryClient, setAvatarItemNamesMap]);

  const pageConfig = useMemo(() => {
    if (!isFetched || !owner?.isFetched) {
      return undefined;
    }
    return buildAvatarItemPageConfig(
      owner,
      dateDescriptionElement,
      translate,
      avatarItemDetailsClient,
      settings?.showTaxonomyOnAvatarItemAnalyticsTab,
      undefined,
      ownerOverride,
    );
  }, [
    owner,
    dateDescriptionElement,
    translate,
    avatarItemDetailsClient,
    isFetched,
    settings?.showTaxonomyOnAvatarItemAnalyticsTab,
    ownerOverride,
  ]);

  if (pageConfig === undefined) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  return (
    <CreatorResourceProvider>
      <AvatarItemNamesMapProvider initialMap={avatarItemNamesMap}>
        <Grid container direction='column'>
          <CreatorAnalyticsLayout config={pageConfig} />
        </Grid>
      </AvatarItemNamesMapProvider>
    </CreatorResourceProvider>
  );
};

export default withTranslation(MigratedAvatarTabContent, [
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
]);
