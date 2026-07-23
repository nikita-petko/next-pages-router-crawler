import type { ReactNode, FunctionComponent } from 'react';
import React, { useContext, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { useAuthentication } from '@modules/authentication/providers';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import developClient from '@modules/clients/develop';
import type { DevelopAssetDetailsResponse } from '@modules/clients/develop';
import { AllSettlePromiseSuccess, Asset, CreatorType } from '@modules/miscellaneous/common';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { getUserHasEditPermissionForAsset } from './common';
import type { DeveloperItemDetails } from './types';

export type DeveloperItemContextValue = {
  canConfigureDeveloperItem: boolean | undefined;
  developerItemDetails: DeveloperItemDetails | null;
  developerItemId: number | undefined;
  developerItemImage: ReactNode;
  iconAssetId: number | null;
  isLoadingDeveloperItem: boolean;
  refreshDeveloperItemDetails: (withImageRefresh?: boolean) => Promise<void>;
  updateIconAssetId: (id: number) => void;
};

const defaultDetails: DeveloperItemContextValue = {
  canConfigureDeveloperItem: undefined,
  developerItemDetails: null,
  developerItemId: undefined,
  developerItemImage: 'no image',
  iconAssetId: null,
  isLoadingDeveloperItem: true,
  refreshDeveloperItemDetails: () => {
    throw new Error('function is not implemented');
  },
  updateIconAssetId: () => {
    throw new Error('function is not implemented');
  },
};

export const DeveloperItemContext = createContext<DeveloperItemContextValue>(defaultDetails);
DeveloperItemContext.displayName = 'DeveloperItemDetail';

export const DeveloperItemProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [isLoadingDeveloperItem, setIsLoadingDeveloperItem] = useState<boolean>(true);
  const [canConfigureDeveloperItem, setCanConfigureDeveloperItem] = useState<boolean | undefined>(
    undefined,
  );
  const [developerItemDetails, setDeveloperItemDetails] = useState<DeveloperItemDetails | null>(
    null,
  );

  const { user } = useAuthentication();
  const { settings } = useSettings();
  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const developerItemId = useMemo(() => {
    if (isRouterReady) {
      const { id } = routerQuery;
      if (id) {
        const parsedId = parseInt(String(id), 10);
        return parsedId > 0 ? parsedId : undefined;
      }
    }
    return undefined;
  }, [routerQuery, isRouterReady]);

  const [iconAssetId, setIconAssetId] = useState<number | null>(null);

  useEffect(() => {
    if (
      !settings.enableAudioUploadRevamp ||
      !developerItemId ||
      developerItemDetails?.type !== Asset.Audio
    ) {
      return;
    }
    void assetsUploadApiClient.getAsset(developerItemId, [FieldMask.ICON]).then((asset) => {
      if (asset.icon) {
        const parsed = parseInt(asset.icon.replace('assets/', ''), 10);
        if (!Number.isNaN(parsed)) {
          setIconAssetId(parsed);
        }
      }
    });
  }, [developerItemId, developerItemDetails?.type, settings.enableAudioUploadRevamp]);

  const thumbnailTargetId = iconAssetId ?? developerItemId ?? 0;

  const { thumbnailImage, refreshThumbnail } = useThumbnailImage({
    targetId: thumbnailTargetId,
    targetType: ThumbnailTypes.assetThumbnail,
    fontColor: 'dark',
    returnPolicy: ReturnPolicy.PlaceHolder,
  });

  const isValidDeveloperItemDetail = useCallback((response: DevelopAssetDetailsResponse) => {
    const assetValues: string[] = Object.values(Asset);
    const isValidAssetType = response.type && assetValues.includes(response.type);
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
          const assetType = Object.values(Asset).find((v) => v === developDetail.type);
          const creatorType = Object.values(CreatorType).find(
            (v) => v === developDetail.creator?.type,
          );
          if (!assetType || !creatorType) {
            setDeveloperItemDetails(null);
            setIsLoadingDeveloperItem(false);
            return;
          }
          const resultInfo: DeveloperItemDetails = {
            id: (developDetail.id ?? 0).toString(),
            type: assetType,
            name: developDetail.name ?? '',
            creator: {
              id: developDetail.creator?.targetId ?? 0,
              type: creatorType,
            },
            enableComments: developDetail.enableComments ?? false,
            isCopyingAllowed: developDetail.isCopyingAllowed ?? false,
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
        void refreshThumbnail();
      }
      if (developerItemId && user?.id) {
        return fetchDeveloperItemDetails(developerItemId, user.id);
      }
      return undefined;
    },
    [user, developerItemId, fetchDeveloperItemDetails, refreshThumbnail],
  );

  useEffect(() => {
    void refreshDeveloperItemDetails();
  }, [refreshDeveloperItemDetails]);

  const value = useMemo(() => {
    return {
      canConfigureDeveloperItem,
      developerItemId,
      iconAssetId,
      isLoadingDeveloperItem,
      developerItemDetails,
      refreshDeveloperItemDetails,
      developerItemImage: thumbnailImage,
      updateIconAssetId: setIconAssetId,
    };
  }, [
    canConfigureDeveloperItem,
    developerItemDetails,
    developerItemId,
    iconAssetId,
    isLoadingDeveloperItem,
    refreshDeveloperItemDetails,
    thumbnailImage,
  ]);

  return <DeveloperItemContext.Provider value={value}>{children}</DeveloperItemContext.Provider>;
};

export function useCurrentDeveloperItem() {
  return useContext(DeveloperItemContext);
}
