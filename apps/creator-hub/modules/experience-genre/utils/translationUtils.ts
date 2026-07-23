import GenreType from '../enums/GenreType';

// This function converts GenreType enums into pascal case, then prefixes with
// "Label." to get the translation key as defined in Translation Hub. This
// relies on the fact that the GenreType enums are snakecase and that
// Translation Hub keys are in pascal case and Labels.
export default function getTranslationKey(genre: GenreType) {
  if (genre === GenreType.NA) {
    return 'Label.NA'; // Backend expects GenreType.NA to be 'na' but translation key should be Label.NA
  }
  const camelCase = genre
    .toLowerCase()
    .replaceAll(/([_][a-z])/g, (group) => group.toUpperCase().replace('_', ''));
  const pascalCase = camelCase[0].toUpperCase() + camelCase.slice(1);
  const translationKey = `Label.${pascalCase}`;
  return translationKey;
}
