import { HTMLAttributes } from 'react';

import useAdvancedTargetingGenreAutocompleteStyles from '@components/campaignBuilder/targeting/AdvancedTargetingGenreAutocomplete.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { GenreOption } from '@type/genreAutocomplete';

type GenreSelectionAutocompleteRowProps = HTMLAttributes<HTMLLIElement> & {
  genreOption: GenreOption;
  key: string;
};

const GenreSelectionAutocompleteRow = ({
  genreOption,
  ...props
}: GenreSelectionAutocompleteRowProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      autocompleteListboxOption,
      expandedGenresRow,
      sectionDescription,
      sectionExpansionContainer,
      sectionTitleContainer,
    },
  } = useAdvancedTargetingGenreAutocompleteStyles();

  return (
    <li className={autocompleteListboxOption} {...props}>
      <div className={sectionExpansionContainer}>
        <div className={sectionTitleContainer}>
          <div>{translate(genreOption.title)}</div>
        </div>
        <div className={expandedGenresRow} key={genreOption.value}>
          <span className={`text-body-large ${sectionDescription}`}>
            {genreOption.description ? translate(genreOption.description) : ''}
          </span>
        </div>
      </div>
    </li>
  );
};

export default GenreSelectionAutocompleteRow;
