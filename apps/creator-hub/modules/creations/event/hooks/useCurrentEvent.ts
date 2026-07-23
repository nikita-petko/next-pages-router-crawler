import { useContext } from 'react';
import eventContext from '../EventContext';

export default function useCurrentEvent() {
  return useContext(eventContext);
}
