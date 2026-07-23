import { useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import developClient, { FiatProductModerationStatus } from '@modules/clients/develop';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import universesClient from '@modules/clients/universes';
import { getErrorStatus } from '@modules/clients/utils/errorHelpers';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { Audience } from '../../common/audiences';
import { useCreationsCustomSettings } from '../../common/implementations/creationsCustomSettings';
import ExperienceAccessForm from '../components/ExperienceAccessForm';
import type {
  CountryInfo,
  UniverseAccessConfiguration,
  ExperienceAccessMetaData,
} from '../ExperienceAccessTypes';
import { AccessType, PlaceJoinRestrictionType, Privacy } from '../ExperienceAccessTypes';

function ExperienceAccessContainer() {
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const { translate } = useTranslation();
  const { showVrDeviceOption } = useCreationsCustomSettings();

  const {
    params: { enableAudienceControls, enableAudiencesReplacement },
    isFetched: isCreationsPermissionIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const [isUniverseAccessDetailReady, setIsUniverseAccessDetailReady] = useState<boolean>(false);
  const [isGetUniverseAccessDetailFailed, setIsGetUniverseAccessDetailFailed] =
    useState<boolean>(false);
  const [universeAccessConfiguration, setUniverseAccessConfiguration] =
    useState<UniverseAccessConfiguration | null>(null);
  const [universeAccessMetaData, setUniverseAccessMetaData] =
    useState<ExperienceAccessMetaData | null>(null);
  const [allCountries, setAllCountries] = useState<CountryInfo[]>([]);
  // In a transient missing-data state we treat the audience as Public so the access controls are never accidentally over-restricted.
  const [isAudiencePublic, setIsAudiencePublic] = useState<boolean>(true);

  const getUniverseAccessDetails = useCallback(async () => {
    setIsGetUniverseAccessDetailFailed(false);
    setIsUniverseAccessDetailReady(false);
    try {
      if (universeId) {
        const [
          universeJoinRestrictionsResponse,
          universeAccessResponse,
          ageRestrictionResponse,
          geoRestrictionResponse,
        ] = await Promise.all([
          universesClient.getJoinRestrictions({
            universeId,
          }),
          developClient.getUniverseConfigurationV2(universeId),
          experienceGuidelinesServiceApiClient.getCreatorControlsAgeRestriction(universeId),
          experienceGuidelinesServiceApiClient.getCreatorControlsGeoRestriction(universeId),
        ]);

        if (
          typeof universeAccessResponse.playableDevices !== 'undefined' &&
          typeof universeAccessResponse.isForSale !== 'undefined' &&
          (enableAudiencesReplacement ||
            typeof universeAccessResponse.isFriendsOnly !== 'undefined')
        ) {
          setIsAudiencePublic(universeAccessResponse.audiences?.includes(Audience.Public) ?? false);
          setUniverseAccessConfiguration({
            id: universeId,
            accessType: universeAccessResponse.isFriendsOnly
              ? AccessType.Friends
              : AccessType.Public,
            devices: universeAccessResponse.playableDevices,
            isForSale: universeAccessResponse.isForSale,
            isForSaleInFiat: universeAccessResponse.isForSaleInFiat,
            fiatProductModerationStatus: universeAccessResponse.fiatModerationStatus,
            fiatBasePriceId:
              universeAccessResponse.fiatModerationStatus === undefined ||
              universeAccessResponse.fiatModerationStatus ===
                FiatProductModerationStatus.NotModerated
                ? undefined
                : universeAccessResponse.fiatBasePriceId,
            price: universeAccessResponse.price,
            isPrivateServersAllowed: universeAccessResponse.allowPrivateServers ?? false,
            privateServerPrice: universeAccessResponse.privateServerPrice,
            placeJoinRestrictionType:
              universeJoinRestrictionsResponse.placeJoinRestrictionType ??
              PlaceJoinRestrictionType.Default,
            isSpecificJoinToNonRootPlacesAllowed:
              universeJoinRestrictionsResponse.isSpecificJoinToNonRootPlacesAllowed ?? false,
            hasPlaceOverrides: universeJoinRestrictionsResponse.hasPlaceOverrides ?? false,
            privacy:
              universeAccessResponse.privacyType === 'Public' ? Privacy.Public : Privacy.Private,
            minimumAge: ageRestrictionResponse.ageRestriction?.minimumAge?.toString(),
            restrictedCountries: geoRestrictionResponse.geoRestriction?.restrictedCountries,
            demoModeEnabled: universeAccessResponse.demoModeEnabled ?? false,
            demoModeChangeableAfter: universeAccessResponse.demoModeChangeableAfter
              ? String(universeAccessResponse.demoModeChangeableAfter)
              : undefined,
          });
        }

        try {
          const allCountriesResponse =
            await experienceGuidelinesServiceApiClient.getAllCountries(true);
          const validCountries = (allCountriesResponse.countries ?? [])
            .filter(
              (country): country is CountryInfo => !!country.countryCode && !!country.countryName,
            )
            .map((country) => ({
              countryCode: country.countryCode,
              countryName: country.countryName,
            }));
          setAllCountries(validCountries);
        } catch (e) {
          const status = getErrorStatus(e);
          if (status === StatusCodes.GATEWAY_TIMEOUT) {
            setAllCountries([]);
          }
        }

        const [universeAccessMetaDataResponse, commissionRateResponse] = await Promise.all([
          developClient.getUniverseConfigurationVIPServer(universeId),
          itemConfigurationClient.getCollectibleCommissionRates(),
        ]);
        if (typeof commissionRateResponse !== 'undefined') {
          setUniverseAccessMetaData({
            experienceMarketPlaceCommissionRate:
              commissionRateResponse?.marketplaceFeesPercentage ?? 0,
            privateServerMarketPlaceCommissionRate:
              commissionRateResponse?.marketplaceFeesPercentage ?? 0,
            activeServersCount: universeAccessMetaDataResponse.activeServersCount ?? null,
            activeSubscriptionsCount:
              universeAccessMetaDataResponse.activeSubscriptionsCount ?? null,
          });
        }
      }
    } catch {
      setIsGetUniverseAccessDetailFailed(true);
    } finally {
      setIsUniverseAccessDetailReady(true);
    }
  }, [universeId, enableAudiencesReplacement]);

  const handlePageReload = useCallback(() => {
    if (universeId && isGetUniverseAccessDetailFailed) {
      void getUniverseAccessDetails();
    } else {
      void refreshGameDetails();
    }
  }, [isGetUniverseAccessDetailFailed, universeId, getUniverseAccessDetails, refreshGameDetails]);

  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler -- pre-existing fetch-on-mount pattern
    void getUniverseAccessDetails();
  }, [getUniverseAccessDetails]);

  if (process.env.buildTarget === 'luobu') {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (
    (!gameDetails || !universeAccessConfiguration || !universeAccessMetaData) &&
    (isLoadingGame || !isUniverseAccessDetailReady || !isCreationsPermissionIxpFetched)
  ) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || !universeAccessConfiguration || !universeAccessMetaData) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  return (
    <ExperienceAccessForm
      universeAccessConfiguration={universeAccessConfiguration}
      universeAccessMetaData={universeAccessMetaData}
      showVrDeviceOption={showVrDeviceOption}
      allCountries={allCountries}
      enableAudienceControls={Boolean(enableAudienceControls)}
      enableAudiencesReplacement={Boolean(enableAudiencesReplacement)}
      isAudiencePublic={isAudiencePublic}
    />
  );
}

export default withTranslation(ExperienceAccessContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Access,
  TranslationNamespace.Controls,
  TranslationNamespace.FiatPaidAccess,
  TranslationNamespace.RegionalPricing,
]);
