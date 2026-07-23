import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@rbx/ui';
import {
  ConfigureSocialLinkErrorCodes,
  developClient,
  gamesClient,
  SaveSocialLinkResponse,
  SocialLinksData,
  SocialLinksMetadata,
  SocialLinkTypes,
  SocialLinkTypesForRequest,
  tryParseResponseError,
} from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { EmptyGrid, uninitializedUniverseId, utils } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SocialLinkErrorCodes } from '@modules/clients/games';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import SocialLinkAgeVerificationUpsellBanner from '@modules/social-links/SocialLinkAgeVerificationUpsellBanner';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import { getSocialLinksUpsellCopy } from '@modules/social-links/utils/socialLinksVerificationUtils';
import useSocialLinksContainerStyles from './SocialLinksContainer.styles';
import SocialLinkConfigurationForm from './SocialLinkConfigurationForm';
import {
  maxTitleLength,
  maxUrlLength,
  SocialLinkFormRules,
  SocialLinkFormType,
} from '../formConfiguration';

const { getEnumKeyByValue } = utils;
const serverDataTransfer = (serverResponse: SaveSocialLinkResponse, rawData: SocialLinksData) => {
  const url = rawData.url.trim();
  const formattedUrl = `https://${url.replace('www.', '').replace('https://', '')}`;
  return {
    linkId: serverResponse.id ?? rawData.linkId,
    linkType: serverResponse.type
      ? SocialLinkTypes[serverResponse.type.toString() as keyof typeof SocialLinkTypesForRequest]
      : rawData.linkType,
    url: serverResponse.url ?? formattedUrl,
    title: serverResponse.title ?? rawData.title,
  } as SocialLinksData;
};

