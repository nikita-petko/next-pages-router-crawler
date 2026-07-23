import Router from 'next/router';
import { useMemo } from 'react';
import useUniverseId from './useUniverseId';

export enum CommercePathname {
  Commerce = '/dashboard/creations/experiences/[id]/monetization/commerce',
  CreateProducts = '/dashboard/creations/experiences/[id]/monetization/commerce/create-products',
  DraftProducts = '/dashboard/creations/experiences/[id]/monetization/commerce/draft-products',
}

export enum CommerceTab {
  CommerceItems = 'ImportedCatalog',
  CommerceProducts = 'Creations',
}

const useCommerceNavigation = () => {
  const universeId = useUniverseId();

  return useMemo(() => {
    return {
      navigateToCommerce: (tab?: CommerceTab) => {
        const query = tab ? { id: universeId, tab } : { id: universeId };

        Router.push({
          pathname: CommercePathname.Commerce,
          query,
        });
      },
      navigateToCommerceProductsTab: () => {
        Router.push({
          pathname: CommercePathname.Commerce,
          query: { id: universeId, tab: CommerceTab.CommerceProducts },
        });
      },
      navigateToCommerceCreateProducts: () => {
        Router.push({
          pathname: CommercePathname.CreateProducts,
          query: { id: universeId },
        });
      },
      navigateToCommerceDraftProducts: () => {
        Router.push({
          pathname: CommercePathname.DraftProducts,
          query: { id: universeId },
        });
      },
    };
  }, [universeId]);
};

export default useCommerceNavigation;
