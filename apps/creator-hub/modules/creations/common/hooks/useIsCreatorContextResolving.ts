import { useContext } from 'react';
import CreatorContextResolutionContext from '../contexts/CreatorContextResolutionContext';

const useIsCreatorContextResolving = (): boolean =>
  useContext(CreatorContextResolutionContext).isResolving;

export default useIsCreatorContextResolving;
