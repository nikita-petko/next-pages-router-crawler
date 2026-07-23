import Router from 'next/router';
import React, { useCallback, useEffect } from 'react';
import { IconButton, SearchIcon } from '@rbx/ui';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import useSearchTooltipVisibility from './hooks/useSearchTooltipVisibility';
import SearchTooltip from './SearchTooltip';
import { isSearchDisabledPage } from './utils/isSearchDisabledPage';

/**
 * HubSearchIcon component - a button that opens the search dialog.
 * Displays a one-time announcement tooltip on the homepage for users
 * who haven't seen it yet. The tooltip is dismissed on any click,
 * when the search dialog opens, or when the user navigates away.
 */
export default function HubSearchIcon() {
  const { searchDialogOpen, setSearchDialogOpenWithEvent } = useNavigationSearch();
  const { visible: tooltipVisible, dismiss: dismissTooltip } = useSearchTooltipVisibility();

  useEffect(() => {
    if (searchDialogOpen && tooltipVisible) {
      dismissTooltip();
    }
  }, [searchDialogOpen, tooltipVisible, dismissTooltip]);

  useEffect(() => {
    if (!tooltipVisible) {
      return undefined;
    }

    Router.events.on('routeChangeStart', dismissTooltip);
    return () => {
      Router.events.off('routeChangeStart', dismissTooltip);
    };
  }, [tooltipVisible, dismissTooltip]);

  const onSearchClick = useCallback(() => {
    dismissTooltip();
    setSearchDialogOpenWithEvent({
      searchDialogOpen: true,
      interaction: ESearchInteraction.NavSearchIcon,
    });
  }, [setSearchDialogOpenWithEvent, dismissTooltip]);

  if (isSearchDisabledPage()) {
    return null;
  }

  return (
    <SearchTooltip open={tooltipVisible} onDismiss={dismissTooltip}>
      <IconButton color='secondary' aria-label='Search' onClick={onSearchClick}>
        <SearchIcon />
      </IconButton>
    </SearchTooltip>
  );
}
