import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useDevelopmentItemsInventoryTranslations = () => {
  const intl = useTranslation();
  const { translate } = intl;
  const { tPendingTranslation } = useTranslationWrapper(intl);

  const clearFilter = useCallback(
    (filterLabel: string) =>
      tPendingTranslation(
        'Clear {filterLabel}',
        'Accessible label for removing an active Development Items filter chip.',
        translationKey('Action.DevelopmentItems.ClearFilter', TranslationNamespace.Creations),
        { filterLabel },
      ),
    [tPendingTranslation],
  );
  const inventorySourceFilter = useCallback(
    (source: string) =>
      tPendingTranslation(
        'Source: {source}',
        'Active filter chip describing the selected Development Items source.',
        translationKey(
          'Label.DevelopmentItems.InventorySourceFilter',
          TranslationNamespace.Creations,
        ),
        { source },
      ),
    [tPendingTranslation],
  );
  const searchSuggestion = useCallback(
    (query: string, assetType: string) =>
      tPendingTranslation(
        '{query} in {assetType}',
        'Scoped-search suggestion that searches for a query within a Development Items asset type.',
        translationKey('Label.DevelopmentItems.SearchSuggestion', TranslationNamespace.Creations),
        { assetType, query },
      ),
    [tPendingTranslation],
  );

  return {
    actions: tPendingTranslation(
      'Actions',
      'Development Items table column and accessible label for item actions.',
      translationKey('Label.DevelopmentItems.Actions', TranslationNamespace.Creations),
    ),
    acquiredFromStore: translate('Label.CreatorStore'),
    allSources: tPendingTranslation(
      'Any',
      'Source filter option that includes every Development Items source.',
      translationKey('Label.DevelopmentItems.AllSources', TranslationNamespace.Creations),
    ),
    assetId: translate('Label.AssetID'),
    assetType: tPendingTranslation(
      'Asset type',
      'Label for the Development Items asset type filter and table column.',
      translationKey('Label.DevelopmentItems.AssetType', TranslationNamespace.Creations),
    ),
    clearFilter,
    clearSearch: tPendingTranslation(
      'Clear search',
      'Accessible label and action for clearing the Development Items search query.',
      translationKey('Action.DevelopmentItems.ClearSearch', TranslationNamespace.Creations),
    ),
    filterBy: translate('Label.FilterBy'),
    firstPage: tPendingTranslation(
      'First page',
      'Accessible label for the Development Items pagination first-page button.',
      translationKey('Action.DevelopmentItems.FirstPage', TranslationNamespace.Creations),
    ),
    grid: tPendingTranslation(
      'Grid',
      'Accessible label for the Development Items grid view.',
      translationKey('Label.DevelopmentItems.GridView', TranslationNamespace.Creations),
    ),
    inventorySource: tPendingTranslation(
      'Source',
      'Label for the Development Items source filter and table column.',
      translationKey('Label.DevelopmentItems.InventorySource', TranslationNamespace.Creations),
    ),
    inventorySourceFilter,
    lastPage: tPendingTranslation(
      'Last page',
      'Accessible label for the Development Items pagination last-page button.',
      translationKey('Action.DevelopmentItems.LastPage', TranslationNamespace.Creations),
    ),
    lastUpdated: translate('Label.LastUpdated'),
    list: tPendingTranslation(
      'List',
      'Accessible label for the Development Items list view.',
      translationKey('Label.DevelopmentItems.ListView', TranslationNamespace.Creations),
    ),
    loading: translate('Label.Loading'),
    name: translate('Label.Name'),
    nextPage: tPendingTranslation(
      'Next page',
      'Accessible label for the Development Items pagination next-page button.',
      translationKey('Action.DevelopmentItems.NextPage', TranslationNamespace.Creations),
    ),
    noItemsDescription: tPendingTranslation(
      'Try another search or filter.',
      'Guidance shown when no Development Items match the current query and filters.',
      translationKey('Description.DevelopmentItems.NoItemsFound', TranslationNamespace.Creations),
    ),
    noItems: tPendingTranslation(
      'No items found',
      'Heading shown when no Development Items match the current query and filters.',
      translationKey('Heading.DevelopmentItems.NoItemsFound', TranslationNamespace.Creations),
    ),
    previousPage: tPendingTranslation(
      'Previous page',
      'Accessible label for the Development Items pagination previous-page button.',
      translationKey('Action.DevelopmentItems.PreviousPage', TranslationNamespace.Creations),
    ),
    retry: translate('Action.Retry'),
    rowsPerPage: translate('Label.RowsPerPage'),
    search: translate('Label.Search'),
    searchSuggestion,
    searchWithinAssetType: tPendingTranslation(
      'Search within asset type',
      'Accessible label for Development Items scoped-search suggestions.',
      translationKey(
        'Label.DevelopmentItems.SearchWithinAssetType',
        TranslationNamespace.Creations,
      ),
    ),
    sharedWithMe: tPendingTranslation(
      'Shared With Me',
      'Source filter option for Development Items shared with the current creator.',
      translationKey('Label.DevelopmentItems.SharedWithMe', TranslationNamespace.Creations),
    ),
    unavailableDescription: tPendingTranslation(
      'Try again in a moment.',
      'Guidance shown when the Development Items inventory cannot be loaded.',
      translationKey(
        'Description.DevelopmentItems.InventoryUnavailable',
        TranslationNamespace.Creations,
      ),
    ),
    unavailable: tPendingTranslation(
      'Inventory is unavailable',
      'Heading shown when the Development Items inventory cannot be loaded.',
      translationKey(
        'Heading.DevelopmentItems.InventoryUnavailable',
        TranslationNamespace.Creations,
      ),
    ),
    viewSelector: tPendingTranslation(
      'Choose grid or list view',
      'Accessible label for the Development Items view selector.',
      translationKey('Label.DevelopmentItems.ViewSelector', TranslationNamespace.Creations),
    ),
    uploadedByMe: tPendingTranslation(
      'Uploaded',
      'Source filter option for Development Items uploaded by the current creator.',
      translationKey('Label.DevelopmentItems.UploadedByMe', TranslationNamespace.Creations),
    ),
  };
};

export default useDevelopmentItemsInventoryTranslations;
