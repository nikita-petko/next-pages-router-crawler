import React, {
  useContext,
  createContext,
  ReactNode,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DevelopAssetDetailsResponse, developClient } from '@modules/clients';
import { AllSettlePromiseSuccess, Asset, CreatorType } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { useAuthentication } from '@modules/authentication/providers';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { getUserHasEditPermissionForAsset } from './common';

export type DeveloperItemDetails = {
  creator: { id: number; type: CreatorType };
  description?: string;
  enableComments: boolean;
  id: string;
  isCopyingAllowed: boolean;
  isVersioningEnabled: boolean;
  name: string;
  type: Asset;
};

export type DeveloperItemContextValue = {
  canConfigureDeveloperItem: boolean | undefined;
  developerItemDetails: DeveloperItemDetails | null;
  developerItemId: number | undefined;
  developerItemImage: ReactNode;
  isLoadingDeveloperItem: boolean;
  refreshDeveloperItemDetails: (withImageRefresh?: boolean) => Promise<void>;
};

const defaultDetails: DeveloperItemContextValue = {
  canConfigureDeveloperItem: undefined,
  developerItemDetails: null,
  developerItemId: undefined,
  developerItemImage: 'no image',
  isLoadingDeveloperItem: true,
  refreshDeveloperItemDetails: () => {
    throw new Error('function is not implemented');
  },
};

export const DeveloperItemContext = createContext<DeveloperItemContextValue>(defaultDetails);
DeveloperItemContext.displayName = 'DeveloperItemDetail';

export const DeveloperItemProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [isLoadingDeveloperItem, setIsLoadingDeveloperItem] = useState<boolean>(true);
  const [canConfigureDeveloperItem, setCanConfigureDeveloperItem] = useState<boolean | undefined>(
    undefined,
  );
  const [developerItemDetails, setDeveloperItemDetails] = useState<DeveloperItemDetails | null>(
    null,
  );

  const { user } = useAuthentication();
  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const developerItemId = useMemo(() => {
    if (isRouterReady) {
      const { id } = routerQuery;
      if (id) {
        const parsedId = parseInt(id as string, 10);
        return parsedId > 0 ? parsedId : undefined;
      }
    }
    return undefined;
  }, [routerQuery, isRouterReady]);

  const { thumbnailImage, refreshThumbnail } = useThumbnailImage({
    targetId: developerItemId ?? 0,
    targetType: ThumbnailTypes.assetThumbnail,
    fontColor: 'dark',
    returnPolicy: ReturnPolicy.PlaceHolder,
  });

  const isValidDeveloperItemDetail = useCallback((response: DevelopAssetDetailsResponse) => {
    const isValidAssetType =
      response.type && Object.values(Asset).includes(response.type as string as Asset);
    return (
      response.id &&
      isValidAssetType &&
      response.name &&
      response.creator?.targetId &&
      response.creator?.type &&
      typeof response.enableComments !== 'undefined' &&
      typeof response.isCopyingAllowed !== 'undefined'
    );
  }, []);

  const fetchDeveloperItemDetails = useCallback(
    async (itemId: number, userId: number) => {
      setIsLoadingDeveloperItem(true);

      const [developDetailResponse, canConfigureAssetResponse] = await Promise.allSettled([
        developClient.getAssetDetails([itemId]),
        getUserHasEditPermissionForAsset(userId, itemId),
      ]);
      if (
        developDetailResponse.status === AllSettlePromiseSuccess &&
        canConfigureAssetResponse.status === AllSettlePromiseSuccess
      ) {
        const developDetail = developDetailResponse.value.data?.[0];
        if (developDetail && isValidDeveloperItemDetail(developDetail)) {
          const resultInfo: DeveloperItemDetails = {
            id: developDetail.id!.toString(),
            type: developDetail.type as string as Asset,
            name: developDetail.name!,
            creator: {
              id: developDetail.creator!.targetId!,
              type: developDetail.creator!.type! as unknown as CreatorType,
            },
            enableComments: developDetail.enableComments!,
            isCopyingAllowed: developDetail.isCopyingAllowed!,
            isVersioningEnabled: developDetail.isVersioningEnabled ?? false,
            description: developDetail.description,
          };
          setDeveloperItemDetails(resultInfo);
        } else {
          setDeveloperItemDetails(null);
        }

        setCanConfigureDeveloperItem(canConfigureAssetResponse.value);
      } else {
        setDeveloperItemDetails(null);
      }
      setIsLoadingDeveloperItem(false);
    },
    [isValidDeveloperItemDetail],
  );

  const refreshDeveloperItemDetails = useCallback(
    async (withImageRefresh = false) => {
      if (withImageRefresh) {
        refreshThumbnail();
      }
      if (developerItemId && user?.id) {
        return fetchDeveloperItemDetails(developerItemId, user.id);
      }
      return Promise.resolve();
    },
    [user, developerItemId, fetchDeveloperItemDetails, refreshThumbnail],
  );

  useEffect(() => {
    refreshDeveloperItemDetails();
  }, [refreshDeveloperItemDetails]);

  const value = useMemo(() => {
    return {
      canConfigureDeveloperItem,
      developerItemId,
      isLoadingDeveloperItem,
      developerItemDetails,
      refreshDeveloperItemDetails,
      developerItemImage: thumbnailImage,
    };
  }, [
    canConfigureDeveloperItem,
    developerItemDetails,
    developerItemId,
    isLoadingDeveloperItem,
    refreshDeveloperItemDetails,
    thumbnailImage,
  ]);

  return <DeveloperItemContext.Provider value={value}>{children}</DeveloperItemContext.Provider>;
};

export function useCurrentDeveloperItem() {
  return useContext(DeveloperItemContext);
}
