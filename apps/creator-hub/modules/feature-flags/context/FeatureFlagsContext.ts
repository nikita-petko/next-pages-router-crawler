import { createContext } from 'react';
import { FeatureFlagNamespace } from '../namespaces';
import { TFlag } from '../types';

type TFeatureFlagsContext = Partial<{
  [Namespace in FeatureFlagNamespace]: {
    flags: Partial<Record<TFlag<Namespace>, boolean>>;
    isFetched: boolean;
  };
}>;

const FeatureFlagsContext = createContext<TFeatureFlagsContext>({});

export default FeatureFlagsContext;
