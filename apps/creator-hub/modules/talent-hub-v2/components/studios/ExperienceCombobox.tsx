import { useEffect, useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchSortParameter, SortOrder, Surface } from '@rbx/client-universes-api/v1';
import {
  List,
  ListItem,
  Popover,
  PopoverAnchor,
  PopoverContent,
  TextInput,
} from '@rbx/foundation-ui';
import universesClient from '@modules/clients/universes';
import { MOCK_UNIVERSES_FOR_SEARCH } from '../../mocks/mockData';
import { isMocksEnabled } from '../../utils';

const EMPTY_EXCLUDED_IDS: number[] = [];

export interface ExperienceComboboxProps {
  value: number | null;
  displayName?: string;
  onChange: (universeId: number | null) => void;
  excludedIds?: number[];
  placeholder?: string;
  'aria-label'?: string;
}

const DEBOUNCE_MS = 250;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);
  return debounced;
}

export function ExperienceCombobox({
  value,
  displayName,
  onChange,
  excludedIds = EMPTY_EXCLUDED_IDS,
  placeholder = 'Search experiences',
  'aria-label': ariaLabel = 'Search experiences',
}: ExperienceComboboxProps) {
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    setUserDismissed(false);
  }, [debouncedQuery]);

  const { data, isFetching } = useQuery({
    queryKey: ['experience-combobox-search', debouncedQuery],
    queryFn: () => {
      if (isMocksEnabled()) {
        const needle = debouncedQuery.toLowerCase();
        const matches = MOCK_UNIVERSES_FOR_SEARCH.filter(
          (u) => u.name.toLowerCase().includes(needle) || String(u.id).startsWith(debouncedQuery),
        ).slice(0, 10);
        return Promise.resolve({ data: matches });
      }
      return universesClient.searchUniverses({
        search: debouncedQuery,
        pageSize: 10,
        surface: Surface.CreatorHubCreations,
        sortOrder: SortOrder.Desc,
        sortParam: SearchSortParameter.LastUpdated,
      });
    },
    enabled: value === null && debouncedQuery.length >= 2,
  });

  const filteredUniverses = useMemo(() => {
    const rows = data?.data ?? [];
    return rows.filter((u) => u.id != null && !excludedIds.includes(u.id));
  }, [data?.data, excludedIds]);

  const canOpenPopover =
    value === null && debouncedQuery.length >= 2 && (isFetching || filteredUniverses.length > 0);
  const isListOpen = canOpenPopover && !userDismissed;

  if (value !== null) {
    return (
      <TextInput
        aria-label={ariaLabel}
        isDisabled
        placeholder={placeholder}
        readOnly
        value={displayName ?? String(value)}
      />
    );
  }

  return (
    <Popover open={isListOpen} onOpenChange={(next) => setUserDismissed(!next)}>
      <PopoverAnchor asChild>
        <div className='w-full min-w-0'>
          <TextInput
            aria-autocomplete='list'
            aria-controls={isListOpen ? listboxId : undefined}
            aria-expanded={isListOpen}
            aria-haspopup='listbox'
            aria-label={ariaLabel}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={placeholder}
            value={query}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align='start'
        aria-label={ariaLabel}
        className='p-0'
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        side='bottom'
        sideOffset={4}>
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- Foundation List is a ul; listbox is required for combobox pattern */}
        <List as='ul' className='max-h-[260px] overflow-y-auto p-0' id={listboxId} role='listbox'>
          {filteredUniverses.map((u) => (
            <ListItem
              key={u.id}
              divider='None'
              isContained
              title={u.name ?? ''}
              onSelect={() => {
                if (u.id != null) {
                  onChange(u.id);
                  setUserDismissed(true);
                }
              }}
            />
          ))}
        </List>
      </PopoverContent>
    </Popover>
  );
}
