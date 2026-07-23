import { useQuery, UseQueryResult } from '@tanstack/react-query';
import React, {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import commerceApiClient, { BundlingEligibilityRecourse } from '@modules/clients/commerce';
import type {
  CommerceEligibilityStatus,
  CommerceItemModel,
  CommerceProductModel,
} from '@modules/clients/commerce';
import {
  CommerceGrantableModel,
  CreateCommerceGrantableRequest,
  InventoryType,
  MerchantType,
  OwnerType,
  ProductStatusType,
} from '@rbx/clients/commerceApi/v1';
import { Merchant } from '../configs/merchantConfigs';
import useUniverseId from '../hooks/useUniverseId';
import useLatest from '../hooks/useLatest';
import isBaselineEligible from '../utils/isBaselineEligible';
import useExperienceOwner from '../hooks/useExperienceOwner';

// Client methods (call commerce APIs with the current universe ID and update the state)
interface CommerceProviderStateMethods {
  listCommerceItems: (
    merchantType: MerchantType,
    ownerType: OwnerType,
    cursor: string | undefined,
    limit: number,
  ) => Promise<void>;
  listCommerceItemsV2: (
    ownerType: OwnerType,
    ownerId: string,
    merchantType: MerchantType,
    cursor: string | undefined,
    limit: number,
  ) => Promise<void>;
  listCommerceProducts: (cursor: string | undefined, limit: number) => Promise<void>;
  refreshCommerceProducts: () => Promise<void>;
  fetchCommerceProductsWithoutUpdate: () => Promise<CommerceProductModel[]>;
  createCommerceItem: (merchantType: Merchant, merchantItemId: string) => Promise<void>;
  createCommerceProduct: (
    commerceItemId: string,
    commerceGrantables: Array<CreateCommerceGrantableRequest>,
    initialStatus?: ProductStatusType,
  ) => Promise<void>;
  archiveCommerceItem: (commerceItemId: string) => Promise<void>;
  archiveCommerceProduct: (commerceProductId: string) => Promise<void>;
  updateCommerceProductDraft: (
    commerceProductId: string,
    newGrantables: Array<CommerceGrantableModel>,
  ) => Promise<void>;
  updateCommerceProductStatus: (
    commerceProductId: string,
    newStatus: ProductStatusType,
  ) => Promise<void>;
  createCommerceProductBundlingFee: (
    commerceProductId: string,
    quantity: number,
    inventoryType: InventoryType,
  ) => Promise<void>;
  acceptCommerceProductBundlingFee: (commerceProductId: string) => Promise<void>;
  applyForCreatorBundlingEligibility: () => Promise<void>;
}

export interface CommerceProviderState extends CommerceProviderStateMethods {
  // Data
  commerceItems: CommerceItemModel[];
  catalogSelectedCommerceItemIds: string[];
  setCatalogSelectedCommerceItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  commerceProducts: CommerceProductModel[];
  // Loading states
  isLoadingCommerceItems: boolean;
  isLoadingCommerceProducts: boolean;
  // Error states
  commerceItemsError: Error | null;
  commerceProductsError: Error | null;
  createCommerceProductError: string | null;
  setCommerceCreateProductError: React.Dispatch<React.SetStateAction<string | null>>;
  // Permissions checks
  isLoadingPermissions: boolean;
  isShopifyEnabled: boolean;
  isAmazonEnabled: boolean;
  areVirtualBenefitsEnabled: boolean;
  isProductSaleEnabled: boolean;
  isAnalyticsEnabled: boolean;
  fetchCommerceEligibilityQuery: UseQueryResult<CommerceEligibilityStatus, Error>;
  eligibilityStatus?: CommerceEligibilityStatus;
}

interface CommerceProviderProps {
  defaultPageCount: number;
}

const copyRecordWithItemsAdded = <T extends { id: string }>(
  record: Record<string, T>,
  items: T[],
): Record<string, T> => {
  return {
    ...record,
    ...Object.fromEntries(items.map((item) => [item.id, item])),
  };
};

const copyRecordWithItemsRemoved = <T extends { id: string }>(
  record: Record<string, T>,
  itemIds: string[],
): Record<string, T> => {
  const itemIdsToRemove = new Set(itemIds);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !itemIdsToRemove.has(key)));
};

