import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import type { ControllerRenderProps, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { ReleaseStatus, ReleaseTransitionError } from '@rbx/client-experience-releases-api/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { FeedbackBanner } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  Alert,
  alertClasses,
  AlertTitle,
  Button,
  Checkbox,
  CloseIcon,
  Dialog,
  DialogTemplate,
  Divider,
  ErrorIcon,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Link,
  MenuItem,
  OpenInNewIcon,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useSnackbar,
  WarningIcon,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import type { TGroup } from '@modules/authentication/types';
import developClient, {
  ActivateExperienceErrorCodes,
  ConfigureUniverseErrorCodes,
} from '@modules/clients/develop';
import { updateExperienceReleaseStatus } from '@modules/clients/experienceReleasesRequests';
import type { User } from '@modules/clients/users';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import GenreType from '@modules/experience-genre/enums/GenreType';
import useExperienceGenres from '@modules/experience-genre/hooks/useExperienceGenres';
import { getGenreType } from '@modules/experience-genre/utils/genreTypeUtils';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import GroupFeaturesStatus from '@modules/group/components/moderation/GroupFeaturesStatus';
import { toastDurationTime, CreatorType } from '@modules/miscellaneous/common';
import { ACCOUNT_VERIFICATION_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import { useGetActivationEligibilityForUniverse } from '@modules/react-query/develop';
import {
  useCanSetExperienceReleasesQuery,
  useGetExperienceReleaseStatusQuery,
  getExperienceReleaseStatusQueryKeys,
} from '@modules/react-query/experience-releases/experienceReleasesQueries';
import { useUpdateExperienceGenre } from '@modules/react-query/experienceGenre';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import StepsToGoPublicModal from '../../../common/components/StepsToGoPublicModal';
import { fetchUserAmpStatusOfEnableMeshTextureApi } from '../../utils/checkConfigureEligibility';
import { mapStateToBannerProps } from '../AudienceControls/audienceBannerProps';
import AudienceControls from '../AudienceControls/AudienceControls';
import {
  isPrivateAudienceSelection,
  shouldShowLoseSelectDialog,
} from '../AudienceControls/audienceValidation';
import LoseSelectEligibilityDialog from '../AudienceControls/LoseSelectEligibilityDialog';
import { useAudienceValidation } from '../AudienceControls/useAudienceValidation';
import type {
  ConfigureExperienceFormType,
  UniverseConfiguration,
} from '../ConfigureExperienceTypes';
import { Audience, Privacy } from '../ConfigureExperienceTypes';
import OwnershipContainer from '../Ownership/OwnershipContainer';
import useConfigureExperienceFormStyles from './ConfigureExperienceForm.styles';
import IconAndThumbnail from './IconAndThumbnail';

const EditableMeshEngineDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/EditableMesh`;
const EditableImageEngineDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/EditableImage`;
const DailyPublishLimitReachedDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/publish-experiences-and-places#make-experience-public`;
const SelectEligibilityDocsURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/kids-and-select#publishing-requirements`;

const ConfigureExperienceRegisterOptions = {
  name: {
    required: 'Error.Required',
    maxLength: 50,
  },
  privacy: { required: true },
};

export type UpdatedGenreBannerProps = {
  displayCreatorSelectedGenre: string;
  displayActualGenre: string;
  notifyGenreChange: boolean;
};

export type ConfigureExperienceFormProps = {
  universeConfiguration: UniverseConfiguration;
  isUniverseConfigurationReady: boolean;
  isAmpStatusOfEnableMeshTextureApi: string;
  isOwnerOrGroupOwner: boolean;
  genreLockExpirationTime: Date;
  experienceCreator?: User | TGroup;
  updatedGenreBannerProps: UpdatedGenreBannerProps;
  isPublicConnectionsDisabled?: boolean;
  enableAudienceControls?: boolean;
};

const ConfigureExperienceForm: FunctionComponent<
  React.PropsWithChildren<ConfigureExperienceFormProps>
> = ({
  universeConfiguration,
  isUniverseConfigurationReady,
  isAmpStatusOfEnableMeshTextureApi,
  isOwnerOrGroupOwner,
  genreLockExpirationTime,
  experienceCreator,
  updatedGenreBannerProps,
  isPublicConnectionsDisabled = false,
  enableAudienceControls = false,
}) => {
  const {
    classes: {
      formContainer,
      genreContainer,
      helperMessageStyles,
      inputFormPadding,
      configureButton,
      errorMessageStyles,
      buttonContainer,
      radioLabel,
      tooltipIcon,
      dropdownMenuList,
      warningAlertStyles,
      switchStyle,
      alertButton,
      actionButtonContainer,
      actionButtonCheckEligibility,
      audienceBanner,
    },
    cx,
  } = useConfigureExperienceFormStyles();
  const queryClient = useQueryClient();
  const { refreshGameDetails, isLoadingGame, gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const useTranslationResult = useTranslation();
  const { translate, translateHTML } = useTranslationResult;
  const { translate: translateKey, tPendingTranslation } =
    useTranslationWrapper(useTranslationResult);
  const { enqueue, close } = useSnackbar();
  const router = useRouter();
  const { genreToSubgenre, genreToLocalization } = useExperienceGenres();
  const experienceGenreMutation = useUpdateExperienceGenre();
  const { shouldUseV2: isQuestionnaireV2 } = useQuestionnaireV2Gate();
  const { data: creatorEligibilityResponse } = useCreatorEligibility();
  const hasFullPublishingEligibility =
    creatorEligibilityResponse?.creatorTier === CreatorTierEnum.Everyone;

  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<
    React.ReactNode | string | null
  >(null);

  const { settings, isFetched } = useSettings();
  const isFeatureMeshTextureApiEnabled = isFetched && settings.enableMeshTextureApisToggle; // todo: replace with fflag
  const { data: releaseStatusData } = useGetExperienceReleaseStatusQuery(
    universeConfiguration.id,
    !!universeConfiguration.id,
  );
  const isReleaseStatusEnabled = useMemo(
    () => releaseStatusData?.releaseStatus === ReleaseStatus.Beta,
    [releaseStatusData?.releaseStatus],
  );

  const { data: canSetReleaseStatusData } = useCanSetExperienceReleasesQuery(
    universeConfiguration.id,
    !!universeConfiguration.id,
  );

  // Track if beta mode was already enabled when the page loaded
  const [wasBetaModeEnabledOnLoad, setWasBetaModeEnabledOnLoad] = useState<boolean>(false);

  useEffect(() => {
    if (releaseStatusData) {
      setWasBetaModeEnabledOnLoad((wasEnabled) => {
        if (wasEnabled) {
          return wasEnabled;
        }
        return releaseStatusData.releaseStatus === ReleaseStatus.Beta;
      });
    }
  }, [releaseStatusData]);

  const [ampStatusOfEnableMeshTextureApi, setAmpStatusOfEnableMeshTextureApi] = useState<string>(
    isAmpStatusOfEnableMeshTextureApi,
  );
  const [genreLocked, setGenreLocked] = useState(genreLockExpirationTime > new Date());
  const [renderedGenreLockTime, setRenderedGenreLockTime] = useState(genreLockExpirationTime);

  const [showGenreLockWarningAlert, setShowGenreLockWarningAlert] = useState<boolean>(false);
  const [showGenreChangeDialog, setShowGenreChangeDialog] = useState<boolean>(false);
  const [showLoseSelectDialog, setShowLoseSelectDialog] = useState<boolean>(false);
  const [showBetaModeAlert, setShowBetaModeAlert] = useState<boolean>(false);
  const [showPublicPublishModal, setShowPublicPublishModal] = useState<boolean>(false);
  const isGroup = gameDetails?.creator?.type === CreatorType.Group;

  const { data: activationEligibility } = useGetActivationEligibilityForUniverse(
    universeConfiguration.id || undefined,
  );

  const { locale } = useLocalization();

  const [showUpdatedGenreBanner, setShowUpdatedGenreBanner] = useLocalStorage(
    'showUpdatedGenreBanner',
    true,
  );

  const configureExperienceFormDefaultValue = useMemo(() => {
    return {
      name: universeConfiguration.name,
      description: universeConfiguration.description,
      genre: universeConfiguration.genre,
      subgenre: universeConfiguration.subgenre,
      privacy: universeConfiguration.privacy,
      audiences: universeConfiguration.audiences,
      isStudioAccessToApisAllowed: universeConfiguration.isStudioAccessToApisAllowed,
      isMeshTextureApiAccessAllowed: universeConfiguration.isMeshTextureApiAccessAllowed,
      isReleaseStatusEnabled,
    };
  }, [universeConfiguration, isReleaseStatusEnabled]);

  const { handleSubmit, control, watch, setValue, formState, reset, resetField } =
    useForm<ConfigureExperienceFormType>({
      mode: FormMode.OnChange,
      reValidateMode: FormMode.OnChange,
      defaultValues: configureExperienceFormDefaultValue,
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isValidating, isDirty, dirtyFields } = formState;

  const selectedAudiences = watch('audiences');

  const currentPrivacy = watch('privacy');

  const isAudiencePublic = selectedAudiences?.includes(Audience.Public) ?? false;

  // Single source of truth for whether the "Enable Beta Mode" toggle row is
  // shown. All beta-mode-related messaging (cooldown banner, "Create Campaign"
  // reminders, success alert) is gated by this so we never surface beta copy
  // in states where the user can't even see the toggle.
  const isBetaToggleVisible =
    (enableAudienceControls ? isAudiencePublic : currentPrivacy !== Privacy.Private) &&
    ((canSetReleaseStatusData?.allowed ?? false) ||
      canSetReleaseStatusData?.reasonEnum === ReleaseTransitionError.Cooldown);

  const validation = useAudienceValidation({
    universeId: universeConfiguration.id,
    audiences: selectedAudiences,
    enabled: enableAudienceControls,
    isPublicConnectionsDisabled,
  });

  const isDescriptionOrGenreMissing =
    !universeConfiguration.description ||
    !universeConfiguration.genre ||
    universeConfiguration.genre === (GenreType.NA as string);

  const isPrivacyChangeValid = useMemo(() => {
    if (enableAudienceControls) {
      return true;
    }

    if (isPublicConnectionsDisabled && currentPrivacy === Privacy.PublicConnections) {
      return false;
    }

    if (!activationEligibility) {
      return true;
    }

    if (currentPrivacy === Privacy.Private) {
      return true;
    }

    if (currentPrivacy === Privacy.Public) {
      if (activationEligibility.isPublishToExistingUniverse) {
        return activationEligibility.isEligible;
      }
      if ((activationEligibility.remainingPublicPublishCount ?? 1) > 0) {
        return activationEligibility.isEligible;
      }
      return false;
    }

    if (currentPrivacy === Privacy.PublicConnections) {
      if (!isGroup) {
        return activationEligibility.maturityRated;
      }
      if (activationEligibility.isPublishToExistingUniverse) {
        return activationEligibility.isEligible;
      }
      if ((activationEligibility.remainingPublicPublishCount ?? 1) > 0) {
        return activationEligibility.isEligible;
      }
      return false;
    }

    return false;
  }, [
    currentPrivacy,
    activationEligibility,
    isGroup,
    isPublicConnectionsDisabled,
    enableAudienceControls,
  ]);

  const isAudienceValid = validation.state.type !== 'error';

  const handleFormCancel = useCallback(() => {
    void router.push(`/dashboard/creations/experiences/${universeConfiguration.id}/overview`);
  }, [router, universeConfiguration]);

  const handleAddLabel = useCallback(() => {
    void router.push(
      `/dashboard/creations/experiences/${universeConfiguration.id}/experience-questionnaire`,
    );
  }, [router, universeConfiguration.id]);

  const handleReachMorePlayers = useCallback(() => {
    void router.push(`/dashboard/creations/experiences/${universeConfiguration.id}/audience-reach`);
  }, [router, universeConfiguration.id]);

  const handleViewAudienceReach = useCallback(() => {
    void router.push(`/dashboard/creations/experiences/${universeConfiguration.id}/audience-reach`);
  }, [router, universeConfiguration.id]);

  const handleViewMyPermissions = useCallback(() => {
    void router.push('/settings/eligibility/publishing-permissions');
  }, [router]);

  const handleDailyPublishLimitReached = useCallback(() => {
    window.open(DailyPublishLimitReachedDocURL, '_blank');
  }, []);

  const showBottomToast = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  const handleRadioOnchange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      const privacy = e.target.value as keyof typeof Privacy;
      const selectedPrivacy = Privacy[privacy];
      setValue('privacy', selectedPrivacy);
      if (selectedPrivacy === Privacy.Private) {
        setValue('isReleaseStatusEnabled', false, { shouldDirty: true });
      }

      unifiedLoggerClient.logClickEvent({
        eventName: 'privacyRadioButtonSelected',
        parameters: {
          selection: selectedPrivacy,
          isEligible: `${activationEligibility?.isEligible}`,
          isUserEligibleForPublicPublish: `${activationEligibility?.isUserEligibleForPublicPublish}`,
          isPublishToExistingUniverse: `${activationEligibility?.isPublishToExistingUniverse}`,
          remainingPublicPublishCount: `${activationEligibility?.remainingPublicPublishCount}`,
          maturityRated: `${activationEligibility?.maturityRated}`,
          experienceId: `${universeConfiguration.id}`,
          isGroup: `${isGroup}`,
          currentUserId: `${user?.id}`,
        },
      });

      fieldOnChange(e);
    },
    [setValue, activationEligibility, universeConfiguration.id, user?.id, isGroup],
  );

  const handleSelectOnchangeGenre = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      fieldOnChange: ControllerRenderProps['onChange'],
    ) => {
      if (genreLocked) {
        return;
      }
      const genre = e.target.value;
      setValue('genre', genre);
      setValue('subgenre', '');
      fieldOnChange(e);
      setShowGenreLockWarningAlert((dirtyFields.genre ?? false) || (dirtyFields.subgenre ?? false));
    },
    [setValue, genreLocked, dirtyFields],
  );

  const handleSelectOnchangeSubgenre = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      fieldOnChange: ControllerRenderProps['onChange'],
    ) => {
      if (genreLocked) {
        return;
      }
      const subgenre = e.target.value;
      setValue('subgenre', subgenre);
      fieldOnChange(e);
      setShowGenreLockWarningAlert((dirtyFields.genre ?? false) || (dirtyFields.subgenre ?? false));
    },
    [setValue, genreLocked, dirtyFields],
  );

  const configureExperience = useCallback(
    async (
      universeId: number,
      name: string,
      description: string,
      isStudioAccessToApisAllowed: boolean,
      isMeshTextureApiAccessAllowed: boolean,
      isFriendsOnly?: boolean,
      audiences?: Audience[],
    ) => {
      if (
        !dirtyFields.name &&
        !dirtyFields.isStudioAccessToApisAllowed &&
        !dirtyFields.isMeshTextureApiAccessAllowed &&
        !dirtyFields.description &&
        !dirtyFields.privacy &&
        !dirtyFields.audiences
      ) {
        return { updated: true };
      }
      try {
        await developClient.setUniverseConfigurationV2(
          universeId,
          name,
          description,
          isStudioAccessToApisAllowed,
          isMeshTextureApiAccessAllowed,
          undefined, // allowPrivateServers
          undefined, // privateServerPrice
          isFriendsOnly,
          undefined, // playableDevices
          undefined, // isForSale
          undefined, // price
          undefined, // fiatBasePriceId
          undefined, // fiatProductChangeType
          audiences,
        );
        return { updated: true };
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(ConfigureUniverseErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return { updated: false, errorMsgKey };
      }
    },
    [dirtyFields],
  );

  const updatePrivacy = useCallback(
    async (universeId: number, privacy: Privacy, audiences?: Audience[]) => {
      if (!dirtyFields.privacy && !dirtyFields.audiences) {
        return { updated: true };
      }
      try {
        const isPrivate = audiences
          ? isPrivateAudienceSelection(audiences)
          : privacy === Privacy.Private;

        if (isPrivate) {
          await developClient.deactivateGame(universeId);
        } else {
          await developClient.activateGame(universeId);
        }
        return { updated: true };
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(ActivateExperienceErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return { updated: false, errorMsgKey };
      }
    },
    [dirtyFields],
  );

  const updateGenre = useCallback(
    async (universeId: number, genre: string) => {
      if ((!dirtyFields.genre && !dirtyFields.subgenre) || genre === (GenreType.NA as string)) {
        return { updated: true };
      }
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      const genreConverted = genre as GenreType;
      try {
        await experienceGenreMutation.mutateAsync(
          { universeId, genre: genreConverted },
          {
            onSuccess: (data, variables) => {
              void queryClient.invalidateQueries({
                queryKey: ['experienceGenre', variables.universeId],
              });
              setRenderedGenreLockTime(
                data.details?.updateLockExpirationTime ?? renderedGenreLockTime,
              );
              setGenreLocked(true);
              setShowGenreLockWarningAlert(false);
              setShowUpdatedGenreBanner(true);
            },
          },
        );
        return { updated: true };
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(ActivateExperienceErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return { updated: false, errorMsgKey };
      }
    },
    [
      dirtyFields,
      experienceGenreMutation,
      renderedGenreLockTime,
      queryClient,
      setShowUpdatedGenreBanner,
    ],
  );

  const updateReleaseStatus = useCallback(
    async (universeId: number, privacy: Privacy, status: boolean) => {
      // Update release status if feature is enabled and:
      // 1. The release status field was directly changed, OR
      // 2. Privacy was changed to Private and beta mode was previously enabled, OR
      // 3. Audience controls are on and audience changed to non-Public while beta mode was
      //    previously enabled (the toggle unmounts under non-Public, so dirty tracking on
      //    isReleaseStatusEnabled is lost; we still need to disable beta server-side).
      const privacyChangedToPrivate = Boolean(dirtyFields.privacy && privacy === Privacy.Private);
      const audienceChangedToNonPublic = Boolean(
        enableAudienceControls && dirtyFields.audiences && !isAudiencePublic,
      );
      const shouldUpdateReleaseStatus =
        dirtyFields.isReleaseStatusEnabled ??
        ((privacyChangedToPrivate || audienceChangedToNonPublic) && isReleaseStatusEnabled);

      if (!shouldUpdateReleaseStatus) {
        return { updated: true };
      }
      const releaseStatus = status ? ReleaseStatus.Beta : ReleaseStatus.None;
      try {
        await updateExperienceReleaseStatus({
          createReleaseStatusRequest: {
            universeId,
            releaseStatus,
          },
        });
        return { updated: true };
      } catch (errRes) {
        let errorMsgKey = 'Error.ReleaseStatusEnablement';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(ConfigureUniverseErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        return { updated: false, errorMsgKey };
      }
    },
    [
      dirtyFields.isReleaseStatusEnabled,
      dirtyFields.privacy,
      dirtyFields.audiences,
      enableAudienceControls,
      isAudiencePublic,
      isReleaseStatusEnabled,
    ],
  );

  const handleFormSubmit: SubmitHandler<ConfigureExperienceFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);
      const genre = getGenreType(data.genre, data.subgenre, genreToSubgenre);

      const isFriendsOnly = data.privacy === Privacy.PublicConnections;

      const audiencesForPatch = enableAudienceControls ? data.audiences : undefined;
      const isFriendsOnlyForPatch = enableAudienceControls ? undefined : isFriendsOnly;

      const isGoingPrivate = enableAudienceControls
        ? isPrivateAudienceSelection(data.audiences)
        : data.privacy === Privacy.Private;

      let updatePrivacyResponse: { updated: boolean; errorMsgKey?: string };
      let updateGenreResponse: { updated: boolean; errorMsgKey?: string };
      let configureExperienceResponse: { updated: boolean; errorMsgKey?: string };
      let updateReleaseStatusResponse: { updated: boolean; errorMsgKey?: string };

      if (isGoingPrivate) {
        // if the experience is going private, privacy -> genre -> configuration -> releaseStatus
        updatePrivacyResponse = await updatePrivacy(
          universeConfiguration.id,
          data.privacy,
          enableAudienceControls ? data.audiences : undefined,
        );
        updateGenreResponse = await updateGenre(universeConfiguration.id, genre);
        configureExperienceResponse = await configureExperience(
          universeConfiguration.id,
          data.name,
          data.description,
          data.isStudioAccessToApisAllowed,
          data.isMeshTextureApiAccessAllowed,
          isFriendsOnlyForPatch,
          audiencesForPatch,
        );
        updateReleaseStatusResponse = await updateReleaseStatus(
          universeConfiguration.id,
          data.privacy,
          data.isReleaseStatusEnabled ?? false,
        );
      } else {
        // if the experience is going public, releaseStatus -> configuration -> genre -> privacy
        updateReleaseStatusResponse = await updateReleaseStatus(
          universeConfiguration.id,
          data.privacy,
          data.isReleaseStatusEnabled ?? false,
        );
        configureExperienceResponse = await configureExperience(
          universeConfiguration.id,
          data.name,
          data.description,
          data.isStudioAccessToApisAllowed,
          data.isMeshTextureApiAccessAllowed,
          isFriendsOnlyForPatch,
          audiencesForPatch,
        );
        updateGenreResponse = await updateGenre(universeConfiguration.id, genre);
        updatePrivacyResponse = await updatePrivacy(
          universeConfiguration.id,
          data.privacy,
          enableAudienceControls ? data.audiences : undefined,
        );
      }

      const errorMsgKey =
        updatePrivacyResponse.errorMsgKey ??
        configureExperienceResponse.errorMsgKey ??
        updateGenreResponse.errorMsgKey ??
        updateReleaseStatusResponse.errorMsgKey;

      if (!configureExperienceResponse.updated || !updatePrivacyResponse.updated) {
        setFormSubmissionErrorMsg(
          translateHTML(errorMsgKey ?? 'Error.UnknownError', [
            {
              opening: 'publicEligibilityLinkStart',
              closing: 'publicEligibilityLinkEnd',
              content: (content) => (
                <Link href={creatorHub.docs.getMakeExperiencePublicUrl()}>{content}</Link>
              ),
            },
          ]),
        );
        return;
      }

      const errorFields = [];

      // reset fields if the response is updated. Add to error message if the field update failed.
      if (configureExperienceResponse.updated) {
        resetField('name', { defaultValue: data.name });
        resetField('description', { defaultValue: data.description });
        resetField('isStudioAccessToApisAllowed', {
          defaultValue: data.isStudioAccessToApisAllowed,
        });
        resetField('isMeshTextureApiAccessAllowed', {
          defaultValue: data.isMeshTextureApiAccessAllowed,
        });
      } else {
        if (dirtyFields.name) {
          errorFields.push(translate('Label.Name'));
        }
        if (dirtyFields.description) {
          errorFields.push(translate('Label.Description'));
        }
        if (dirtyFields.isStudioAccessToApisAllowed) {
          errorFields.push(translate('Label.isStudioAccessToApisAllowed'));
        }
        if (isFeatureMeshTextureApiEnabled && dirtyFields.isMeshTextureApiAccessAllowed) {
          errorFields.push(translate('Label.isMeshTextureApiAccessAllowed'));
        }
      }
      if (updatePrivacyResponse.updated && configureExperienceResponse.updated) {
        resetField('privacy', { defaultValue: data.privacy });
        if (data.audiences) {
          resetField('audiences', { defaultValue: data.audiences });
        }
      } else {
        // eslint-disable-next-line no-lonely-if -- i want to keep the code structure similar to the previous code for readability
        if (dirtyFields.privacy || dirtyFields.audiences) {
          errorFields.push(translate('Label.Privacy'));
        }
      }
      if (updateGenreResponse.updated) {
        resetField('genre', { defaultValue: data.genre });
        resetField('subgenre', { defaultValue: data.subgenre });
      } else {
        if (dirtyFields.genre) {
          errorFields.push(translate('Label.Genre'));
        }
        if (dirtyFields.subgenre) {
          errorFields.push(translate('Label.Subgenre'));
        }
      }
      if (updateReleaseStatusResponse.updated) {
        resetField('isReleaseStatusEnabled', { defaultValue: data.isReleaseStatusEnabled });
      } else {
        // eslint-disable-next-line no-lonely-if -- i want to keep the code structure similar to the previous code for readability
        if (dirtyFields.isReleaseStatusEnabled) {
          errorFields.push(translate('Label.EnableBetaMode'));
        }
      }
      if (errorMsgKey) {
        const errorFieldsString = `${translate(errorMsgKey)} ${translate('Error.PartialError', {
          fieldNameList: errorFields.join(', '),
        })}`;
        setFormSubmissionErrorMsg(errorFieldsString);
        return;
      }

      // Show beta mode alert if user successfully saved with privacy=Public and beta mode enabled
      // Otherwise, hide the alert
      const isAudiencePublicForBetaCheck = enableAudienceControls
        ? (data.audiences?.includes(Audience.Public) ?? false)
        : data.privacy !== Privacy.Private;
      if (
        isAudiencePublicForBetaCheck &&
        data.isReleaseStatusEnabled &&
        !dirtyFields.isReleaseStatusEnabled
      ) {
        setShowBetaModeAlert(true);
      } else {
        setShowBetaModeAlert(false);
      }

      if (
        (currentPrivacy === Privacy.Public ||
          (currentPrivacy === Privacy.PublicConnections && isGroup)) &&
        !activationEligibility?.isPublishToExistingUniverse &&
        activationEligibility?.remainingPublicPublishCount
      ) {
        showBottomToast(
          translate('Message.ConfigureExperienceSuccessWithLimit', {
            remaining: (activationEligibility.remainingPublicPublishCount - 1).toString(),
          }),
        );
      } else {
        showBottomToast(translate('Message.ConfigureExperienceSuccess'));
      }
      if (isFeatureMeshTextureApiEnabled) {
        setAmpStatusOfEnableMeshTextureApi(await fetchUserAmpStatusOfEnableMeshTextureApi());
      }

      const experienceReleaseQueryKeys = getExperienceReleaseStatusQueryKeys(
        universeConfiguration.id,
      );
      experienceReleaseQueryKeys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });

      await refreshGameDetails();
    },
    [
      universeConfiguration,
      activationEligibility,
      currentPrivacy,
      isGroup,
      configureExperience,
      refreshGameDetails,
      showBottomToast,
      updatePrivacy,
      translate,
      translateHTML,
      resetField,
      updateGenre,
      genreToSubgenre,
      isFeatureMeshTextureApiEnabled,
      updateReleaseStatus,
      setShowBetaModeAlert,
      dirtyFields.isReleaseStatusEnabled,
      queryClient,
      dirtyFields.privacy,
      dirtyFields.audiences,
      dirtyFields.description,
      dirtyFields.genre,
      dirtyFields.isMeshTextureApiAccessAllowed,
      dirtyFields.isStudioAccessToApisAllowed,
      dirtyFields.name,
      dirtyFields.subgenre,
      enableAudienceControls,
    ],
  );

  // This callback is used to add a dialog if genre information changes on
  // submit. If not, handle the form submit as usual.
  const handleFormButton = useCallback(() => {
    const rawAudiencesDirty = dirtyFields.audiences;
    const isAudiencesDirty =
      !!rawAudiencesDirty &&
      (Array.isArray(rawAudiencesDirty) ? rawAudiencesDirty.some(Boolean) : true);
    if (
      enableAudienceControls &&
      shouldShowLoseSelectDialog(
        validation.state,
        selectedAudiences,
        universeConfiguration.audiences,
        isAudiencesDirty,
      )
    ) {
      setShowLoseSelectDialog(true);
      return;
    }
    if (dirtyFields.subgenre || dirtyFields.genre) {
      setShowGenreChangeDialog(true);
    } else {
      void handleSubmit(handleFormSubmit)();
    }
  }, [
    dirtyFields,
    handleSubmit,
    handleFormSubmit,
    enableAudienceControls,
    validation.state,
    selectedAudiences,
    universeConfiguration.audiences,
  ]);

  const handleLoseSelectContinue = useCallback(() => {
    setShowLoseSelectDialog(false);
    if (dirtyFields.subgenre || dirtyFields.genre) {
      setShowGenreChangeDialog(true);
    } else {
      void handleSubmit(handleFormSubmit)();
    }
  }, [dirtyFields, handleSubmit, handleFormSubmit]);

  const handleLoseSelectCancel = useCallback(() => {
    setShowLoseSelectDialog(false);
  }, []);

  const handleDialogConfirm = useCallback(() => {
    setShowGenreChangeDialog(false);
    void handleSubmit(handleFormSubmit)();
  }, [handleSubmit, handleFormSubmit]);

  useEffect(() => {
    if (reset) {
      reset(configureExperienceFormDefaultValue);
    }
  }, [configureExperienceFormDefaultValue, reset]);

  let messageKey: string;
  let isPrivacyStateError = false;
  let actionButton: React.ReactNode = null;

  if (isPublicConnectionsDisabled && currentPrivacy === Privacy.PublicConnections) {
    if (isGroup) {
      messageKey = 'Tooltip.PublicConnectionsGroupDisabled';
    } else {
      messageKey = 'Tooltip.PublicFriendsUserDisabledTitle';
    }
  } else if (activationEligibility?.isEligible) {
    // if the user is eligible to publish and the message is shown, its because the user has reached the daily publish limit
    messageKey = 'Message.DailyPublicPublishLimitReached';
    isPrivacyStateError = true;
    actionButton = (
      <Grid item XSmall={12} className={actionButtonContainer}>
        <Button
          size='small'
          color='secondary'
          variant='contained'
          onClick={handleDailyPublishLimitReached}>
          {translate('Action.LearnMore')}
        </Button>
      </Grid>
    );
  } else if (currentPrivacy === Privacy.PublicConnections) {
    if (isGroup) {
      messageKey = 'Message.ExperienceNotEligibleForConnectionsAccess';
      actionButton = (
        <Grid item XSmall={12} className={actionButtonContainer}>
          <Button
            size='small'
            color='secondary'
            variant='contained'
            onClick={() => setShowPublicPublishModal(true)}>
            {translate('Action.LearnMore')}
          </Button>
        </Grid>
      );
    } else {
      messageKey = 'Message.FriendsAccessRequireMaturityLabelTitle';
      actionButton = (
        <Grid item XSmall={12} className={actionButtonContainer}>
          <Button size='small' color='secondary' variant='contained' onClick={handleAddLabel}>
            {translate('Action.AddLabel')}
          </Button>
        </Grid>
      );
    }
  } else {
    messageKey = 'Message.ExperienceNotEligibleForPublicAccess';
    actionButton = (
      <Grid item XSmall={12} className={actionButtonContainer}>
        <Button
          size='small'
          color='secondary'
          variant='contained'
          onClick={() => setShowPublicPublishModal(true)}>
          {translate('Action.LearnMore')}
        </Button>
      </Grid>
    );
  }

  const audienceBannerProps = useMemo(
    () =>
      enableAudienceControls
        ? mapStateToBannerProps(validation.state, {
            translate: translateKey,
            tPendingTranslation,
            onViewMyPermissions: handleViewMyPermissions,
            onAddLabel: handleAddLabel,
            onReachMorePlayers: handleReachMorePlayers,
            onViewAudienceReach: handleViewAudienceReach,
            selectLossDocsUrl: SelectEligibilityDocsURL,
          })
        : null,
    [
      enableAudienceControls,
      validation.state,
      translateKey,
      tPendingTranslation,
      handleViewMyPermissions,
      handleAddLabel,
      handleReachMorePlayers,
      handleViewAudienceReach,
    ],
  );

  return (
    <Grid container item className={formContainer}>
      <Grid container item XSmall={12} XLarge={6} className={inputFormPadding}>
        {isGroup && (
          <Grid item>
            <GroupFeaturesStatus />
          </Grid>
        )}
        {updatedGenreBannerProps.notifyGenreChange && showUpdatedGenreBanner && (
          <Grid item XSmall={12} marginBottom='16px'>
            <Alert
              action={[
                <Button
                  key='button'
                  color='inherit'
                  size='small'
                  href={creatorHub.docs.getExperienceGenresAppealUrl()}>
                  {translate('Label.SubmitAppeal')}
                </Button>,
                <IconButton
                  aria-label='bannerClose'
                  key='iconButton'
                  size='small'
                  color='inherit'
                  onClick={() => setShowUpdatedGenreBanner(false)}>
                  <CloseIcon fontSize='small' />
                </IconButton>,
              ]}
              severity='info'
              variant='standard'>
              <AlertTitle>{translate('Heading.ExperienceGenreChanged')}</AlertTitle>
              <span>
                {translateHTML('Label.ExperienceGenreTransition', null, {
                  oldGenre: (
                    <b>
                      {genreToLocalization[updatedGenreBannerProps.displayCreatorSelectedGenre]}
                    </b>
                  ),
                  newGenre: (
                    <b>{genreToLocalization[updatedGenreBannerProps.displayActualGenre]}</b>
                  ),
                })}
              </span>
            </Alert>
          </Grid>
        )}
        <Grid item XSmall={12} marginBottom='16px'>
          <IconAndThumbnail />
        </Grid>
        <Grid item XSmall={12}>
          <Controller
            name='name'
            control={control}
            rules={ConfigureExperienceRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                inputProps={{ maxLength: 50 }}
                label={translate('Label.Name')}
                helperText={
                  errors.name && errors.name.message
                    ? translate(errors.name.message)
                    : translate('Message.CharacterLimit', {
                        limit: '50',
                      })
                }
              />
            )}
          />
        </Grid>

        {isQuestionnaireV2 && isDescriptionOrGenreMissing && (
          <Grid item XSmall={12}>
            <FeedbackBanner
              title=''
              description={translate('Message.AddDescriptionAndGenreForRating')}
              layout='Inline'
              variant='Standard'
              severity='Info'
            />
          </Grid>
        )}

        <Grid item XSmall={12}>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.description}
                fullWidth
                multiline
                id='description'
                inputProps={{ maxLength: 1000 }}
                label={translate('Label.Description')}
                helperText={
                  errors.description && errors.description.message
                    ? translate(errors.description.message)
                    : translate('Message.CharacterLimit', {
                        limit: '1000',
                      })
                }
              />
            )}
          />
        </Grid>
        <>
          <Grid item XSmall={12}>
            <div className={genreContainer}>
              <Controller
                name='genre'
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          className: dropdownMenuList,
                        },
                      },
                    }}
                    fullWidth
                    // Select is disabled instead of controller since
                    // rendering of subgenre is dependent on the value of
                    // genre. Disabling the controller would make the value
                    // undefined.
                    disabled={genreLocked}
                    label={translate('Label.Genre')}
                    value={field.value}
                    onChange={(e) => handleSelectOnchangeGenre(e, field.onChange)}>
                    {Object.keys(genreToSubgenre).map((genre) => (
                      <MenuItem key={genre} value={genre}>
                        {genreToLocalization[genre]}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name='subgenre'
                control={control}
                render={({ field }) => {
                  const genre = watch('genre');
                  if (genre in genreToSubgenre && genreToSubgenre[genre].length > 0) {
                    return (
                      <Select
                        {...field}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              className: dropdownMenuList,
                            },
                          },
                        }}
                        fullWidth
                        // Select is disabled here because disabling the
                        // controller means its value in the form is
                        // undefined. If this is the case and its value in
                        // defaultValues is defined, then isDirty will
                        // always be true. This is important because the save
                        // button is not disabled if isDirty is true.
                        disabled={genreLocked}
                        label={translate('Label.Subgenre')}
                        value={field.value}
                        onChange={(e) => handleSelectOnchangeSubgenre(e, field.onChange)}>
                        <MenuItem key='none' value=''>
                          {translate('Label.None')}
                        </MenuItem>
                        {genreToSubgenre[genre].map((subgenre) => (
                          <MenuItem key={subgenre} value={subgenre}>
                            {genreToLocalization[subgenre]}
                          </MenuItem>
                        ))}
                      </Select>
                    );
                  }
                  // eslint-disable-next-line react/jsx-no-useless-fragment -- render function doesn't allow us to return null
                  return <Fragment />;
                }}
              />
            </div>
            <FormHelperText className={helperMessageStyles}>
              {genreLocked ? (
                <>
                  <span>
                    {translate('Message.ChangesRestricted', {
                      date: renderedGenreLockTime.toLocaleDateString(locale?.toString(), {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                    })}
                  </span>{' '}
                  <Link
                    href={creatorHub.docs.getExperienceGenresUrl()}
                    color='inherit'
                    underline='always'>
                    {translate('Label.LearnMore')}
                  </Link>
                </>
              ) : (
                <span>
                  {translateHTML('Message.GenreDefinitions', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return (
                          <Link
                            href={creatorHub.docs.getGenreDefinitionsUrl()}
                            color='inherit'
                            underline='always'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </span>
              )}
            </FormHelperText>
          </Grid>
          {showGenreLockWarningAlert && (
            <Grid item XSmall={12}>
              <Alert severity='warning' variant='standard' className={warningAlertStyles}>
                <AlertTitle>
                  <span> {translate('Message.GenreLockDuration')}</span>{' '}
                  <Link
                    href={creatorHub.docs.getExperienceGenresUrl()}
                    color='inherit'
                    underline='always'>
                    {translate('Label.LearnMore')}
                  </Link>
                </AlertTitle>
              </Alert>
            </Grid>
          )}
        </>
        {enableAudienceControls ? (
          <>
            <AudienceControls
              control={control}
              isGroup={isGroup}
              groupName={experienceCreator?.name ?? ''}
            />
            {audienceBannerProps && (
              <Grid container item XSmall={12}>
                <FeedbackBanner
                  {...audienceBannerProps}
                  className={cx('width-full', audienceBanner)}
                />
              </Grid>
            )}
          </>
        ) : (
          <>
            <Grid container item XSmall={12}>
              <FormLabel>{translate('Label.Privacy')}</FormLabel>
              <Grid item XSmall={12}>
                <Controller
                  name='privacy'
                  control={control}
                  rules={ConfigureExperienceRegisterOptions.privacy}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      id='privacy'
                      onChange={(e) => handleRadioOnchange(e, field.onChange)}>
                      <Grid item XSmall={12}>
                        <FormControlLabel
                          value={Privacy.Public}
                          control={<Radio aria-label={translate('Label.Public')} />}
                          label={
                            <>
                              <Typography variant='body1' className={radioLabel}>
                                {translate('Label.Public')}
                              </Typography>
                              <Tooltip title={translate('Tooltip.Public')} placement='right' arrow>
                                <InfoOutlinedIcon className={tooltipIcon} />
                              </Tooltip>
                            </>
                          }
                        />{' '}
                      </Grid>
                      <Grid item XSmall={12}>
                        <FormControlLabel
                          value={Privacy.PublicConnections}
                          control={
                            <Radio
                              aria-label={translate(
                                isGroup
                                  ? 'Label.PublicConnectionsGroup'
                                  : 'Label.PublicFriendsUserTitle',
                              )}
                            />
                          }
                          label={
                            <>
                              <Typography variant='body1' className={radioLabel}>
                                {translate(
                                  isGroup
                                    ? 'Label.PublicConnectionsGroup'
                                    : 'Label.PublicFriendsUserTitle',
                                )}
                              </Typography>
                              <Tooltip
                                title={translate(
                                  isGroup
                                    ? 'Tooltip.PublicConnectionsGroup'
                                    : 'Tooltip.PublicFriendsUser',
                                )}
                                placement='right'
                                arrow>
                                <InfoOutlinedIcon className={tooltipIcon} />
                              </Tooltip>
                            </>
                          }
                        />{' '}
                      </Grid>
                      <Grid item XSmall={12}>
                        <FormControlLabel
                          value={Privacy.Private}
                          control={<Radio aria-label={translate('Label.Private')} />}
                          label={
                            <>
                              <Typography variant='body1' className={radioLabel}>
                                {translate('Label.Private')}
                              </Typography>
                              <Tooltip title={translate('Tooltip.Private')} placement='right' arrow>
                                <InfoOutlinedIcon className={tooltipIcon} />
                              </Tooltip>
                            </>
                          }
                        />
                      </Grid>
                    </RadioGroup>
                  )}
                />
              </Grid>
              <Typography variant='smallLabel1' color='secondary'>
                {translate('Message.Privacy')}
              </Typography>
            </Grid>

            {!isPrivacyChangeValid && (
              <Grid container item XSmall={12}>
                <Alert
                  severity={isPrivacyStateError ? 'error' : 'warning'}
                  variant='outlined'
                  icon={
                    isPrivacyStateError ? (
                      <ErrorIcon sx={{ alignSelf: 'center' }} />
                    ) : (
                      <WarningIcon sx={{ alignSelf: 'center' }} />
                    )
                  }
                  action={actionButton}
                  sx={{ width: '100%' }}>
                  <Typography variant='tableHead'>{translate(messageKey)}</Typography>
                </Alert>
              </Grid>
            )}

            {isPrivacyChangeValid && isOwnerOrGroupOwner && !hasFullPublishingEligibility && (
              <Grid container item XSmall={12}>
                <Alert
                  severity='info'
                  variant='outlined'
                  icon={<InfoOutlinedIcon sx={{ alignSelf: 'center' }} />}
                  action={
                    <Grid item XSmall={12} className={actionButtonCheckEligibility}>
                      <Button
                        size='small'
                        color='secondary'
                        variant='contained'
                        onClick={() => {
                          unifiedLoggerClient.logClickEvent({
                            eventName: 'checkPublishingEligibilityClicked',
                            parameters: {
                              universeId: String(universeConfiguration.id),
                              currentPrivacy,
                            },
                          });
                          void router.push('/settings/eligibility/publishing-permissions');
                        }}>
                        {translate('Action.CheckEligibility')}
                      </Button>
                    </Grid>
                  }
                  sx={{ width: '100%' }}>
                  <Typography variant='tableHead'>
                    {translate('Message.PublishingPermissionsNotice')}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </>
        )}

        {isBetaToggleVisible && (
          <Grid container item XSmall={12}>
            <Grid item XSmall={12}>
              <FormLabel>{translate('Label.EnableBetaMode')}</FormLabel>
            </Grid>
            <Grid item XSmall={12}>
              <Typography variant='smallLabel1' color='secondary'>
                {translate('Message.BetaModeNarrowDescription')}
              </Typography>
            </Grid>

            <Grid item XSmall={12} className={switchStyle}>
              <Controller
                name='isReleaseStatusEnabled'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        aria-label={translate('Label.EnableBetaMode')}
                        onChange={(e) => field.onChange(e.target.checked)}
                        checked={field.value}
                        size='medium'
                        disabled={
                          canSetReleaseStatusData?.reasonEnum === ReleaseTransitionError.Cooldown
                        }
                      />
                    }
                    label={translate('Label.EnableBetaMode')}
                  />
                )}
              />
            </Grid>
          </Grid>
        )}
        {/* Only show the alert if beta mode has been successfully enabled after the user has saved the form */}
        {isBetaToggleVisible &&
          showBetaModeAlert &&
          !isDirty &&
          watch('isReleaseStatusEnabled') &&
          canSetReleaseStatusData?.reasonEnum !== ReleaseTransitionError.Cooldown && (
            <Grid item XSmall={12}>
              <Alert
                severity='success'
                variant='standard'
                action={
                  <Button
                    size='small'
                    color='inherit'
                    endIcon={<OpenInNewIcon />}
                    onClick={() =>
                      window.open(
                        www.getSponsorExperienceCreateUrl(universeConfiguration.id),
                        '_blank',
                      )
                    }
                    className={alertButton}>
                    {translate('Label.CreateCampaign')}
                  </Button>
                }>
                <AlertTitle>{translate('Heading.AdsAlertTitle')}</AlertTitle>
                {translate('Message.BetaAdsReminder')}
              </Alert>
            </Grid>
          )}
        {isBetaToggleVisible &&
          canSetReleaseStatusData?.reasonEnum === ReleaseTransitionError.Cooldown &&
          !watch('isReleaseStatusEnabled') && (
            <Grid item XSmall={12}>
              <Alert severity='info' variant='standard'>
                {translate('Message.Cooldown')}
              </Alert>
            </Grid>
          )}

        {isBetaToggleVisible &&
          isReleaseStatusEnabled &&
          wasBetaModeEnabledOnLoad &&
          !showBetaModeAlert &&
          watch('isReleaseStatusEnabled') && (
            <Grid container item XSmall={12}>
              <Grid item XSmall={12}>
                <Alert
                  severity='info'
                  variant='standard'
                  action={
                    <Button
                      size='small'
                      endIcon={<OpenInNewIcon />}
                      color='inherit'
                      sx={{ whiteSpace: 'nowrap' }}
                      onClick={() =>
                        window.open(
                          www.getSponsorExperienceCreateUrl(universeConfiguration.id),
                          '_blank',
                        )
                      }>
                      {translate('Label.CreateCampaign')}
                    </Button>
                  }
                  sx={{
                    [`& .${alertClasses.action}`]: {
                      alignItems: 'center',
                      marginTop: 0,
                      paddingTop: 0,
                    },
                  }}>
                  {translate('Message.BetaAdsReminder')}
                </Alert>
              </Grid>
            </Grid>
          )}

        <Grid container item XSmall={12}>
          <Grid item XSmall={12}>
            <FormLabel>
              {tPendingTranslation(
                'APIs',
                'Section label for the API access checkboxes on the experience settings page',
                translationKey('Label.APIs', TranslationNamespace.ConfigureItem),
              )}
            </FormLabel>
          </Grid>
          <Grid item XSmall={12}>
            <Controller
              name='isStudioAccessToApisAllowed'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      aria-label='isStudioAccessToApisAllowedCheckbox'
                      color='secondary'
                      checked={field.value}
                    />
                  }
                  label={translate('Label.isStudioAccessToApisAllowed')}
                />
              )}
            />
          </Grid>

          <Grid
            container
            item
            XSmall={12}
            display={isFeatureMeshTextureApiEnabled ? 'block' : 'none'}>
            <Grid item XSmall={12}>
              <Controller
                name='isMeshTextureApiAccessAllowed'
                control={control}
                disabled={ampStatusOfEnableMeshTextureApi !== 'Granted' || !isOwnerOrGroupOwner}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        aria-label='isMeshTextureApiAccessAllowedCheckbox'
                        color='secondary'
                        checked={field.value}
                      />
                    }
                    label={translate('Label.isMeshTextureApisAllowed')}
                  />
                )}
              />
            </Grid>
            {!isOwnerOrGroupOwner && (
              <FormHelperText>
                {translate('Description.EnableMeshTextureApisNotOwner')}&nbsp;
              </FormHelperText>
            )}
            {ampStatusOfEnableMeshTextureApi !== 'Granted' &&
              ampStatusOfEnableMeshTextureApi !== 'Actionable' &&
              isOwnerOrGroupOwner && (
                <FormHelperText>
                  {translateHTML('Description.EnableMeshTextureApisIdDenied', [
                    {
                      opening: 'LinkStart',
                      closing: 'LinkEnd',
                      content(chunks) {
                        return (
                          <Link href={ACCOUNT_VERIFICATION_URL} target='_blank'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </FormHelperText>
              )}
            {ampStatusOfEnableMeshTextureApi === 'Granted' && isOwnerOrGroupOwner && (
              <FormHelperText>
                {translateHTML('Description.isMeshTextureApisAllowed', [
                  {
                    opening: 'EditableMeshLinkStart',
                    closing: 'EditableMeshLinkEnd',
                    content(chunks) {
                      return (
                        <Link href={EditableMeshEngineDocURL} target='_blank'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                  {
                    opening: 'EditableImageLinkStart',
                    closing: 'EditableImageLinkEnd',
                    content(chunks) {
                      return (
                        <Link href={EditableImageEngineDocURL} target='_blank'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                  {
                    opening: 'LinkStart',
                    closing: 'LinkEnd',
                    content(chunks) {
                      return (
                        <Link href={settings.meshTextureApisUsagePolicyUrl} target='_blank'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ])}
              </FormHelperText>
            )}
            {ampStatusOfEnableMeshTextureApi === 'Actionable' && isOwnerOrGroupOwner && (
              <FormHelperText>
                {translateHTML('Description.EnableMeshTextureApisIdActionable', [
                  {
                    opening: 'VerifyAgeLinkStart',
                    closing: 'VerifyAgeLinkEnd',
                    content(chunks) {
                      return (
                        <Link href={www.getAccountSettingsUrl()} target='_blank'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                  {
                    opening: 'RobloxLinkStart',
                    closing: 'RobloxLinkEnd',
                    content(chunks) {
                      return (
                        <Link href={www.getUrl()} target='_blank'>
                          {chunks}
                        </Link>
                      );
                    },
                  },
                ])}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item XSmall={12} XLarge={6}>
          <OwnershipContainer
            universeId={universeConfiguration.id}
            experienceCreator={experienceCreator}
          />
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8}>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid container item XSmall={12} className={buttonContainer}>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={handleFormCancel}
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            className={configureButton}
            data-testid='configure-experience-button'
            variant='contained'
            size='large'
            disabled={
              !isDirty ||
              (!isValidating && !isValid) ||
              (enableAudienceControls ? !isAudienceValid : !isPrivacyChangeValid)
            }
            onClick={handleFormButton}
            loading={isSubmitting || isLoadingGame || !isUniverseConfigurationReady}>
            {translate('Action.SaveChanges')}
          </Button>
          <Dialog open={showGenreChangeDialog} onClose={() => setShowGenreChangeDialog(false)}>
            <DialogTemplate
              title={translate('Title.ChangeGenre')}
              content={translate('Description.ChangeGenre')}
              cancelText={translate('Action.BackToEditing')}
              onCancel={() => setShowGenreChangeDialog(false)}
              confirmText={translate('Action.Confirm')}
              onConfirm={handleDialogConfirm}
            />
          </Dialog>
          <LoseSelectEligibilityDialog
            open={showLoseSelectDialog}
            onContinue={handleLoseSelectContinue}
            onCancel={handleLoseSelectCancel}
          />
          {formSubmissionErrorMsg && (
            <FormHelperText className={errorMessageStyles}>{formSubmissionErrorMsg}</FormHelperText>
          )}
        </Grid>
      </Grid>
      {universeConfiguration.id && (
        <StepsToGoPublicModal
          open={showPublicPublishModal}
          onClose={() => setShowPublicPublishModal(false)}
          universeId={universeConfiguration.id}
        />
      )}
    </Grid>
  );
};

export default ConfigureExperienceForm;
