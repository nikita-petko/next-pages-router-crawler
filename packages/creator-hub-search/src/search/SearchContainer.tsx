import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect } from 'react';
import { useRobloxAuthentication } from '@rbx/auth';
import { HistoryProvider } from '@rbx/creator-hub-history';
import { useMediaQuery } from '@rbx/ui';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import useKeyboardNavigation from '../layout/layout/hooks/useKeyboardNavigation';
import { KeyShortcut } from '../layout/layout/utils/keyboardShortcutHandler';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import SearchDialogV2 from './SearchDialogV2';
import { isSearchDisabledPage } from './utils/isSearchDisabledPage';

const SearchContainer: FunctionComponent = () => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { searchSessionId, searchDialogOpen, toggleSearchDialogOpenWithEvent } =
    useNavigationSearch();
  const { user } = useRobloxAuthentication();
  const { eventLogger } = useSearchConfig();

  const onKeyboardShortcut = useCallback(
    () =>
      toggleSearchDialogOpenWithEvent({
        interaction: ESearchInteraction.Shortcut,
      }),
    [toggleSearchDialogOpenWithEvent],
  );
  useKeyboardNavigation(KeyShortcut.Search, onKeyboardShortcut);

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }
    if (typeof document === 'undefined') {
      return undefined;
    }

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

  if (isSearchDisabledPage()) {
    return null;
  }

  return (
    <>
      <HistoryProvider userId={user?.id?.toString()} eventLogger={eventLogger} />
      <SearchDialogV2 open={searchDialogOpen} searchSessionId={searchSessionId} />
    </>
  );
};

export default SearchContainer;
