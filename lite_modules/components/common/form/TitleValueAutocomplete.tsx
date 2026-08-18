import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';
import { useEffect, useState } from 'react';

type TitleValueOption = {
  title: string;
  value: number | string;
};

interface TitleValueAutocompleteProps<TOption extends TitleValueOption> {
  dataTestId?: string;
  /** Rendered below the input and forces the error styling. Takes precedence over `helperText`. */
  errorMessage?: string;
  helperText?: string;
  label: string;
  onBlur?: () => void;
  /** Emits the whole option so callers keep working with their own option shape. */
  onChange: (option: TOption) => void;
  options: TOption[];
  value: TOption;
}

/**
 * Single-select autocomplete over `{ title, value }` options.
 *
 * Foundation's Autocomplete speaks in strings and renders exactly the children it is
 * given, so this wrapper owns the object/string mapping, the option filtering MUI used
 * to do internally, and reverting the text on blur so typing without picking an option
 * cannot leave the field showing something that was never selected.
 */
const TitleValueAutocomplete = <TOption extends TitleValueOption>({
  dataTestId,
  errorMessage,
  helperText,
  label,
  onBlur,
  onChange,
  options,
  value,
}: TitleValueAutocompleteProps<TOption>) => {
  const [inputValue, setInputValue] = useState<string>(value.title);

  // Depend on the primitive fields rather than the object so selections made
  // elsewhere (form reset, prefill) sync without refiring on every new identity.
  useEffect(() => {
    setInputValue(value.title);
  }, [value.value, value.title]);

  const query = inputValue.trim().toLocaleLowerCase();
  const visibleOptions =
    !query || query === value.title.toLocaleLowerCase()
      ? options
      : options.filter((option) => option.title.toLocaleLowerCase().includes(query));

  const handleValueChange = (nextValue: string | undefined) => {
    const nextOption = options.find((option) => String(option.value) === nextValue);
    if (!nextOption) {
      return;
    }
    onChange(nextOption);
    setInputValue(nextOption.title);
  };

  const handleBlur = () => {
    setInputValue(value.title);
    onBlur?.();
  };

  return (
    <Autocomplete
      data-testid={dataTestId}
      error={errorMessage}
      hasError={Boolean(errorMessage)}
      helperText={helperText}
      inputValue={inputValue}
      label={label}
      onBlur={handleBlur}
      onInputValueChange={setInputValue}
      onValueChange={handleValueChange}
      size='Medium'
      value={String(value.value)}>
      {visibleOptions.map((option) => (
        <AutocompleteOption key={option.value} title={option.title} value={String(option.value)} />
      ))}
    </Autocomplete>
  );
};

export default TitleValueAutocomplete;
