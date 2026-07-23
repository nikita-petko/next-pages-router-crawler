import { VirtualEventDetails } from '@modules/clients';
import { createContext } from 'react';

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
