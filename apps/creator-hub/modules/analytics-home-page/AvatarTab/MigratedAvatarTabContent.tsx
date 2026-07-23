import { translationKey } from '@modules/analytics-translations';
import { formatSingleDate, useLocale } from '@modules/charts-generic';
import {
  useAnalyticsCurrentDateRangeBundle,
  useAnalyticsOwnerOverride,
  useOwner,
  useRAQIV2TranslationDependencies,
  CreatorAnalyticsLayout,
  CreatorResourceProvider,
  AvatarItemNamesMapProvider,
} from '@modules/experience-analytics-shared';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import React, { FunctionComponent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AvatarItemTargetType } from '@modules/clients/analytics';
import { catalogClient } from '@modules/clients';
import { EmptyGrid } from '@modules/miscellaneous/common';
import {
  RobloxCatalogApiMultigetItemDetailsRequestItem,
  RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum,
} from '@rbx/clients/catalogApi/v1';
import { useSettings } from '@modules/settings';
import {
  buildAvatarItemPageConfig,
  AvatarItemDetailsClient,
  keyToString,
  ParsedAvatarItemKey,
  CatalogItemDetailsMap,
} from './buildAvatarItemPageConfig';

type MigratedAvatarTabContentSpec = {
  forceNonStickyControlBar?: boolean;
};

const getCatalogItemDetailsMap = async (
  request: RobloxCatalogApiMultigetItemDetailsRequestItem[],
): Promise<CatalogItemDetailsMap> => {
  const res = await catalogClient.postItemDetails(request);
  const catalogItemDetailsMap: CatalogItemDetailsMap = new Map();
  res?.data?.forEach((element) => {
    if (!element.id) return;
    const itemKey: ParsedAvatarItemKey = {
      itemId: element.id,
      targetType: element.bundleType ? AvatarItemTargetType.Bundle : AvatarItemTargetType.AssetItem,
    };
    catalogItemDetailsMap.set(keyToString(itemKey), {
      name: element.name ?? '',
      taxonomy: element.taxonomy?.at(0)?.taxonomyName ?? '',
      assetType: element.assetType,
      bundleType: element.bundleType,
      itemCreatedUtc: element.itemCreatedUtc ? new Date(element.itemCreatedUtc) : new Date(0),
    });
  });
  return catalogItemDetailsMap;
};

const MigratedAvatarTabContent: FunctionComponent<MigratedAvatarTabContentSpec> = () => {
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
