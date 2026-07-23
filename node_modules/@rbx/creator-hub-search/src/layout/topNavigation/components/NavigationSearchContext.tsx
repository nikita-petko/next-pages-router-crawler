import { createContext, Dispatch, SetStateAction, useContext } from 'react';
import type { ESearchInteraction } from '../../../eventStream/enum/DocsSiteSearch';
import type {
  TDialogClosedInteraction,
  TDialogOpenedInteraction,
} from '../../../search/searchEvents';
import { trackSearchDialogClosed, trackSearchDialogOpened } from '../../../search/searchEvents';

// TODO: lhoward (2025/08/18): add interaction tracking to trackSearchDialogOpened
export type OpenSearchDialogWithInteractionParams = {
  searchDialogOpen: true;
  interaction: TDialogOpenedInteraction;
};

// TODO: lhoward (2025/08/18): add interaction tracking to trackSearchDialogClosed
export type CloseSearchDialogWithInteractionParams = {
  searchDialogOpen: false;
  interaction: TDialogClosedInteraction;
};

export type NavigationSearchType = {
  searchSessionId: string;
  searchDialogOpen: boolean;
  setSearchDialogOpenWithEvent: (
    params: OpenSearchDialogWithInteractionParams | CloseSearchDialogWithInteractionParams,
  ) => void;
  toggleSearchDialogOpenWithEvent: (params: { interaction: ESearchInteraction.Shortcut }) => void;
};

const NavigationSearchContext = createContext<NavigationSearchType>({
  searchSessionId: 'uninitialized',
  searchDialogOpen: false,
  setSearchDialogOpenWithEvent: () => {
    throw new Error('Not implemented');
  },
  toggleSearchDialogOpenWithEvent: () => {
    throw new Error('Not implemented');
  },
});
NavigationSearchContext.displayName = 'NavigationSearch';

export const useSearchSessionId = () => {
  const { searchSessionId } = useContext(NavigationSearchContext);
  return searchSessionId;
};

export default NavigationSearchContext;
