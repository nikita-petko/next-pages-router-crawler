import { createContext } from 'react';
import type { VirtualEventDetails } from '@modules/clients/virtualEvents';

type TEventContext = {
  isLoading: boolean;
  eventDetails: VirtualEventDetails | null;
  refreshEventDetails: () => Promise<void>;
};

const eventContext = createContext<TEventContext>({
  isLoading: false,
  eventDetails: null,
  refreshEventDetails: () => {
    throw new Error('Cannot refresh event details prior to fetching for the first time');
  },
});

export default eventContext;
