import { useContext } from 'react';
import type { CommerceProviderState } from '@modules/commerce/context/CommerceProvider';
import { CommerceContext } from '@modules/commerce/context/CommerceProvider';

const useCommerce = (): CommerceProviderState => {
  const commerceContext = useContext(CommerceContext) as CommerceProviderState;
  if (!commerceContext) {
    throw new Error('useCommerce must be used within a CommerceProvider');
  }

  return commerceContext;
};

export default useCommerce;
