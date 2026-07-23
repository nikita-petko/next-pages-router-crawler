import { useTranslation } from '@rbx/intl';
import { useMemo } from 'react';
import GenreType from '../enums/GenreType';
import genreToSubgenre from '../constants/taxonomy';
import getTranslationKey from '../utils/translationUtils';

export default function useExperienceGenres() {
  const { translate } = useTranslation();

  const subgenreToGenre = useMemo(() => {
    const startArr: string[][] = [];
    return Object.fromEntries(
      Object.entries(genreToSubgenre).reduce((arr, [genre, subgenres]) => {
        const flattened = subgenres.map((subgenre) => [subgenre, genre]);
        return arr.concat(flattened);
      }, startArr),
    );
  }, []);

  const genreToLocalization = useMemo(
    () =>
      Object.fromEntries(
        Object.values(GenreType).map((genre) => [genre, translate(getTranslationKey(genre))]),
      ),
    [translate],
  );

  return { genreToSubgenre, subgenreToGenre, genreToLocalization };
}
