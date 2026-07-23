import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import { developClient, assetPermissionsApiClient } from '@modules/clients';
import { AssetGrantableAction } from '@rbx/clients/assetPermissionsApi';
import { useCurrentPlace } from '@modules/creations/places';
// eslint-disable-next-line no-restricted-imports -- deep import into creations module; will be resolved when creations barrel is removed (Phase 5)
import AllowedGearType from '@modules/creations/common/enums/AllowedGearType';
// eslint-disable-next-line no-restricted-imports -- deep import into creations module; will be resolved when creations barrel is removed (Phase 5)
import { AssetPermissionResponseModel } from '@modules/creations/developerItem/common';
import PlacePermissionsForm from '../PlacePermissionsForm/PlacePermissionsForm';

export type PlacePermissionConfiguration = {
  placeId: number;
  allowCoping: boolean;
  isAllGenresAllowed: boolean;
  allowedGearTypes: Array<AllowedGearType>;
  isUpdateFromRcc: boolean;
  isCopyFromRcc: boolean;
};
const PlacePermissionsContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { gameDetails, isLoadingGame, canConfigure } = useCurrentGame();
  const { canConfigurePlace, isPlaceLoading } = useCurrentPlace();
  const { translate } = useTranslation();
  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const [placePermissionsValue, setPlacePermissionsValue] =
    useState<PlacePermissionConfiguration>();
  const [isPageInitialized, setIsPageInitialized] = useState<boolean>(false);
  const [failedToGetData, setFailedToGetData] = useState<boolean>(false);
  const [isDataFetchLoading, setIsDataFetchLoading] = useState<boolean>(false);

  const placeId = useMemo(() => {
    if (isRouterReady) {
      const { placeId: routerPlaceId } = routerQuery;
      const parsedId = parseInt(routerPlaceId as string, 10);
      return parsedId > 0 ? parsedId : undefined;
    }
    return undefined;
  }, [routerQuery, isRouterReady]);

  const getPlacePermissionSettings = useCallback(async () => {
    try {
      if (!placeId) {
        return;
      }
      setFailedToGetData(false);
      setIsDataFetchLoading(true);
      const [placeDetailsResponse, placePermissionsResponse] = await Promise.all([
        developClient.getPlaceDetailInfo({ placeId }),
        assetPermissionsApiClient.getAssetPermissions(placeId),
      ]);
      if (placeDetailsResponse && placePermissionsResponse) {
        const placePermissionGrantActions = placePermissionsResponse.map(
          (res: AssetPermissionResponseModel) => res.action,
        );
        setPlacePermissionsValue({
          placeId,
          allowCoping: placeDetailsResponse.allowCopying ?? false,
          isAllGenresAllowed: placeDetailsResponse.isAllGenresAllowed ?? false,
          allowedGearTypes: placeDetailsResponse.allowedGearTypes ?? [],
          isUpdateFromRcc: placePermissionGrantActions.includes(AssetGrantableAction.UpdateFromRcc),
          isCopyFromRcc: placePermissionGrantActions.includes(AssetGrantableAction.CopyFromRcc),
        });
      }
      setIsPageInitialized(true);
    } catch {
      setFailedToGetData(true);
    } finally {
      setIsDataFetchLoading(false);
    }
  }, [placeId]);

  const refreshData = useCallback(() => {
    return getPlacePermissionSettings();
  }, [getPlacePermissionSettings]);

  useEffect(() => {
    getPlacePermissionSettings();
  }, [getPlacePermissionSettings]);

  if ((!isLoadingGame && !canConfigure) || (!isPlaceLoading && !canConfigurePlace)) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!placeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if ((!isLoadingGame && !gameDetails) || (!isDataFetchLoading && failedToGetData)) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={refreshData}
      />
    );
  }

  if (isPageInitialized && placePermissionsValue) {
    return (
      <PlacePermissionsForm
        placePermissionsValues={placePermissionsValue}
        refreshData={refreshData}
      />
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(PlacePermissionsContainer, [
  TranslationNamespace.Places,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Controls,
]);
