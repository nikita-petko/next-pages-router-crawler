import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  TextField,
  Typography,
} from '@rbx/ui';
import {
  useForm,
  SubmitHandler,
  FormProvider,
  ControllerRenderProps,
  Controller,
} from 'react-hook-form';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useEditAffiliateLink, TEditAffiliateLinkProps } from '@modules/react-query/affiliateLinks';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import {
  AffiliateLink,
  CreateAffiliateLinkResponseAffiliateLink,
  FallbackType,
} from '@rbx/clients/affiliateLinksApi';
import type { TExperience } from '@modules/home/providers/ExperienceProvider';
import useShareLinkDialogStyles from './ShareLinkDialog.styles';
import LinkPreview from './LinkPreview';
import getShareLink from './getShareLink';
import LaunchDataInput from './LaunchDataInput';
import { TAffiliateLinkForm } from './CreateShareLinkDialog';
import DebouncedPlaceUrlTextField from './DebouncedPlaceUrlTextField';
import DebouncedExperienceSearch from './DebouncedExperienceSearch';
import { INVALID_UNIVERSE_ACCESS_MESSAGE } from '../constants/shareLinkConstants';
import LinkFallbackToggle from './LinkFallbackToggle';

type TEditShareLinkDialogProps = {
  affiliateLink: AffiliateLink;
  close: VoidFunction;
  getUniverseId: (placeId: number) => Promise<number | null>;
  onEditLink: (link: CreateAffiliateLinkResponseAffiliateLink) => void;
  isAllowedToCreateForAnyExperience?: boolean;
};

const EditShareLinkDialog: FunctionComponent<TEditShareLinkDialogProps> = ({
  affiliateLink,
  close,
  getUniverseId,
  onEditLink,
  isAllowedToCreateForAnyExperience = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const group = useCurrentGroup();
  const {
    classes: { helperText, dialogSpacing },
  } = useShareLinkDialogStyles();
  const methods = useForm<TAffiliateLinkForm>({
    mode: 'all',
    defaultValues: {
      experience: affiliateLink.universe
        ? {
            id: affiliateLink.universe.universeId,
            name: affiliateLink.universe.universeName,
            rootPlaceId: affiliateLink.universe.rootPlaceId,
          }
        : undefined,
      launchData: affiliateLink.launchData ? decodeURI(affiliateLink.launchData) : undefined,
      launchDataEnabled: Boolean(affiliateLink.launchData),
      fallbackToHome: Boolean(affiliateLink.fallbackType === FallbackType.Home),
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isValid, isValidating, isDirty },
  } = methods;

  const { mutate: editAffiliateLink, error, isPending } = useEditAffiliateLink(group?.id);
  const [genericError, setGenericError] = useState<string>();
  const [experienceUrlError, setExperienceUrlError] = useState<string>();
  const launchDataEnabled = watch('launchDataEnabled');
  const experience = watch('experience');
  const fallbackToHome = watch('fallbackToHome');

  useEffect(() => {
    if (experienceUrlError) {
      setError('experience', { type: 'validate', message: experienceUrlError });
    } else {
      clearErrors('experience');
    }
  }, [clearErrors, experienceUrlError, setError, translate]);

  const handleExperienceChange = useCallback(
    (newValue: TExperience | undefined, fieldOnChange: ControllerRenderProps['onChange']) => {
      setValue('experience', newValue);
      fieldOnChange(newValue);
    },
    [setValue],
  );

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

  // Set the fallbackToHome value based on the affiliateLink
  useEffect(() => {
    if (affiliateLink.fallbackType) {
      setValue('fallbackToHome', affiliateLink.fallbackType === FallbackType.Home);
    }
  }, [setValue, affiliateLink.fallbackType]);

  useEffect(() => {
    if (!error) {
      setGenericError(undefined);
      return;
    }

    if (error.message?.endsWith(INVALID_UNIVERSE_ACCESS_MESSAGE)) {
      setError('experience', {
        type: 'validate',
        message: translate('Label.InvalidUniverseAccess'),
      });
      return;
    }

    setGenericError(translate('Label.SomethingWentWrong'));
  }, [error, setError, translate]);

  const onSubmit: SubmitHandler<TAffiliateLinkForm> = useCallback(
    async (data) => {
      const link: TEditAffiliateLinkProps = {
        linkId: affiliateLink.linkId,
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

      editAffiliateLink(link, {
        onSuccess: (response) => {
          onEditLink(response.affiliateLink);
        },
      });
    },
    [
      affiliateLink.linkId,
      editAffiliateLink,
      isAllowedToCreateForAnyExperience,
      onEditLink,
      fallbackToHome,
    ],
  );

  const hasFormChanged = useCallback(() => {
    return (
      !isValid ||
      isDirty ||
      Boolean(affiliateLink.launchData) !== launchDataEnabled ||
      Boolean(affiliateLink.fallbackType === FallbackType.Home) !== Boolean(fallbackToHome)
    );
  }, [isValid, isDirty, launchDataEnabled, fallbackToHome, affiliateLink]);

  return (
    <FormProvider {...methods}>
      <DialogTitle classes={{ root: dialogSpacing }}>
        {affiliateLink.referralCodeType === 'Custom'
          ? translate('Label.EditVanityLink')
          : translate('Label.EditLink')}
      </DialogTitle>
      <DialogContent>
        <div className={dialogSpacing}>
          <Typography variant='body1' color='secondary'>
            {/** NOTE (@mbae, 10/03/24): This translation is for both normal and vanity links */}
            {translateHTML(
              'Label.SelectVanityLinkExperience',
              [
                {
                  opening: 'joinLinkStart',
                  closing: 'joinLinkEnd',
                  content(chunks) {
                    return <b>{chunks}</b>;
                  },
                },
              ],
              {
                joinLink: getShareLink(affiliateLink).replace(/^https:\/\/www\./, ''),
              },
            )}
          </Typography>
        </div>
        <TextField
          {...register('campaignName', {})}
          disabled
          fullWidth
          value={affiliateLink.campaignName}
          id='campaignName'
          label={translate('Label.CampaignName')}
          type='text'
          margin='dense'
        />
        <div className={dialogSpacing}>
          <FormHelperText disabled classes={{ root: helperText }}>
            {translate('Label.CampaignNameNotChangeable')}
          </FormHelperText>
        </div>

        <Controller
          name='experience'
          control={control}
          rules={{ required: !isAllowedToCreateForAnyExperience }}
          render={({ field }) => (
            <Fragment>
              {isAllowedToCreateForAnyExperience ? (
                <DebouncedPlaceUrlTextField
                  setExperience={(value) => {
                    handleExperienceChange(value, field.onChange);
                  }}
                  defaultValue={
                    affiliateLink.universe?.rootPlaceId
                      ? `https://www.${process.env.robloxSiteDomain}/games/${affiliateLink.universe.rootPlaceId}`
                      : ''
                  }
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
            </Fragment>
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
          disabled={!hasFormChanged()}
          loading={isSubmitting || isPending || isValidating}>
          {translate('Label.SaveChanges')}
        </Button>
      </DialogActions>
    </FormProvider>
  );
};

export default withTranslation(EditShareLinkDialog, [TranslationNamespace.ShareLinksManagement]);
