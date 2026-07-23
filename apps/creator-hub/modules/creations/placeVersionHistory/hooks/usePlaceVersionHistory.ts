import { useContext } from 'react';
import placeVersionHistoryContext from './PlaceVersionHistoryContext';

export default function useExperienceVersionHistory() {
  return useContext(placeVersionHistoryContext);
}
