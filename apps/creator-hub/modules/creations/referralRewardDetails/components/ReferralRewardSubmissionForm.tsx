import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { ResponseError } from '@rbx/clients-core';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Link,
  Grid,
  TextField,
  Button,
  VisuallyHidden,
  CircularProgress,
  DateTimePicker,
  PickersUtilsProvider,
} from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { createRewardMetadataClient, updateRewardMetadataClient } from '../utils/client';
import { CONTENT_MUTED_COLOR, REFERRAL_SYSTEM_DOCS_URL } from '../utils/constants';

const MAX_NAME_LENGTH = 16;
const MAX_DESCRIPTION_LENGTH = 60;
const MAX_LIMITS_LENGTH = 180;

interface ReferralRewardSubmissionFormProps {
  onSuccess?: () => void;
  // If we want to do an update instead of a create, we can pass in the props
  // to pre-fill the form with the existing values.
  updateRewardProps?: {
    id: string;
    name: string;
    description: string;
    limits: string;
    from: Date;
    to: Date;
    imageUrl: string | null;
  };
  onUpdateCancel?: () => void;
}

type CreateReferralRewardFormType = {
  name: string;
  description: string;
  limits: string;
  from: Date;
  to: Date;
  file: File | null;
};

const defaultFromDate = new Date();
const defaultToDate = new Date();
defaultToDate.setDate(defaultFromDate.getDate() + 7);

const createRewardFormDefaultValues = {
  name: '',
  description: '',
  limits: '',
  from: defaultFromDate,
  to: defaultToDate,
  file: null,
};