export const CommerceContext = createContext<CommerceProviderState | null>(null);

const CommerceProvider: FunctionComponent<PropsWithChildren<CommerceProviderProps>> = ({
  defaultPageCount,
  children,
}) => {
  const universeId = useUniverseId();
  const {
    ownerType: experienceOwnerType,
    ownerId: experienceOwnerId,
    userId,
  } = useExperienceOwner();

  const [commerceItems, setCommerceItems] = useState<Record<string, CommerceItemModel>>({});
  const [commerceProducts, setCommerceProducts] = useState<Record<string, CommerceProductModel>>(
    {},
  );
  const [catalogSelectedCommerceItemIds, setCatalogSelectedCommerceItemIds] = useState<string[]>(
    [],
  );
  const [isLoadingCommerceItems, setIsLoadingCommerceItems] = useState(false);
  const [isLoadingCommerceProducts, setIsLoadingCommerceProducts] = useState(false);
  const [commerceItemsError, setCommerceItemsError] = useState<Error | null>(null);
  const [commerceProductsError, setCommerceProductsError] = useState<Error | null>(null);
  const [createCommerceProductError, setCommerceCreateProductError] = useState<string | null>(null);

  // The Page not found page is shown only when isLoadingPermissions is false and isShopifyEnabled and isAmazonEnabled are both false
  // If the page mounts with isLoadingPermissions as false, the page will show the Page not found page for a brief moment before the permissions are fetched
  // Which is why isLoadingPermissions is set to true by default before being set to false after fetching the permissions
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isShopifyEnabled, setIsShopifyEnabled] = useState(false);
  const [isAmazonEnabled, setIsAmazonEnabled] = useState(false);
  const [isProductSaleEnabled, setIsProductSaleEnabled] = useState(false);
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false);

  const listCommerceItems = useCallback(
    async (
      merchantType: MerchantType,
      ownerType: OwnerType,
      cursor: string | undefined,
      limit?: number,
    ) => {
      setIsLoadingCommerceItems(true);
      setCommerceItemsError(null);
      try {
        const response = await commerceApiClient.listCommerceItems(
          universeId,
          merchantType,
          ownerType,
          cursor,
          limit,
        );
        setCommerceItems((prevCommerceItems) =>
          copyRecordWithItemsAdded(prevCommerceItems, response.commerceItems),
        );
      } catch (error: unknown) {
        setCommerceItemsError(error as Error);
      } finally {
        setIsLoadingCommerceItems(false);
      }
    },
    [universeId],
  );

  const listCommerceItemsV2 = useCallback(
    async (
      ownerType: OwnerType,
      ownerId: string,
      merchantType: MerchantType,
      cursor: string | undefined,
      limit?: number,
    ) => {
      setIsLoadingCommerceItems(true);
      setCommerceItemsError(null);
      try {
        const response = await commerceApiClient.listCommerceItemsV2(
          ownerType,
          ownerId,
          merchantType,
          cursor,
          limit,
        );
        setCommerceItems((prevCommerceItems) =>
          copyRecordWithItemsAdded(prevCommerceItems, response.commerceItems),
        );
      } catch (error: unknown) {
        setCommerceItemsError(error as Error);
      } finally {
        setIsLoadingCommerceItems(false);
      }
    },
    [],
  );

  const listCommerceProducts = useCallback(
    async (cursor: string | undefined, limit?: number) => {
      setIsLoadingCommerceProducts(true);
      setCommerceProductsError(null);
      try {
        const response = await commerceApiClient.listCommerceProducts(universeId, cursor, limit);
        setCommerceProducts((prevCommerceProducts) =>
          copyRecordWithItemsAdded(prevCommerceProducts, response.commerceProducts),
        );
      } catch (error: unknown) {
        setCommerceProductsError(error as Error);
      } finally {
        setIsLoadingCommerceProducts(false);
      }
    },
    [universeId],
  );

  // TODO(SUBS-3117): if we want to properly handle pagination, we need to track whether items were loaded from list API

  const createCommerceItem = useCallback(
    async (merchantType: Merchant, merchantItemId: string) => {
      const response = await commerceApiClient.createCommerceItem(
        universeId,
        merchantType,
        merchantItemId,
      );
      setCommerceItems((prevCommerceItems) =>
        copyRecordWithItemsAdded(prevCommerceItems, [response.commerceItem]),
      );
    },
    [universeId],
  );

  const createCommerceProduct = useCallback(
    async (
      commerceItemId: string,
      commerceGrantables: Array<CreateCommerceGrantableRequest>,
      initialStatus?: ProductStatusType,
    ) => {
      const response = await commerceApiClient.createCommerceProduct(
        universeId,
        commerceItemId,
        commerceGrantables,
        initialStatus,
      );
      setCommerceProducts((prevCommerceProducts) =>
        copyRecordWithItemsAdded(prevCommerceProducts, [response.commerceProduct]),
      );
    },
    [universeId],
  );

  const archiveCommerceItem = useCallback(
    async (commerceItemId: string) => {
      await commerceApiClient.archiveCommerceItem(universeId, commerceItemId);
      setCommerceItems((prevCommerceItems) =>
        copyRecordWithItemsRemoved(prevCommerceItems, [commerceItemId]),
      );
    },
    [universeId],
  );

  const archiveCommerceProduct = useCallback(
    async (commerceProductId: string) => {
      await commerceApiClient.archiveCommerceProduct(universeId, commerceProductId);
      setCommerceProducts((prevCommerceProducts) =>
        copyRecordWithItemsRemoved(prevCommerceProducts, [commerceProductId]),
      );
    },
    [universeId],
  );

  const updateCommerceProductDraft = useCallback(
    async (commerceProductId: string, newGrantables: Array<CommerceGrantableModel>) => {
      await commerceApiClient.updateDraftCommerceProduct(
        universeId,
        commerceProductId,
        newGrantables,
      );
      // This would work better if we have an API to just fetch this commerce product instead of everything.
      const newProducts = await commerceApiClient.listCommerceProducts(
        universeId,
        undefined,
        defaultPageCount,
      );
      setCommerceProducts((prevCommerceProducts) => {
        return Object.fromEntries(
          Object.entries(prevCommerceProducts).map(([key, product]) => {
            const updatedProduct =
              commerceProductId === product.id
                ? (newProducts.commerceProducts.find((p) => p.id === commerceProductId) ?? product)
                : product;
            return [key, updatedProduct];
          }),
        );
      });
    },
    [defaultPageCount, universeId],
  );

  const updateCommerceProductStatus = useCallback(
    async (commerceProductId: string, newStatus: ProductStatusType) => {
      await commerceApiClient.updateCommerceProductStatus(universeId, commerceProductId, newStatus);
      setCommerceProducts((prevCommerceProducts) =>
        Object.fromEntries(
          Object.entries(prevCommerceProducts).map(([key, product]) => {
            const updatedProduct =
              commerceProductId === product.id ? { ...product, status: newStatus } : product;
            return [key, updatedProduct];
          }),
        ),
      );
    },
    [universeId],
  );

  const createCommerceProductBundlingFee = useCallback(
    async (commerceProductId: string, quantity: number, inventoryType: InventoryType) => {
      await commerceApiClient.createCommerceProductBundlingFee(
        universeId,
        commerceProductId,
        quantity,
        inventoryType,
      );
    },
    [universeId],
  );

  const acceptCommerceProductBundlingFee = useCallback(
    async (commerceProductId: string) => {
      await commerceApiClient.acceptCommerceProductBundlingFee(universeId, commerceProductId);
    },
    [universeId],
  );

  const applyForCreatorBundlingEligibility = useCallback(async () => {
    await commerceApiClient.applyForCreatorBundlingEligibility(universeId);
  }, [universeId]);

  const refreshCommerceProducts = useCallback(async () => {
    setIsLoadingCommerceProducts(true);
    setCommerceProductsError(null);
    try {
      const response = await commerceApiClient.listCommerceProducts(
        universeId,
        undefined,
        defaultPageCount,
      );
      setCommerceProducts(copyRecordWithItemsAdded({}, response.commerceProducts));
    } catch (error: unknown) {
      setCommerceProductsError(error as Error);
    } finally {
      setIsLoadingCommerceProducts(false);
    }
  }, [defaultPageCount, universeId]);

  const fetchCommerceProductsWithoutUpdate = useCallback(async () => {
    const response = await commerceApiClient.listCommerceProducts(
      universeId,
      undefined,
      defaultPageCount,
    );
    return response.commerceProducts;
  }, [defaultPageCount, universeId]);

  // Get Commerce Experience Configuration on mount/refresh
  useEffect(() => {
    const fetchCommerceExperienceConfiguration = async (experienceId: number) => {
      setIsLoadingPermissions(true);
      try {
        const response = await commerceApiClient.getCommerceExperienceConfiguration(experienceId);
        setIsShopifyEnabled(response.isShopifyEnabled);
        setIsAmazonEnabled(response.isAmazonEnabled);
        setIsProductSaleEnabled(response.isProductSaleEnabled);
        setIsAnalyticsEnabled(response.isAnalyticsEnabled);
      } catch {
        setIsShopifyEnabled(false);
        setIsAmazonEnabled(false);
        setIsProductSaleEnabled(false);
        setIsAnalyticsEnabled(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchCommerceExperienceConfiguration(universeId);
  }, [universeId]);

  let eligibilityStatus: CommerceEligibilityStatus | undefined;
  const fetchCommerceEligibilityQuery = useQuery({
    queryKey: ['commerce-eligibility', universeId],
    queryFn: () => {
      return commerceApiClient.getCommerceEligibilityStatus(universeId);
    },
    refetchOnWindowFocus: () =>
      !isBaselineEligible(eligibilityStatus?.baselineEligibility) ? 'always' : false,
  });
  eligibilityStatus = useLatest(
    fetchCommerceEligibilityQuery.data,
    () => !!fetchCommerceEligibilityQuery.data,
  );

  const commerceItemsList = useMemo(() => Object.values(commerceItems), [commerceItems]);
  const commerceProductsList = useMemo(() => Object.values(commerceProducts), [commerceProducts]);

  // Fetch Amazon and Shopify commerce items on mount
  useEffect(() => {
    // Initial fetch should handle both Amazon and Shopify
    const listInitialCommerceItems = async () => {
      setIsLoadingCommerceItems(true);
      setCommerceItemsError(null);
      try {
        const promises = [];

        if (userId) {
          promises.push(
            commerceApiClient.listCommerceItemsV2(
              OwnerType.User,
              userId.toString(),
              MerchantType.Shopify,
              undefined,
              defaultPageCount,
            ),
          );
        }

        if (
          experienceOwnerType.toLowerCase() === OwnerType.Group.toLowerCase() &&
          experienceOwnerId
        ) {
          promises.push(
            commerceApiClient.listCommerceItemsV2(
              OwnerType.Group,
              experienceOwnerId.toString(),
              MerchantType.Shopify,
              undefined,
              defaultPageCount,
            ),
          );
        }

        promises.push(
          commerceApiClient.listCommerceItemsV2(
            OwnerType.Experience,
            universeId.toString(),
            MerchantType.Amazon,
            undefined,
            defaultPageCount,
          ),
        );

        const responses = await Promise.all(promises);
        setCommerceItems((prevCommerceItems) =>
          copyRecordWithItemsAdded(
            prevCommerceItems,
            responses.map((response) => response.commerceItems).flat(),
          ),
        );
      } catch (error: unknown) {
        setCommerceItemsError(error as Error);
      } finally {
        setIsLoadingCommerceItems(false);
      }
    };
    listInitialCommerceItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only want to run when ownerType, ownerId, or userId change
  }, [experienceOwnerType, experienceOwnerId, userId]);

  // Fetch commerce products on mount
  useEffect(() => {
    listCommerceProducts(undefined, defaultPageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only want to run on mount
  }, []);

  // Determine if eligible to enable virtual benefits
  const areVirtualBenefitsEnabled = useMemo(() => {
    const recourses = eligibilityStatus?.bundlingEligibility.recourses;
    const isOnlyInvoicingInfoRecourse =
      recourses?.length === 1 && recourses.includes(BundlingEligibilityRecourse.InvoicingInfo);
    const isBundlingEligible = eligibilityStatus?.bundlingEligibility.isEligible;

    // Enable if the only recourse is InvoicingInfo or if bundling eligible
    return isOnlyInvoicingInfoRecourse || !!isBundlingEligible;
  }, [eligibilityStatus]);

  const providerState: CommerceProviderState = useMemo(
    () => ({
      isLoadingCommerceItems,
      isLoadingCommerceProducts,
      commerceItemsError,
      commerceProductsError,
      catalogSelectedCommerceItemIds,
      setCatalogSelectedCommerceItemIds,
      commerceItems: commerceItemsList,
      commerceProducts: commerceProductsList,
      isLoadingPermissions,
      isShopifyEnabled,
      isAmazonEnabled,
      areVirtualBenefitsEnabled,
      isProductSaleEnabled,
      isAnalyticsEnabled,
      listCommerceItems,
      listCommerceItemsV2,
      listCommerceProducts,
      refreshCommerceProducts,
      fetchCommerceProductsWithoutUpdate,
      createCommerceItem,
      createCommerceProduct,
      archiveCommerceItem,
      archiveCommerceProduct,
      updateCommerceProductDraft,
      updateCommerceProductStatus,
      createCommerceProductBundlingFee,
      acceptCommerceProductBundlingFee,
      applyForCreatorBundlingEligibility,
      createCommerceProductError,
      setCommerceCreateProductError,
      fetchCommerceEligibilityQuery,
      eligibilityStatus,
    }),
    [
      isLoadingCommerceItems,
      isLoadingCommerceProducts,
      commerceItemsError,
      commerceProductsError,
      catalogSelectedCommerceItemIds,
      commerceItemsList,
      commerceProductsList,
      isLoadingPermissions,
      isShopifyEnabled,
      isAmazonEnabled,
      areVirtualBenefitsEnabled,
      isProductSaleEnabled,
      isAnalyticsEnabled,
      listCommerceItems,
      listCommerceItemsV2,
      listCommerceProducts,
      refreshCommerceProducts,
      fetchCommerceProductsWithoutUpdate,
      createCommerceItem,
      createCommerceProduct,
      archiveCommerceItem,
      archiveCommerceProduct,
      updateCommerceProductDraft,
      updateCommerceProductStatus,
      createCommerceProductBundlingFee,
      acceptCommerceProductBundlingFee,
      applyForCreatorBundlingEligibility,
      createCommerceProductError,
      fetchCommerceEligibilityQuery,
      eligibilityStatus,
    ],
  );

  return <CommerceContext.Provider value={providerState}>{children}</CommerceContext.Provider>;
};

export default CommerceProvider;