const SocialLinksContainer: FunctionComponent = () => {
  const {
    classes: { sectionStyle },
  } = useSocialLinksContainerStyles();
  const { canConfigure, gameDetails, refreshGameDetails, isLoadingGame } = useCurrentGame();
  const { translate } = useTranslation();

  const [isLinkDataReady, setIsLinkDataReady] = useState<boolean>(false);
  const [failedToGetLinkData, setFailedToGetLinkData] = useState<boolean>(false);
  const [savedLinks, setSavedLinks] = useState<SocialLinkFormType>({ socialLink: [] });
  const [socialLinksVerificationStatus, setSocialLinksVerificationStatus] = useState<number>();
  const [linkMetadata, setLinkMetadata] = useState<SocialLinksMetadata | null>(null);
  const [isUserAgeUnder13, setIsUserAgeUnder13] = useState<boolean>(false);

  const {
    data: { shouldDisableSocialLinkCreation },
    isPending: isSocialLinksBehaviorLoading,
  } = useSocialLinksBehavior();

  const { permissions } = useCurrentOrganization();

  const { title: ageVerificationUpsellTitle, description: ageVerificationUpsellDescription } =
    getSocialLinksUpsellCopy(
      socialLinksVerificationStatus,
      'experiences',
      permissions?.isOwner ?? false,
    );

  const universeId = useMemo(() => gameDetails?.id ?? uninitializedUniverseId, [gameDetails?.id]);

  const getLinkMetadata = useCallback(async () => {
    try {
      const response = await developClient.getSocialLinkMetadata(universeId);
      setLinkMetadata(response);
    } catch {
      setFailedToGetLinkData(true);
    }
  }, [universeId]);

  const getLinks = useCallback(async () => {
    try {
      const response = await gamesClient.getSocialLinks(universeId);
      setSocialLinksVerificationStatus(response.socialLinksVerificationStatus);
      setSavedLinks({ socialLink: response.data });
      return { socialLink: response.data };
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error?.code === SocialLinkErrorCodes.SocialLinkNotViewableUnder12) {
        setIsUserAgeUnder13(true);
      }
      setFailedToGetLinkData(true);
      return { socialLink: [] };
    }
  }, [universeId]);

  const initializeData = useCallback(async () => {
    await Promise.all([getLinkMetadata(), getLinks()]);
    setIsLinkDataReady(true);
  }, [getLinkMetadata, getLinks]);

  const handlePageReload = useCallback(async () => {
    setIsLinkDataReady(false);
    setFailedToGetLinkData(false);
    await refreshGameDetails();
    initializeData();
  }, [initializeData, refreshGameDetails]);

  const handleRemove = useCallback(
    async (row: SocialLinksData) => {
      if (row.linkId === null) {
        return Promise.reject(new Error('Bad LinkID'));
      }
      return developClient.deleteSocialLink(universeId, row.linkId);
    },
    [universeId],
  );

  const handleAdd = useCallback(
    async (row: SocialLinksData) => {
      try {
        return serverDataTransfer(
          await developClient.saveSocialLink(
            universeId,
            row.linkType as SocialLinkTypes,
            row.url,
            row.title,
          ),
          row,
        );
      } catch (errRes) {
        const error = await tryParseResponseError(errRes);
        if (error !== null) {
          const nameOfError = getEnumKeyByValue(ConfigureSocialLinkErrorCodes, error.code);
          if (nameOfError !== null) {
            return Promise.reject(new Error(`Error.${nameOfError}`));
          }
        }
        return Promise.reject(new Error(`Error.UnknownError`));
      }
    },
    [universeId],
  );

  const handleUpdate = useCallback(
    async (row: SocialLinksData) => {
      if (row.linkId === null) {
        return Promise.reject(new Error('Bad LinkID'));
      }
      try {
        return serverDataTransfer(
          await developClient.updateSocialLink(
            universeId,
            row.linkId,
            row.linkType as SocialLinkTypes,
            row.url.trim(),
            row.title.trim(),
          ),
          row,
        );
      } catch (errRes) {
        const error = await tryParseResponseError(errRes);
        if (error !== null) {
          const nameOfError = getEnumKeyByValue(ConfigureSocialLinkErrorCodes, error.code);
          if (nameOfError !== null) {
            return Promise.reject(new Error(`Error.${nameOfError}`));
          }
        }
        return Promise.reject(new Error(`Error.UnknownError`));
      }
    },
    [universeId],
  );

  useEffect(() => {
    if (universeId !== uninitializedUniverseId) {
      SocialLinkFormRules.linkType.required = translate('Label.LinkTypeCannotBeEmpty');
      SocialLinkFormRules.url.required = translate('Label.UrlCannotBeEmpty');
      SocialLinkFormRules.url.maxLength.message = translate('Label.MaxUrlLength', {
        number: maxUrlLength.toString(),
      });
      SocialLinkFormRules.title.required = translate('Label.TitleCannotBeEmpty');
      SocialLinkFormRules.title.maxLength.message = translate('Label.MaxTitleLength', {
        number: maxTitleLength.toString(),
      });
      initializeData();
    }
  }, [initializeData, translate, universeId]);

  if (isLoadingGame || (!isLinkDataReady && !failedToGetLinkData) || isSocialLinksBehaviorLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  // NOTE (lguan-cn, 2022-7-26): The clients for getting the user age is not ready, showing error page for now.
  // Should hide the tab on the left navi bar once the client is ready.
  if (!canConfigure || isUserAgeUnder13) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || failedToGetLinkData) {
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
    <section className={sectionStyle}>
      {shouldDisableSocialLinkCreation && (
        <SocialLinkAgeVerificationUpsellBanner
          title={translate(ageVerificationUpsellTitle)}
          description={translate(ageVerificationUpsellDescription)}
        />
      )}

      <SocialLinkConfigurationForm
        onAdd={handleAdd}
        onSave={handleUpdate}
        onDelete={handleRemove}
        onRefetchLinks={getLinks}
        linkMetadata={linkMetadata}
        savedLinks={savedLinks}
      />
    </section>
  );
};

export default withTranslation(SocialLinksContainer, [
  TranslationNamespace.SocialLinks,
  TranslationNamespace.Error,
  TranslationNamespace.SocialLinksAgeVerificationUpsell,
]);
