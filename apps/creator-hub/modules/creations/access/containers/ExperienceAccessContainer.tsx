import { useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { developClient, getErrorStatus, universesClient } from '@modules/clients';
import { FiatProductModerationStatus } from '@modules/clients/develop';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import { useCreationsCustomSettings } from '../../common/implementations/creationsCustomSettings';
import {
  AccessType,
  CountryInfo,
  PlaceJoinRestrictionType,
  Privacy,
  UniverseAccessConfiguration,
  ExperienceAccessMetaData,
} from '../ExperienceAccessTypes';
import ExperienceAccessForm from '../components/ExperienceAccessForm';

function ExperienceAccessContainer() {
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const { translate } = useTranslation();
  const { showVrDeviceOption } = useCreationsCustomSettings();

  const [isUniverseAccessDetailReady, setIsUniverseAccessDetailReady] = useState<boolean>(false);
  const [isGetUniverseAccessDetailFailed, setIsGetUniverseAccessDetailFailed] =
    useState<boolean>(false);
  const [universeAccessConfiguration, setUniverseAccessConfiguration] =
    useState<UniverseAccessConfiguration | null>(null);
  const [universeAccessMetaData, setUniverseAccessMetaData] =
    useState<ExperienceAccessMetaData | null>(null);
  const [allCountries, setAllCountries] = useState<CountryInfo[]>([]);

  const getUniverseAccessDetails = useCallback(async () => {
    setIsGetUniverseAccessDetailFailed(false);
    setIsUniverseAccessDetailReady(false);
    try {
      if (gameDetails && gameDetails.id) {
        const [
          universeJoinRestrictionsResponse,
          universeAccessResponse,
          ageRestrictionResponse,
          geoRestrictionResponse,
        ] = await Promise.all([
          universesClient.getJoinRestrictions({
            universeId: gameDetails.id,
          }),
          developClient.getUniverseConfigurationV2(gameDetails.id),
          experienceGuidelinesServiceApiClient.getCreatorControlsAgeRestriction(gameDetails.id),
          experienceGuidelinesServiceApiClient.getCreatorControlsGeoRestriction(gameDetails.id),
        ]);

        if (
          typeof universeAccessResponse.isFriendsOnly !== 'undefined' &&
          typeof universeAccessResponse.playableDevices !== 'undefined' &&
          typeof universeAccessResponse.isForSale !== 'undefined'
        ) {
          setUniverseAccessConfiguration({
            id: gameDetails.id,
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
          });
        }

        try {
          const allCountriesResponse =
            await experienceGuidelinesServiceApiClient.getAllCountries(true);
          const validCountries = (allCountriesResponse.countries || [])
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
          developClient.getUniverseConfigurationVIPServer(gameDetails.id),
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
  }, [gameDetails]);

  const handlePageReload = useCallback(() => {
    if (gameDetails && isGetUniverseAccessDetailFailed) {
      getUniverseAccessDetails();
    } else {
      refreshGameDetails();
    }
  }, [isGetUniverseAccessDetailFailed, gameDetails, getUniverseAccessDetails, refreshGameDetails]);

  useEffect(() => {
    getUniverseAccessDetails();
  }, [getUniverseAccessDetails]);

  if (process.env.buildTarget === 'luobu') {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (
    (!gameDetails || !universeAccessConfiguration || !universeAccessMetaData) &&
    (isLoadingGame || !isUniverseAccessDetailReady)
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
