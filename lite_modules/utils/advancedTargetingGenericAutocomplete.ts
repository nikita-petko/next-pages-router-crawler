import { GenericAutocompleteOption } from '@type/advancedTargeting';

export const GetNewSelectedOptions = ({
  availableOptions,
  newSelectedOptions,
  selectedOptions,
}: {
  availableOptions: GenericAutocompleteOption[];
  newSelectedOptions: GenericAutocompleteOption[];
  selectedOptions: GenericAutocompleteOption[];
}) => {
  if (
    selectedOptions.length === 1 &&
    selectedOptions[0].isAll &&
    newSelectedOptions.length > 1 &&
    newSelectedOptions.some((option) => option.isAll)
  ) {
    // If "All" is selected and any other option is selected, remove "All"
    return newSelectedOptions.filter((option) => !option.isAll);
  }
  if (
    // All options except "All"
    newSelectedOptions.length >= availableOptions.length - 1 ||
    newSelectedOptions.some((option) => option.isAll)
  ) {
    return availableOptions.filter((option) => option.isAll);
  }
  return newSelectedOptions;
};
