import { useCallback, useMemo, useState } from 'react';
import type { IPContent } from '@rbx/client-rights/v1';
import { Autocomplete, AutocompleteOption } from '@rbx/foundation-ui';

interface KeywordSelectorProps {
  keywords: IPContent[];
  currentKeyword?: IPContent;
  onChange: (keyword: IPContent | undefined) => void;
  placeholder: string;
  disabled?: boolean;
}

const KeywordSelector = ({
  keywords,
  currentKeyword,
  onChange,
  placeholder,
  disabled = false,
}: KeywordSelectorProps) => {
  const keywordById = useMemo(
    () => new Map(keywords.map((keyword) => [keyword.id, keyword])),
    [keywords],
  );

  const selectedKeywordId = currentKeyword?.id ?? '';
  const selectedLabel = currentKeyword?.contentValue ?? '';

  // Local draft while typing; ignored once selectedKeywordId changes.
  const [draftInput, setDraftInput] = useState<{
    selectedKeywordId: string;
    value: string;
  } | null>(null);

  const inputValue =
    draftInput?.selectedKeywordId === selectedKeywordId ? draftInput.value : selectedLabel;

  const filteredKeywords = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) {
      return keywords;
    }
    return keywords.filter((keyword) => (keyword.contentValue ?? '').toLowerCase().includes(query));
  }, [keywords, inputValue]);

  const handleInputValueChange = useCallback(
    (value: string) => {
      const selectedKeyword = keywordById.get(value);
      const nextInputValue = selectedKeyword?.contentValue ?? value;
      setDraftInput({ selectedKeywordId, value: nextInputValue });

      if (!nextInputValue) {
        onChange(undefined);
      }
    },
    [keywordById, onChange, selectedKeywordId],
  );

  const handleValueChange = useCallback(
    (value: string | undefined) => {
      setDraftInput(null);
      onChange(value ? keywordById.get(value) : undefined);
    },
    [keywordById, onChange],
  );

  return (
    <div>
      <Autocomplete
        size='Large'
        placeholder={placeholder}
        isDisabled={disabled}
        value={currentKeyword?.id}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        onValueChange={handleValueChange}>
        {filteredKeywords.map((keyword) => (
          <AutocompleteOption
            key={keyword.id}
            value={keyword.id ?? ''}
            title={keyword.contentValue ?? ''}
          />
        ))}
      </Autocomplete>
    </div>
  );
};

export default KeywordSelector;
