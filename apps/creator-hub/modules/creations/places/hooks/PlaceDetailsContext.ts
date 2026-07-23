import type { ReactNode } from 'react';
import { createContext } from 'react';
import type { DevelopAssetDetailsResponse } from '@modules/clients/develop';

export interface PlaceDetailsContextValue {
  placeDetails?: DevelopAssetDetailsResponse;
  refreshPlaceDetails: () => Promise<void>;
  canConfigurePlace: boolean;
  containingUniverse: number;
  isPlaceLoading: boolean;
  placeIcon?: ReactNode;
  refreshPlaceIcon: () => Promise<void>;
}
const defaultDetails: PlaceDetailsContextValue = {
  placeDetails: undefined,
  refreshPlaceDetails: () => Promise.reject(new Error('not implemented')),
  canConfigurePlace: false,
  containingUniverse: 0,
  isPlaceLoading: false,
  placeIcon: undefined,
  refreshPlaceIcon: () => Promise.reject(new Error('not implemented')),
};

const placeDetailsContext = createContext<PlaceDetailsContextValue>(defaultDetails);
placeDetailsContext.displayName = 'PlaceDetails';

export default placeDetailsContext;
