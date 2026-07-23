import type { FunctionComponent } from 'react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import type { SubmitHandler, ControllerRenderProps } from 'react-hook-form';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import type { CreateAffiliateLinkResponseAffiliateLink } from '@rbx/client-affiliate-links-api/v1';
import { FallbackType } from '@rbx/client-affiliate-links-api/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  TextField,
} from '@rbx/ui';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import type { TCreateAffiliateLinkProps } from '@modules/react-query/affiliateLinks';
import { useCreateAffiliateLink } from '@modules/react-query/affiliateLinks';
import {
  CAMPAIGN_NAME_TOO_LONG_MESSAGE,
  FILTER_CAMPAIGN_NAME_MESSAGE,
  FILTER_LAUNCH_DATA_MESSAGE,
  INVALID_UNIVERSE_ACCESS_MESSAGE,
  MAX_CHARACTER_LENGTH,
  NOT_UNIQUE_ERROR_MESSAGE,
} from '../constants/shareLinkConstants';
import DebouncedExperienceSearch from './DebouncedExperienceSearch';
import DebouncedPlaceUrlTextField from './DebouncedPlaceUrlTextField';
import LaunchDataInput from './LaunchDataInput';
import LinkFallbackToggle from './LinkFallbackToggle';
import LinkPreview from './LinkPreview';
import useShareLinkDialogStyles from './ShareLinkDialog.styles';
import type { TAffiliateLinkForm } from './types';

type TCreateShareLinkDialogProps = {
  close: VoidFunction;
  getUniverseId: (placeId: number) => Promise<number | null>;
  onCreateLink: (link: CreateAffiliateLinkResponseAffiliateLink) => void;
  isAllowedToCreateForAnyExperience?: boolean;
};

