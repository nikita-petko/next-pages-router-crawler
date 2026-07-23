import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Locale } from '@rbx/intl';
import NavigationSearchContext, {
  NavigationSearchType,
  OpenSearchDialogWithInteractionParams,
  CloseSearchDialogWithInteractionParams,
} from './NavigationSearchContext';
import { ESearchInteraction } from '../../../eventStream/enum/DocsSiteSearch';
import { trackSearchDialogClosed, trackSearchDialogOpened } from '../../../search/searchEvents';
import { useSearchConfig } from '../../../contexts/SearchConfigContext';

interface NavigationSearchProviderProps {
  children: React.ReactNode;
  locale?: Locale;
}

export const NavigationSearchProvider: React.FC<NavigationSearchProviderProps> = ({
  children,
  locale = Locale.English,
}) => {
  const { currentProduct, eventLogger } = useSearchConfig();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchSessionId, setSearchSessionId] = useState(() => uuidv4());

  const setSearchDialogOpenWithEvent = useCallback(
    (params: OpenSearchDialogWithInteractionParams | CloseSearchDialogWithInteractionParams) => {
      const { searchDialogOpen: newState, interaction } = params;

      if (newState && !searchDialogOpen) {
        const newSessionId = uuidv4();
        setSearchSessionId(newSessionId);
        trackSearchDialogOpened({
          eventLogger,
          interaction,
          locale,
          currentProduct,
          searchSessionId: newSessionId,
        });
      } else if (!newState && searchDialogOpen) {
        trackSearchDialogClosed({
          eventLogger,
          interaction,
          locale,
          currentProduct,
          searchSessionId,
        });
      }

      setSearchDialogOpen(newState);
    },
    [searchDialogOpen, searchSessionId, locale, currentProduct, eventLogger],
  );

  const toggleSearchDialogOpenWithEvent = useCallback(
    (params: { interaction: ESearchInteraction.Shortcut }) => {
      if (searchDialogOpen) {
        setSearchDialogOpenWithEvent({
          searchDialogOpen: false,
          interaction: params.interaction,
        });
      } else {
        setSearchDialogOpenWithEvent({
          searchDialogOpen: true,
          interaction: params.interaction,
        });
      }
    },
    [searchDialogOpen, setSearchDialogOpenWithEvent],
  );

  const value = useMemo<NavigationSearchType>(
    () => ({
      searchSessionId,
      searchDialogOpen,
      setSearchDialogOpenWithEvent,
      toggleSearchDialogOpenWithEvent,
    }),
    [
      searchSessionId,
      searchDialogOpen,
      setSearchDialogOpenWithEvent,
      toggleSearchDialogOpenWithEvent,
    ],
  );

  return (
    <NavigationSearchContext.Provider value={value}>{children}</NavigationSearchContext.Provider>
  );
};

export default NavigationSearchProvider;
