import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import {
  ConfigureUniverseErrorCodes,
  ActivateExperienceErrorCodes,
  developClient,
  tryParseResponseError,
  User,
} from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
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
import { FeedbackBanner } from '@rbx/foundation-ui';
import { Controller, ControllerRenderProps, SubmitHandler, useForm } from 'react-hook-form';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { useRouter } from 'next/router';
import { toastDurationTime, utils, urls, CreatorType } from '@modules/miscellaneous/common';

import type { TGroup } from '@modules/authentication/types';
import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';
import { ACCOUNT_VERIFICATION_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import GenreType from '@modules/experience-genre/enums/GenreType';
import useExperienceGenres from '@modules/experience-genre/hooks/useExperienceGenres';
import { getGenreType } from '@modules/experience-genre/utils/genreTypeUtils';
import { useUpdateExperienceGenre } from '@modules/react-query/experienceGenre';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from '@rbx/react-utilities';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { updateExperienceReleaseStatus } from '@modules/clients/experienceReleasesRequests';
import { ReleaseStatus, ReleaseTransitionError } from '@rbx/clients/experienceReleases';
import {
  useCanSetExperienceReleasesQuery,
  useGetExperienceReleaseStatusQuery,
  getExperienceReleaseStatusQueryKeys,
} from '@modules/react-query/experience-releases/experienceReleasesQueries';
import { useGetActivationEligibilityForUniverse } from '@modules/react-query/develop';
import { useCreatorEligibility, requirements } from '@modules/publishing-permissions';
import { PublishingTier, RequirementStatus } from '@modules/publishing-permissions/types';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import GroupFeaturesStatus from '@modules/group/components/moderation/GroupFeaturesStatus';
import StepsToGoPublicModal from '../../../common/components/StepsToGoPublicModal';
import { fetchUserAmpStatusOfEnableMeshTextureApi } from '../../utils/checkConfigureEligibility';
import {
  ConfigureExperienceFormType,
  Privacy,
  UniverseConfiguration,
} from '../ConfigureExperienceTypes';
import useConfigureExperienceFormStyles from './ConfigureExperienceForm.styles';
import IconAndThumbnail from './IconAndThumbnail';
import OwnershipContainer from '../Ownership/OwnershipContainer';

const { www, creatorHub } = urls;
const EditableMeshEngineDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/EditableMesh`;
const EditableImageEngineDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/classes/EditableImage`;
const DailyPublishLimitReachedDocURL = `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/publishing/publish-experiences-and-places#make-experience-public`;

const { getEnumKeyByValue } = utils;
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
  enableExperienceReleases?: boolean;
  isPublicConnectionsDisabled?: boolean;
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
  enableExperienceReleases = false,
  isPublicConnectionsDisabled = false,
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
    },
  } = useConfigureExperienceFormStyles();
  const queryClient = useQueryClient();
  const { refreshGameDetails, isLoadingGame, gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const { translate, translateHTML } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const router = useRouter();
  const { genreToSubgenre, genreToLocalization } = useExperienceGenres();
  const experienceGenreMutation = useUpdateExperienceGenre();
  const { shouldUseV2: isQuestionnaireV2 } = useQuestionnaireV2Gate();
  const { data: creatorEligibility } = useCreatorEligibility();
  const hasFullPublishingEligibility = useMemo(() => {
    if (!creatorEligibility) return false;
    const completedSet = new Set(creatorEligibility);
    return requirements.every(
      (req) =>
        req.tiers[PublishingTier.Professional] === RequirementStatus.NotRequired ||
        completedSet.has(req.id),
    );
  }, [creatorEligibility]);

  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<
    React.ReactNode | string | null
  >(null);

  const { settings, isFetched } = useSettings();
  const isFeatureMeshTextureApiEnabled = isFetched && settings.enableMeshTextureApisToggle; // todo: replace with fflag
  const { data: releaseStatusData } = useGetExperienceReleaseStatusQuery(
    universeConfiguration.id,
    enableExperienceReleases && !!universeConfiguration.id,
  );
  const isReleaseStatusEnabled = useMemo(
    () => releaseStatusData?.releaseStatus === ReleaseStatus.Beta,
    [releaseStatusData?.releaseStatus],
  );

  const { data: canSetReleaseStatusData } = useCanSetExperienceReleasesQuery(
    universeConfiguration.id,
    enableExperienceReleases && !!universeConfiguration.id,
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
  const [showBetaModeAlert, setShowBetaModeAlert] = useState<boolean>(false);
  const [showPublicPublishModal, setShowPublicPublishModal] = useState<boolean>(false);
  const isGroup = gameDetails?.creator?.type === CreatorType.Group;

  const { data: activationEligibility } = useGetActivationEligibilityForUniverse(
    universeConfiguration.id ? universeConfiguration.id : undefined,
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

  const currentPrivacy = watch('privacy');

  const isDescriptionOrGenreMissing =
    !universeConfiguration.description ||
    !universeConfiguration.genre ||
    universeConfiguration.genre === GenreType.NA;

  const isPrivacyChangeValid = useMemo(() => {
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
  }, [currentPrivacy, activationEligibility, isGroup, isPublicConnectionsDisabled]);
  const handleFormCancel = useCallback(() => {
    router.push(`/dashboard/creations/experiences/${universeConfiguration.id}/overview`);
  }, [router, universeConfiguration]);

  const handleAddLabel = useCallback(() => {
    router.push(
      `/dashboard/creations/experiences/${universeConfiguration.id}/experience-questionnaire`,
    );
  }, [router, universeConfiguration.id]);

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
      const genre = e.target.value as string;
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
      const subgenre = e.target.value as string;
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
    ) => {
      if (
        !dirtyFields.name &&
        !dirtyFields.isStudioAccessToApisAllowed &&
        !dirtyFields.isMeshTextureApiAccessAllowed &&
        !dirtyFields.description &&
        !dirtyFields.privacy
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
    async (universeId: number, privacy: Privacy) => {
      if (!dirtyFields.privacy) {
        return { updated: true };
      }
      try {
        if (privacy === Privacy.Private) {
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
      if ((!dirtyFields.genre && !dirtyFields.subgenre) || genre === GenreType.NA) {
        return { updated: true };
      }
      const genreConverted = genre as GenreType;
      try {
        await experienceGenreMutation.mutateAsync(
          { universeId, genre: genreConverted },
          {
            onSuccess: (data, variables) => {
              queryClient.invalidateQueries({
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
      // 2. Privacy was changed to Private and beta mode was previously enabled
      const shouldUpdateReleaseStatus =
        enableExperienceReleases &&
        (dirtyFields.isReleaseStatusEnabled ||
          (dirtyFields.privacy && privacy === Privacy.Private && isReleaseStatusEnabled));

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
      enableExperienceReleases,
      isReleaseStatusEnabled,
    ],
  );

  const handleFormSubmit: SubmitHandler<ConfigureExperienceFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);
      const genre = getGenreType(data.genre, data.subgenre, genreToSubgenre);

      const isFriendsOnly = data.privacy === Privacy.PublicConnections;

      let updatePrivacyResponse: { updated: boolean; errorMsgKey?: string };
      let updateGenreResponse: { updated: boolean; errorMsgKey?: string };
      let configureExperienceResponse: { updated: boolean; errorMsgKey?: string };
      let updateReleaseStatusResponse: { updated: boolean; errorMsgKey?: string };

      if (data.privacy === Privacy.Private) {
        // if the experience is going private, privacy -> genre -> configuration -> releaseStatus
        updatePrivacyResponse = await updatePrivacy(universeConfiguration.id, data.privacy);
        updateGenreResponse = await updateGenre(universeConfiguration.id, genre);
        configureExperienceResponse = await configureExperience(
          universeConfiguration.id,
          data.name,
          data.description,
          data.isStudioAccessToApisAllowed,
          data.isMeshTextureApiAccessAllowed,
          isFriendsOnly,
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
          isFriendsOnly,
        );
        updateGenreResponse = await updateGenre(universeConfiguration.id, genre);
        updatePrivacyResponse = await updatePrivacy(universeConfiguration.id, data.privacy);
      }

      const errorMsgKey =
        updatePrivacyResponse.errorMsgKey ||
        configureExperienceResponse.errorMsgKey ||
        updateGenreResponse.errorMsgKey ||
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
      } else {
        // eslint-disable-next-line no-lonely-if -- i want to keep the code structure similar to the previous code for readability
        if (dirtyFields.privacy) {
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
      if (
        enableExperienceReleases &&
        data.privacy !== Privacy.Private &&
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

      // Invalidate the release status queries to get fresh data
      if (enableExperienceReleases) {
        const experienceReleaseQueryKeys = getExperienceReleaseStatusQueryKeys(
          universeConfiguration.id,
        );
        experienceReleaseQueryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

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
      enableExperienceReleases,
      setShowBetaModeAlert,
      dirtyFields.isReleaseStatusEnabled,
      queryClient,
      dirtyFields.privacy,
      dirtyFields.description,
      dirtyFields.genre,
      dirtyFields.isMeshTextureApiAccessAllowed,
      dirtyFields.isStudioAccessToApisAllowed,
      dirtyFields.name,
      dirtyFields.subgenre,
    ],
  );

  // This callback is used to add a dialog if genre information changes on
  // submit. If not, handle the form submit as usual.
  const handleFormButton = useCallback(() => {
    if (dirtyFields.subgenre || dirtyFields.genre) {
      setShowGenreChangeDialog(true);
    } else {
      handleSubmit(handleFormSubmit)();
    }
  }, [dirtyFields, handleSubmit, handleFormSubmit]);

  const handleDialogConfirm = useCallback(() => {
    setShowGenreChangeDialog(false);
    handleSubmit(handleFormSubmit)();
  }, [handleSubmit, handleFormSubmit]);

  useEffect(() => {
    if (reset) {
      reset(configureExperienceFormDefaultValue);
    }
  }, [configureExperienceFormDefaultValue, reset]);

  let messageKey: string;
  let isPrivacyStateError: boolean = false;
  let actionButton: React.ReactNode = null;

  if (isPublicConnectionsDisabled && currentPrivacy === Privacy.PublicConnections) {
    if (isGroup) {
      messageKey = 'Tooltip.PublicConnectionsGroupDisabled';
    } else {
      messageKey = 'Tooltip.PublicConnectionsUserDisabled';
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
      messageKey = 'Message.ConnectionsAccessRequireMaturityLabel';
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
        <Fragment>
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
                <Fragment>
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
                </Fragment>
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
        </Fragment>
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
                        <Fragment>
                          <Typography variant='body1' className={radioLabel}>
                            {translate('Label.Public')}
                          </Typography>
                          <Tooltip title={translate('Tooltip.Public')} placement='right' arrow>
                            <InfoOutlinedIcon className={tooltipIcon} />
                          </Tooltip>
                        </Fragment>
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
                              : 'Label.PublicConnectionsUser',
                          )}
                        />
                      }
                      label={
                        <Fragment>
                          <Typography variant='body1' className={radioLabel}>
                            {translate(
                              isGroup
                                ? 'Label.PublicConnectionsGroup'
                                : 'Label.PublicConnectionsUser',
                            )}
                          </Typography>
                          <Tooltip
                            title={translate(
                              isGroup
                                ? 'Tooltip.PublicConnectionsGroup'
                                : 'Tooltip.PublicConnectionsUser',
                            )}
                            placement='right'
                            arrow>
                            <InfoOutlinedIcon className={tooltipIcon} />
                          </Tooltip>
                        </Fragment>
                      }
                    />{' '}
                  </Grid>
                  <Grid item XSmall={12}>
                    <FormControlLabel
                      value={Privacy.Private}
                      control={<Radio aria-label={translate('Label.Private')} />}
                      label={
                        <Fragment>
                          <Typography variant='body1' className={radioLabel}>
                            {translate('Label.Private')}
                          </Typography>
                          <Tooltip title={translate('Tooltip.Private')} placement='right' arrow>
                            <InfoOutlinedIcon className={tooltipIcon} />
                          </Tooltip>
                        </Fragment>
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

        {isPrivacyChangeValid &&
          settings.enableCoreContentStatusLabelLink &&
          isOwnerOrGroupOwner &&
          !hasFullPublishingEligibility && (
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
                        router.push('/settings/eligibility/publishing-permissions');
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

        {enableExperienceReleases &&
          ((currentPrivacy !== Privacy.Private && canSetReleaseStatusData?.allowed) ||
            (currentPrivacy !== Privacy.Private &&
              canSetReleaseStatusData?.reasonEnum === ReleaseTransitionError.Cooldown)) && (
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
                          color='primary'
                          onChange={(e) => field.onChange(e.target.checked)}
                          checked={field.value}
                          size='medium'
                          disabled={
                            enableExperienceReleases &&
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
        {showBetaModeAlert &&
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
                        urls.www.getSponsorExperienceCreateUrl(universeConfiguration.id),
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
        {enableExperienceReleases &&
          ((currentPrivacy === Privacy.Private &&
            canSetReleaseStatusData?.allowed &&
            wasBetaModeEnabledOnLoad) ||
            (currentPrivacy !== Privacy.Private &&
              canSetReleaseStatusData?.reasonEnum === ReleaseTransitionError.Cooldown)) &&
          !watch('isReleaseStatusEnabled') && (
            <Grid item XSmall={12}>
              <Alert severity='info' variant='standard'>
                {translate('Message.Cooldown')}
              </Alert>
            </Grid>
          )}

        {enableExperienceReleases &&
          currentPrivacy !== Privacy.Private &&
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
                          urls.www.getSponsorExperienceCreateUrl(universeConfiguration.id),
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
            disabled={!isDirty || (!isValidating && !isValid) || !isPrivacyChangeValid}
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
