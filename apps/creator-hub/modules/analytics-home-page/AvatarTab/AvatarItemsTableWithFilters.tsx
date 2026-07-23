import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
  useRAQIV2TranslationDependencies,
  ExperienceAnalyticsPageFilterBarControl,
  ExportFromTransactionPageButton,
  FilterBarConfig,
  avatarFilterDimensions,
  useApiRequest,
  useNonRAQIAnalyticsCurrentFilterBundle,
  NonRAQIUIDimension,
} from '@modules/experience-analytics-shared';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AvatarItemsTableContent from '@modules/avatar-analytics/components/AvatarItemsTableContent';
import {
  FormatAvatarItemSalesTypeRaw,
  FormatAvatarItemTypeRaw,
} from '@modules/avatar-analytics/components/AvatarItemTypeTranslationKeys';
import { translationKey } from '@modules/analytics-translations';
import {
  AllAvatarItemSalesTypesOption,
  AllAvatarItemTypesOption,
  AvatarItemSalesType,
  AvatarItemType,
  SupportedAvatarItemSalesTypeFilterOrder,
  SupportedAvatarItemTypeFilterOrder,
  developerAnalyticsAggregationsClient,
} from '@modules/clients/analytics';

const AvatarItemsTableWithFilters: FunctionComponent = () => {
  const { translate } = useRAQIV2TranslationDependencies();

  const { filters, onFiltersChange } =
    useNonRAQIAnalyticsCurrentFilterBundle(avatarFilterDimensions);

  // NOTE(shumingxu, 04/10/2024): We want to hide limited filter temporarily due to the migration to collectibleItems.
  const fetchHideAvatarItemLimitedFilterEnabled = useCallback(async () => {
    const response =
      await developerAnalyticsAggregationsClient.getfeaturePermissionsGetFeatureFlags({
        flags: ['hideAvatarItemLimitedFilterEnabled'],
      });
    return response.flags.hideAvatarItemLimitedFilterEnabled;
  }, []);
  const { data: hideAvatarItemLimitedFilterEnabled, isDataLoading } = useApiRequest(
    fetchHideAvatarItemLimitedFilterEnabled,
  );
  const showLimitedFilterBar = useMemo(
    // only show when we are certain that the flag is off
    () => !isDataLoading && !hideAvatarItemLimitedFilterEnabled,
    [hideAvatarItemLimitedFilterEnabled, isDataLoading],
  );

  const filterBarConfig: FilterBarConfig = useMemo(() => {
    const filterConfigs: FilterBarConfig = [
      {
        type: 'single',
        dimension: NonRAQIUIDimension.AvatarItemCategory,
        dimensionNameKey: translationKey(
          'Label.Dimension.AvatarItemCategory',
          TranslationNamespace.AvatarAnalytics,
        ),
        options: SupportedAvatarItemTypeFilterOrder,
        blankOption: AllAvatarItemTypesOption,
        renderOption: (opt: AvatarItemType | typeof AllAvatarItemTypesOption) => {
          return translate(FormatAvatarItemTypeRaw(opt));
        },
      },
    ];

    if (showLimitedFilterBar) {
      filterConfigs.push({
        type: 'single',
        dimension: NonRAQIUIDimension.SalesType,
        dimensionNameKey: translationKey(
          'Label.Dimension.SalesType',
          TranslationNamespace.AvatarAnalytics,
        ),
        options: SupportedAvatarItemSalesTypeFilterOrder,
        blankOption: AllAvatarItemSalesTypesOption,
        renderOption: (opt: AvatarItemSalesType | typeof AllAvatarItemSalesTypesOption) => {
          return translate(FormatAvatarItemSalesTypeRaw(opt));
        },
      });
    }

    return filterConfigs;
  }, [showLimitedFilterBar, translate]);

  return (
    <Grid container direction='column'>
      <Grid item>
        <Grid container justifyContent='space-between' direction='row' alignItems='center'>
          <Grid item>
            <Grid container justifyContent='flex-start' direction='row' spacing={2}>
              <ExperienceAnalyticsPageFilterBarControl
                config={filterBarConfig}
                filters={filters}
                onFiltersChange={onFiltersChange}
                showIconWithText={false}
              />
            </Grid>
          </Grid>
          <Grid item>
            <ExportFromTransactionPageButton />
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <AvatarItemsTableContent showLimitedFilterBar={showLimitedFilterBar} />
      </Grid>
    </Grid>
  );
};

export default AvatarItemsTableWithFilters;
