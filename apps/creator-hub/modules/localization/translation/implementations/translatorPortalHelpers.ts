import { CreationData } from '@modules/creations/common';
import { TranslatorPortalPagingParameters } from '../container/TranslatorPortalContainer';
import TranslatorGamesSortingOptions from '../enums/TranslatorGamesSortingOptions';

export function alphabaticalSort(game1: CreationData, game2: CreationData): number {
  if (typeof game1.name !== 'undefined' && typeof game2.name !== 'undefined') {
    if (game1.name < game2.name) {
      return -1;
    }
    if (game1.name > game2.name) {
      return 1;
    }
  }
  return 0;
}

export const TranslatorSortingMap: {
  [key in TranslatorGamesSortingOptions]: (game1: CreationData, game2: CreationData) => number;
} = {
  [TranslatorGamesSortingOptions.Alphabetical]: alphabaticalSort,
};

export function formatTranslatorGames(
  data: CreationData[] | null,
  parameters: TranslatorPortalPagingParameters,
): CreationData[] {
  let resultData: CreationData[] = [];
  if (data) {
    resultData = data
      .filter((gameInfo) =>
        gameInfo.name?.toLowerCase().includes(parameters.searchKeyword.toLowerCase()),
      )
      .sort((game1, game2) => {
        const sortingFn = TranslatorSortingMap[parameters.sortingOption];
        return sortingFn(game1, game2);
      });
  }
  return resultData;
}
