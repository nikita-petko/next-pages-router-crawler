import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';
import { useMediaQuery } from '@rbx/ui';
import { useRobloxAuthentication } from '@rbx/auth';
import { HistoryProvider } from '@rbx/creator-hub-history';
import useKeyboardNavigation from '../layout/layout/hooks/useKeyboardNavigation';
import { KeyShortcut } from '../layout/layout/utils/keyboardShortcutHandler';
import SearchDialogV2 from './SearchDialogV2';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { warmUpSearchIndex } from '../clients/clientSearch';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { isSearchDisabledPage } from './utils/isSearchDisabledPage';

const SearchContainer: FunctionComponent = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { searchSessionId, searchDialogOpen, toggleSearchDialogOpenWithEvent } =
    useNavigationSearch();
  const { user } = useRobloxAuthentication();
  const { clients, eventLogger } = useSearchConfig();
  const datasetInitialized = useRef(false);
  const lastUserId = useRef<number | null>(null);

  const onKeyboardShortcut = useCallback(
    () =>
      toggleSearchDialogOpenWithEvent({
        interaction: ESearchInteraction.Shortcut,
      }),
    [toggleSearchDialogOpenWithEvent],
  );
  useKeyboardNavigation(KeyShortcut.Search, onKeyboardShortcut);

  // Warm up the search index in the background so the first query is instant.
  // Routes through getMiniSearchInstance which checks in-memory → IndexedDB → full build.
  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (datasetInitialized.current && lastUserId.current === currentUserId) {
      return;
    }

    warmUpSearchIndex(user, clients).catch(() => {
      // Warm-up failed — first search will trigger a fresh build
    });

    datasetInitialized.current = true;
    lastUserId.current = currentUserId;
  }, [user, clients]);

  // Control body overflow when dialog is open (mobile only)
  useEffect(() => {
    if (!isMobile) return undefined;
    if (typeof document === 'undefined') return undefined;

    const { body } = document;
    const originalOverflow = body.style.overflow;

    if (searchDialogOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = originalOverflow || '';
    }

    return () => {
      body.style.overflow = originalOverflow || '';
    };
  }, [isMobile, searchDialogOpen]);

  if (isSearchDisabledPage()) return null;

  return (
    <React.Fragment>
      <HistoryProvider userId={user?.id?.toString()} eventLogger={eventLogger} />
      <SearchDialogV2 open={searchDialogOpen} searchSessionId={searchSessionId} user={user} />
    </React.Fragment>
  );
};

export default SearchContainer;
