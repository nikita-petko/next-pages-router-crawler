import { useContext } from 'react';
import placeDetailsContext from './PlaceDetailsContext';

export default function useCurrentPlace() {
  return useContext(placeDetailsContext);
}