// TODO(npatel, 2025-03-05): Add translations for all copytext in this component. Hook up
// API submission logic.
const ReferralRewardSubmissionForm: React.FC<ReferralRewardSubmissionFormProps> = ({
  onSuccess,
  updateRewardProps,
  onUpdateCancel,
}) => {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteIconState, setDeleteIconState] = useState(false);
  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReferralRewardFormType>({
    mode: FormMode.OnTouched,
    reValidateMode: FormMode.OnChange,
    defaultValues: updateRewardProps || createRewardFormDefaultValues,
    shouldUnregister: true,
  });

  const [apiError, setApiError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (file === null) {
        setDeleteIconState(true);
      } else {
        setDeleteIconState(false);
      }
      setValue('file', file, { shouldValidate: true });
    },
    [setValue, setDeleteIconState],
  );

  const getTextLengthMessage = (max: number, current: number) => {
    if (current === 0) {
      return translate('Message.CharacterLimit', { limit: String(max) });
    }
    return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
  };

  const onUpdate = useCallback(
    async (data: CreateReferralRewardFormType) => {
      if (!gameDetails?.id) {
        return;
      }
      setApiError(null);
      setIsSubmitting(true);
      try {
        const response =
          await updateRewardMetadataClient().updateRewardMetadataUpdateRewardMetadata({
            id: updateRewardProps?.id,
            name: data.name,
            description: data.description,
            limits: data.limits,
            rewardTimeStartTime: new Date(data.from).toISOString(),
            rewardTimeEndTime: new Date(data.to).toISOString(),
            rewardIcon: data.file ? (data.file as Blob) : undefined,
            deleteIcon: deleteIconState,
          });
        if (response.success) {
          reset();
          onSuccess?.();
        }
      } catch (err) {
        const respError = err as ResponseError;
        respError.response.text().then((text: string) => {
          setApiError(text.replaceAll(/['"]+/g, ''));
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [gameDetails?.id, onSuccess, reset, updateRewardProps, deleteIconState],
  );

  const onSubmit = useCallback(
    async (data: CreateReferralRewardFormType) => {
      if (!gameDetails?.id) {
        return;
      }
      if (updateRewardProps) {
        onUpdate(data);
        return;
      }
      setIsSubmitting(true);
      try {
        const response =
          await createRewardMetadataClient().createRewardMetadataCreateRewardMetadata({
            universeId: gameDetails.id.toString(),
            name: data.name,
            description: data.description,
            limits: data.limits,
            rewardTimeStartTime: new Date(data.from).toISOString(),
            rewardTimeEndTime: new Date(data.to).toISOString(),
            rewardIcon: data.file ? (data.file as Blob) : undefined,
          });
        if (response.id) {
          reset();
          onSuccess?.();
        }
      } catch (err) {
        const respError = err as ResponseError;
        respError.response.text().then((text: string) => {
          setApiError(text.replaceAll(/['"]+/g, ''));
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [gameDetails?.id, onSuccess, onUpdate, reset, updateRewardProps],
  );

  const handleCancel = () => {
    if (onUpdateCancel) {
      onUpdateCancel();
      return;
    }
    router.push(`/dashboard/creations/experiences/${gameDetails?.id}/referral-reward-details`);
  };

  return (
    <Grid container item direction='column' gap={1}>
      <Typography variant='body1' style={{ color: CONTENT_MUTED_COLOR, display: 'block' }}>
        <span>{translate('ReferralRewards.EncourageDescription')}</span>
        <Link
          style={{ marginLeft: '5px' }}
          href={REFERRAL_SYSTEM_DOCS_URL}
          color='primary'
          target='_blank'>
          {translate('Action.LearnMore')}
        </Link>
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid
          container
          style={{ marginTop: '16px' }}
          gap={2}
          XSmall={12}
          Medium={6}
          Large={8}
          rowGap={4}>
          <Grid item XSmall={12}>
            <ThumbnailImageUploader
              maxImageSizeMB={2}
              imageUrl={updateRewardProps?.imageUrl ?? undefined}
              imageAltText='rewardIcon'
              ariaDescribedBy='thumbnail-aria-description'
              onChange={handleFileChange}
              imageType={['jpg', 'png', 'tga', 'bmp']}
            />
            <VisuallyHidden id='thumbnail-aria-description' aria-live='polite'>
              {getValues('file')?.name
                ? translate('Label.SelectedFile', { fileName: getValues('file')?.name ?? '' })
                : translate('Label.NoImageUploaded')}
            </VisuallyHidden>
          </Grid>
          <Grid item XSmall={12}>
            <Controller
              control={control}
              name='name'
              rules={{
                required: true,
                maxLength: MAX_NAME_LENGTH,
                minLength: 1,
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id='name'
                  name='name'
                  label={translate('Label.Name')}
                  placeholder={translate('ReferralRewards.Name')}
                  style={{ width: '100%' }}
                  inputProps={{ maxLength: MAX_NAME_LENGTH }}
                  helperText={getTextLengthMessage(MAX_NAME_LENGTH, getValues('name').length)}
                  error={!!errors.name}
                  InputLabelProps={{ shrink: true }}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          <Grid container item direction='row' XSmall={12} columnSpacing={1} rowSpacing={1}>
            <Grid item XSmall={12} Medium={6} Large={6}>
              <Controller
                control={control}
                name='from'
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <PickersUtilsProvider>
                    <DateTimePicker
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          style={{ width: '100%' }}
                          variant='outlined'
                          label={translate('ReferralRewards.From')}
                          id='from'
                        />
                      )}
                      onChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    />
                  </PickersUtilsProvider>
                )}
              />
            </Grid>
            <Grid item XSmall={12} Medium={6} Large={6}>
              <Controller
                control={control}
                name='to'
                rules={{
                  required: true,
                  validate: (value) => {
                    const fromDate = new Date(getValues('from'));
                    const toDate = new Date(value);
                    return toDate > fromDate;
                  },
                }}
                render={({ field }) => (
                  <PickersUtilsProvider>
                    <DateTimePicker
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          style={{ width: '100%' }}
                          variant='outlined'
                          label={translate('ReferralRewards.To')}
                          id='to'
                        />
                      )}
                      onChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                      minDateTime={new Date()}
                    />
                  </PickersUtilsProvider>
                )}
              />
            </Grid>
          </Grid>
          <Grid item XSmall={12} Medium={12} Large={12}>
            <Controller
              control={control}
              name='description'
              rules={{ required: true, maxLength: MAX_DESCRIPTION_LENGTH, minLength: 1 }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id='description'
                  name='description'
                  fullWidth
                  label={translate('ReferralRewards.DescriptionLabel')}
                  style={{ width: '100%' }}
                  placeholder={translate('ReferralRewards.Description')}
                  inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                  helperText={getTextLengthMessage(
                    MAX_DESCRIPTION_LENGTH,
                    getValues('description').length,
                  )}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.description}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          <Grid item XSmall={12} Medium={12} Large={12}>
            <Controller
              control={control}
              name='limits'
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  multiline
                  hiddenLabel
                  name='limits'
                  id='limits'
                  fullWidth
                  placeholder={translate('ReferralRewards.LimitsPlaceholder')}
                  style={{ width: '100%' }}
                  minRows={2}
                  inputProps={{ maxLength: MAX_LIMITS_LENGTH }}
                  helperText={getTextLengthMessage(MAX_LIMITS_LENGTH, getValues('limits').length)}
                  error={!!errors.limits}
                  label={translate('ReferralRewards.AltLimitsLabel')}
                  InputLabelProps={{ shrink: true }}
                  disabled={isSubmitting}
                />
              )}
            />
          </Grid>
          <Grid container item direction='row' XSmall={12} Medium={12} Large={12} columnGap={1}>
            <Grid item>
              <Button
                color='secondary'
                variant='contained'
                size='medium'
                onClick={handleCancel}
                disabled={isSubmitting}>
                {translate('Action.Cancel')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                color='primaryBrand'
                variant='contained'
                size='medium'
                type='submit'
                disabled={isSubmitting || Object.keys(errors).length > 0}>
                {isSubmitting ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  translate('Action.Save')
                )}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
      {apiError}
    </Grid>
  );
};

export default ReferralRewardSubmissionForm;
