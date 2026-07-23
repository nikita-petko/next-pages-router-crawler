import { AllGenresObj, NewGenres } from '@constants/advancedTargeting';
import { GenreOption } from '@type/genreAutocomplete';
import { FormInputObj } from '@type/locationAutocomplete';

export const GenresToDisplay = () => NewGenres.filter((genre) => !genre.deprecated);

export const GetNewGenreValues = ({
  itemsSelectedBeforeInputChange,
  newValues,
}: {
  itemsSelectedBeforeInputChange: GenreOption[];
  newValues: GenreOption[];
}): GenreOption[] => {
  let newValuesToSet: GenreOption[] = newValues;

  const allItemsAlreadySelected: GenreOption | undefined = itemsSelectedBeforeInputChange.find(
    (genreObj: GenreOption) => genreObj.value === AllGenresObj.value,
  );

  const newValuesHaveAllItemsSelected: GenreOption | undefined = newValues.find(
    (genreObj: GenreOption) => genreObj.value === AllGenresObj.value,
  );

  if (newValuesHaveAllItemsSelected && !allItemsAlreadySelected) {
    newValuesToSet = [AllGenresObj];
  }

  if (allItemsAlreadySelected && newValuesHaveAllItemsSelected) {
    newValuesToSet = newValues.filter(
      (genreObj: FormInputObj) => genreObj.value !== AllGenresObj.value,
    );
  }

  const allGenresLength: number = GenresToDisplay().length - 1;
  if (newValues.length === allGenresLength && !newValuesHaveAllItemsSelected) {
    newValuesToSet = [AllGenresObj];
  }
  return newValuesToSet;
};
