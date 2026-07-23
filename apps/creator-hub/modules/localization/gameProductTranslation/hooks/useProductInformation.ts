import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  badgesClient,
  BadgeSortOrderEnum,
  developerProductsClient,
  passesClient,
} from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { badgeQuantityLimit, developerProductPageSize, gamePassQuantityLimit } from '../constants';
import { ProductItem } from '../types';
import ProductType from '../enums/ProductTypes';

const useProductInformation = () => {
  const { error } = useMetricsMonitoring();
  const { gameId } = useEntryManagementMetadata();
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [isFetchingBadges, setIsFetchingBadges] = useState<boolean>(false);
  const [isFetchingGamePasses, setIsFetchingGamePasses] = useState<boolean>(false);
  const [isFetchingDevProducts, setIsFetchingDevProducts] = useState<boolean>(false);
  const [fetchBadgesError, setFetchBadgesError] = useState<Error | null>(null);
  const [fetchGamePassesError, setFetchGamePassesError] = useState<Error | null>(null);
  const [fetchDevProductsError, setFetchDevProductsError] = useState<Error | null>(null);

  const getBadges = useCallback(
    async (universeId: number) => {
      const recursivelyGetBadges = async (nextPageCursor: string | undefined) => {
        setIsFetchingBadges(true);
        if (typeof nextPageCursor === 'undefined') {
          setIsFetchingBadges(false);
          setFetchBadgesError(null);
          return;
        }
        try {
          const response = await badgesClient.getBadges(
            universeId,
            BadgeSortOrderEnum.Asc,
            badgeQuantityLimit,
            nextPageCursor,
          );
          if (response?.data === undefined) {
            throw new Error('Badges returned an undefined response');
          }
          if (response.data.length > 0 || response.data !== null) {
            const formattedData = response.data.map((item) => ({
              id: item.id,
              title: item.name,
              productType: ProductType.Badge,
            }));
            setProductList((prevList) => [...prevList, ...(formattedData as ProductItem[])]);
            await recursivelyGetBadges(response.nextPageCursor);
          } else {
            await recursivelyGetBadges(undefined);
          }
        } catch (e) {
          const catchedError = e as Error;
          error(catchedError.message);
          setFetchBadgesError(catchedError);
          setIsFetchingBadges(false);
        }
      };
      recursivelyGetBadges('');
    },
    [error, setFetchBadgesError, setIsFetchingBadges],
  );

  const getGamePasses = useCallback(
    async (universeId: number) => {
      const recursivelyGetGamePasses = async (nextPageCursor: string | undefined) => {
        setIsFetchingBadges(true);
        if (typeof nextPageCursor === 'undefined') {
          setIsFetchingGamePasses(false);
          setFetchGamePassesError(null);
          return;
        }
        try {
          const response = await passesClient.listGamePassesByUniverse({
            universeId,
            passView: 'Base', // We only need metadata for passes here
            pageSize: gamePassQuantityLimit,
            pageToken: nextPageCursor,
          });

          if (response?.gamePasses === undefined) {
            throw new Error('GamePasses returned an undefined response');
          }
          if (response.gamePasses.length > 0 || response.gamePasses !== null) {
            const formattedData = response.gamePasses.map((item) => ({
              id: item.id,
              title: item.name,
              productType: ProductType.Pass,
            }));
            setProductList((prevList) => [...prevList, ...(formattedData as ProductItem[])]);
            await recursivelyGetGamePasses(response.nextPageToken || undefined); // last page returns empty string
          } else {
            await recursivelyGetGamePasses(undefined);
          }
        } catch (e) {
          const catchedError = e as Error;
          error(catchedError.message);
          setFetchGamePassesError(catchedError);
          setIsFetchingGamePasses(false);
        }
      };
      recursivelyGetGamePasses('');
    },
    [error, setFetchGamePassesError, setIsFetchingGamePasses],
  );

  const getDevProducts = useCallback(
    async (universeId: number) => {
      const recursivelyListDevProductsCursored = async (
        cursor: string | undefined,
        hasMore: boolean,
      ) => {
        setIsFetchingDevProducts(true);
        if (hasMore === false) {
          setIsFetchingDevProducts(false);
          setFetchDevProductsError(null);
          return;
        }

        try {
          const response = await developerProductsClient.listDeveloperProducts({
            universeId,
            cursor,
            limit: developerProductPageSize,
          });

          if (response === undefined) {
            throw new Error('Developer Products returned an undefined response');
          }

          if (response.developerProducts && response.developerProducts.length > 0) {
            const formattedData = response.developerProducts.map((item) => ({
              id: item.productId,
              title: item.name,
              productType: ProductType.DeveloperProduct,
            }));

            setProductList((prevList) => [...prevList, ...(formattedData as ProductItem[])]);
            if (response.nextPageCursor) {
              await recursivelyListDevProductsCursored(response.nextPageCursor, true);
            }
          } else {
            await recursivelyListDevProductsCursored(undefined, false);
          }
        } catch (e) {
          const catchedError = e as Error;
          error(catchedError.message);
          setFetchDevProductsError(catchedError);
          setIsFetchingDevProducts(false);
        }
      };

      recursivelyListDevProductsCursored(undefined, true);
    },
    [error, setFetchDevProductsError, setIsFetchingDevProducts],
  );

  useEffect(() => {
    if (!gameId) {
      throw new Error('Game Id is invalid');
    }
    setFetchBadgesError(null);
    setFetchGamePassesError(null);
    setFetchDevProductsError(null);
    getGamePasses(gameId);
    getBadges(gameId);
    getDevProducts(gameId);
  }, [gameId, getBadges, getDevProducts, getGamePasses]);

  const fetchedProductListError = useMemo(() => {
    if (fetchBadgesError) {
      return fetchBadgesError;
    }
    if (fetchDevProductsError) {
      return fetchDevProductsError;
    }
    if (fetchGamePassesError) {
      return fetchGamePassesError;
    }
    return null;
  }, [fetchBadgesError, fetchDevProductsError, fetchGamePassesError]);

  const productListLoading = useMemo(() => {
    return isFetchingBadges && isFetchingDevProducts && isFetchingGamePasses;
  }, [isFetchingDevProducts, isFetchingGamePasses, isFetchingBadges]);

  return {
    productList,
    fetchedProductListError,
    productListLoading,
  };
};

export default useProductInformation;
