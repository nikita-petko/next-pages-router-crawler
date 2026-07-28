import { useContext } from 'react';
import UniversePlacesContext from '../providers/UniversePlacesContext';

export default function useUniversePlaces() {
  return useContext(UniversePlacesContext);
}
