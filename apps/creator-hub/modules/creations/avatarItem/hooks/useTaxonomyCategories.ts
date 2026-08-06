import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import itemConfigurationApi, { CategoryDomain } from '@modules/clients/itemconfiguration';
import { Asset } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { getAvatarItemsEntryPointAssetTypes } from '../../menu/constants/MenuConstants';
import {
  buildTaxonomyL1Options,
  transformCreatorDashboardTree,
} from '../utils/taxonomyCategoriesUtils';

export const getTaxonomyCategoriesQueryKey = (categoryDomain: CategoryDomain) =>
  ['getTaxonomyCategories', categoryDomain] as const;

export const getAvatarItemsEntryPointAssetTypesQueryKey = () =>
  ['getAvatarItemsEntryPointAssetTypes'] as const;

/**
 * Fetches the taxonomy category tree for the Creator Dashboard domain and derives the normalized L1
 * categories + chip options. Applies the CreatorDashboard transform (gear/publishable filter, makeup
 * + backgrounds gating, Classics lift), so consumers get a display-ready hierarchy.
 */
const useTaxonomyCategories = (enabled = true) => {
  const { settings } = useSettings();

  const query = useQuery({
    queryKey: getTaxonomyCategoriesQueryKey(CategoryDomain.NUMBER_3),
    queryFn: () => itemConfigurationApi.getItemCategories(CategoryDomain.NUMBER_3),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Backgrounds and Makeup are restricted to the creators the marketplace allows them for, which is
  // what limits them to the trusted creator program. The legacy sub-tabs require this on top of
  // their setting, so the chip row has to as well or the categories leak to everyone. Makeup follows
  // publish access and Backgrounds follows upload access; see getAvatarItemsEntryPointAssetTypes.
  const allowedQuery = useQuery({
    queryKey: getAvatarItemsEntryPointAssetTypesQueryKey(),
    queryFn: getAvatarItemsEntryPointAssetTypes,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const allowedAssetTypes = allowedQuery.data;

  const transformOptions = useMemo(
    () => ({
      // A pending or failed lookup denies access: revealing the chip first and removing it once the
      // answer arrives would briefly offer a category the creator cannot use.
      enableMakeupAssets:
        settings.enableMakeupAssets && (allowedAssetTypes?.has(Asset.EyeMakeup) ?? false),
      enableAvatarBackgrounds:
        settings.enableAvatarBackgrounds &&
        (allowedAssetTypes?.has(Asset.AvatarBackground) ?? false),
    }),
    [settings.enableMakeupAssets, settings.enableAvatarBackgrounds, allowedAssetTypes],
  );

  const categories = useMemo(
    () => transformCreatorDashboardTree(query.data, transformOptions),
    [query.data, transformOptions],
  );

  const l1Options = useMemo(() => buildTaxonomyL1Options(categories), [categories]);

  return {
    response: query.data,
    categories,
    l1Options,
    // Both queries gate the visible category set, so the chip row must not resolve a selection until
    // the allow list is known.
    isLoading: query.isLoading || allowedQuery.isLoading,
    isError: query.isError,
  };
};

export default useTaxonomyCategories;
