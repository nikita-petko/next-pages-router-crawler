import { createContext } from 'react';
import { PlaceInfo } from '../types/PlaceInfo';

export interface UniversePlacesContextValue {
  placesInfo: PlaceInfo[];
  isPlacesLoading: boolean;
  getPlacesError?: Error | null;
}
const defaultDetails: UniversePlacesContextValue = {
  placesInfo: [],
  isPlacesLoading: false,
  getPlacesError: null,
};

const UniversePlacesContext = createContext<UniversePlacesContextValue>(defaultDetails);

export default UniversePlacesContext;
