// Provides an accessible revenue share recipient search input and partitions matching users and groups for selection.
import { useCallback, useId, useMemo, type ChangeEvent, type FunctionComponent } from 'react';
import { TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RevShareRecipientType,
  type RevShareRecipientSearchResult,
} from '../interface/RevShareViewModel';
import { getRevShareRecipientKey } from '../utils/revShareUtils';
import RevShareRecipientResults from './RevShareRecipientResults';

const EMPTY_EXCLUDED_RECIPIENT_KEYS: ReadonlySet<string> = new Set<string>();

export const filterSelectableRecipientSearchResults = (
  results: readonly RevShareRecipientSearchResult[],
  excludedRecipientKeys: ReadonlySet<string> = EMPTY_EXCLUDED_RECIPIENT_KEYS,
): RevShareRecipientSearchResult[] => {
  const resultKeys = new Set<string>();
  return results.filter((result) => {
    const key = getRevShareRecipientKey(result);
    if (excludedRecipientKeys.has(key) || resultKeys.has(key)) {
      return false;
    }
    resultKeys.add(key);
    return true;
  });
};

type RevShareRecipientSearchProps = {
  query: string;
  results: readonly RevShareRecipientSearchResult[];
  excludedRecipientKeys?: ReadonlySet<string>;
  onQueryChange: (query: string) => void;
  onSelect: (value: RevShareRecipientSearchResult) => void;
  isLoading?: boolean;
  hasError?: boolean;
  placeholder?: string;
};

const RevShareRecipientSearch: FunctionComponent<RevShareRecipientSearchProps> = ({
  query,
  results,
  excludedRecipientKeys = EMPTY_EXCLUDED_RECIPIENT_KEYS,
  onQueryChange,
  onSelect,
  isLoading = false,
  hasError = false,
  placeholder,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const resultsId = useId();
  const translatedPlaceholder =
    placeholder ??
    tPendingTranslation(
      'Search users or groups',
      'Placeholder for the revenue share recipient search input.',
      translationKey('Label.SearchRecipients', TranslationNamespace.RevenueShareAgreements),
    );
  const selectableResults = useMemo(
    () => filterSelectableRecipientSearchResults(results, excludedRecipientKeys),
    [excludedRecipientKeys, results],
  );
  const { users, groups } = useMemo(
    () => ({
      users: selectableResults.filter((result) => result.type === RevShareRecipientType.User),
      groups: selectableResults.filter((result) => result.type === RevShareRecipientType.Group),
    }),
    [selectableResults],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.currentTarget.value);
    },
    [onQueryChange],
  );

  return (
    <div className='flex flex-col gap-medium width-full'>
      <TextInput
        type='search'
        aria-label={translatedPlaceholder}
        aria-controls={resultsId}
        aria-expanded={query.trim() !== ''}
        size='Medium'
        placeholder={translatedPlaceholder}
        value={query}
        onChange={handleChange}
        aria-invalid={hasError}
      />
      {query.trim() !== '' && (
        <RevShareRecipientResults
          id={resultsId}
          users={users}
          groups={groups}
          isLoading={isLoading}
          hasError={hasError}
          onSelect={onSelect}
        />
      )}
    </div>
  );
};

export default RevShareRecipientSearch;