const CreateShareLinkDialog: FunctionComponent<TCreateShareLinkDialogProps> = ({
  close,
  getUniverseId,
  onCreateLink,
  isAllowedToCreateForAnyExperience = false,
}) => {
  const { translate } = useTranslation();
  const group = useCurrentGroup();
  const {
    classes: { helperText, dialogSpacing },
  } = useShareLinkDialogStyles();
  const methods = useForm<TAffiliateLinkForm>({
    mode: 'all',
    defaultValues: { launchDataEnabled: false },
  });
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid },
  } = methods;

  const { mutate: createAffiliateLink, error, isPending } = useCreateAffiliateLink(group?.id);
  const [genericError, setGenericError] = useState<string>();
  const [experienceUrlError, setExperienceUrlError] = useState<string>();
  const launchDataEnabled = watch('launchDataEnabled');
  const campaignName = watch('campaignName');
  const experience = watch('experience');
  const fallbackToHome = watch('fallbackToHome');

  useEffect(() => {
    if (experienceUrlError) {
      setError('experience', { type: 'validate', message: experienceUrlError });
    } else {
      clearErrors('experience');
    }
  }, [clearErrors, experienceUrlError, setError]);

  const handleExperienceChange = useCallback(
    (newValue: TExperience | undefined, fieldOnChange: ControllerRenderProps['onChange']) => {
      setValue('experience', newValue);
      fieldOnChange(newValue);
    },
    [setValue],
  );

  useEffect(() => {
    if (!error) {
      setGenericError(undefined);
      return;
    }
    let errorMessage;
    if (typeof error === 'object' && 'message' in error) {
      errorMessage = error.message;
    }

    if (errorMessage?.endsWith(INVALID_UNIVERSE_ACCESS_MESSAGE)) {
      setError('experience', {
        type: 'validate',
        message: translate('Label.InvalidUniverseAccess'),
      });
      return;
    }

    switch (errorMessage) {
      case NOT_UNIQUE_ERROR_MESSAGE:
        setError('campaignName', { type: 'custom', message: translate('Label.UniqueName') });
        break;
      case FILTER_CAMPAIGN_NAME_MESSAGE:
        setError('campaignName', { type: 'custom', message: translate('Label.FilterError') });
        break;
      case CAMPAIGN_NAME_TOO_LONG_MESSAGE:
        setError('campaignName', {
          type: 'maxLength',
          message: translate('Label.NameTooLong'),
        });
        break;
      case FILTER_LAUNCH_DATA_MESSAGE:
        setError('launchData', { type: 'custom', message: translate('Label.FilterError') });
        break;
      default:
        setGenericError(translate('Label.SomethingWentWrong'));
        break;
    }
  }, [error, setError, translate]);

  // If the experience is not set, disable launchDataEnabled and fallbackToHome
  useEffect(() => {
    if (!experience?.id) {
      setValue('launchDataEnabled', false);
      setValue('fallbackToHome', false);
    }
  }, [setValue, experience?.id]);

  // If launch data is disabled, clear the value
  useEffect(() => {
    if (!launchDataEnabled) {
      setValue('launchData', undefined);
    }
  }, [setValue, launchDataEnabled]);

  const onSubmit: SubmitHandler<TAffiliateLinkForm> = useCallback(
    async (data) => {
      const link: TCreateAffiliateLinkProps = {
        campaignName: data.campaignName.trim(),
        universeId: data.experience?.id,
      };

      // Only encode launch data if it is enabled
      if (data.launchDataEnabled && data.launchData) {
        link.launchData = encodeURI(data.launchData);
      }

      // Only set fallbackType experience is not set and the user is allowed to create for any experience
      if (!data.experience?.id && isAllowedToCreateForAnyExperience) {
        link.fallbackType = fallbackToHome ? FallbackType.Home : undefined;
      }

      createAffiliateLink(link, {
        onSuccess: (response) => {
          onCreateLink(response.affiliateLink);
        },
      });
    },
    [createAffiliateLink, isAllowedToCreateForAnyExperience, onCreateLink, fallbackToHome],
  );

  return (
    <FormProvider {...methods}>
      <DialogTitle classes={{ root: dialogSpacing }}>{translate('Heading.CreateLink')}</DialogTitle>
      <DialogContent>
        <TextField
          {...register('campaignName', {
            maxLength: {
              value: MAX_CHARACTER_LENGTH,
              message: translate('Label.NameTooLong', { maxCharacters: '50' }),
            },
            required: {
              value: true,
              message: translate('Label.CampaignNameRequired'),
            },
          })}
          fullWidth
          id='campaignName'
          label={translate('Label.CampaignName')}
          placeholder={translate('Label.CampaignNamePlaceholder')}
          type='text'
          margin='dense'
          error={!!errors.campaignName?.message}
        />
        <div className={dialogSpacing}>
          <FormHelperText
            classes={{ root: helperText }}
            error={Boolean(errors.campaignName?.message)}>
            {errors.campaignName?.message ||
              (campaignName
                ? translate('Label.CampaignNameGood')
                : translate('Description.CampaignNameHelperText'))}
          </FormHelperText>
        </div>

        <Controller
          name='experience'
          control={control}
          rules={{ required: !isAllowedToCreateForAnyExperience }}
          render={({ field }) => (
            <>
              {isAllowedToCreateForAnyExperience ? (
                <DebouncedPlaceUrlTextField
                  setExperience={(value) => {
                    handleExperienceChange(value, field.onChange);
                  }}
                  getUniverseId={getUniverseId}
                  setError={setExperienceUrlError}
                />
              ) : (
                <DebouncedExperienceSearch
                  value={experience}
                  onSelect={(value) => {
                    handleExperienceChange(value, field.onChange);
                  }}
                  textFieldLabel={translate('Label.Experience')}
                  textPlaceholder={translate('Label.SelectExperience')}
                  required
                />
              )}
            </>
          )}
        />
        <FormHelperText classes={{ root: helperText }} error>
          {errors.experience?.message}
        </FormHelperText>

        {isAllowedToCreateForAnyExperience && (
          <LinkFallbackToggle disabled={experience?.id !== undefined} />
        )}

        <LaunchDataInput disabled={!experience?.id} />

        {genericError && (
          <FormHelperText classes={{ root: helperText }} error>
            {genericError}
          </FormHelperText>
        )}
        {experience?.id && <LinkPreview universeId={experience.id} />}
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={close}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant='contained'
          disabled={!isValid}
          loading={isSubmitting || isPending}>
          {translate('Action.GenerateLink')}
        </Button>
      </DialogActions>
    </FormProvider>
  );
};

export default withTranslation(CreateShareLinkDialog, [TranslationNamespace.ShareLinksManagement]);
