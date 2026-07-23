import targetApiClient from '../clients/targetPartApiClient';
import TargetPartNames from '../enums/TargetPartNames';
import type TargetPartConfiguration from '../interfaces/TargetPartConfiguration';

const targetPartConfiguration: { [key: string]: TargetPartConfiguration } = {
  [TargetPartNames.Universe]: {
    getTargets: targetApiClient.getUniverses,
    getTargetById: targetApiClient.getUniverse,
    translationKeys: {
      autoCompleteKeys: {
        loadingTextKey: 'Message.UniverseLoadingText',
        searchPlaceholder: 'Message.UniverseSearchPlaceholder',
        errorKey: 'Message.UniverseSearchError',
      },
      selectKeys: {
        selectPlaceholder: 'Message.SelectUniverse',
      },
    },
    loadCount: 25,
  },
  [TargetPartNames.Datastore]: {
    getTargets: targetApiClient.getDatastores,
    translationKeys: {
      gridKeys: {
        initLoadTextByLoadCount: 'Label.LoadingInitialDatastores',
        noResultsTextKey: 'Message.NoDatastoreSearchResults',
        searchPlaceholder: 'Message.PlaceholderSearchDatastore',
        errorKey: 'Message.ErrorLoadingDatastores',
        addGridItemKey: 'Action.AddDatastore',
        openGridPromptKey: 'Action.AddDatastoreToList',
      },
    },
    loadCount: 5,
  },
};

export default targetPartConfiguration;
