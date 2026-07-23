import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  makeStyles,
  FormHelperText,
} from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import IpLoadError from '../../../components/error/IpLoadError';
import {
  TextFieldWithEnhancedHelperText,
  getMaxLengthValidationRule,
} from '../../../components/TextFieldWithEnhancedHelperText';
import { useIpFamiliesQuery } from '../../../ipFamilies/hooks/ipFamily';
import { IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';
import type { ImageAsset } from '../../../utils/uploadImageAssetsIfNeeded';
import useConfirmation from '../../agreements/hooks/useConfirmation';
import EditableImageList from '../../components/EditableImageList';
import {
  MAX_IP_LISTING_NAME_LENGTH,
  MAX_IP_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_THUMBNAIL_COUNT,
} from '../../constants';
import type { ThumbnailValidationError } from '../../utils/validateIpListingThumbnail';
import { validateIpListingThumbnail } from '../../utils/validateIpListingThumbnail';

export interface FormStore {
  ipFamilyId: string;
  name: string;
  description: string;
  thumbnails: ImageAsset[];
}

type ListingFormMode = { type: 'create' } | { type: 'edit' };
const CREATE_MODE: ListingFormMode = { type: 'create' };
export const EDIT_MODE: ListingFormMode = { type: 'edit' };

const useStyles = makeStyles()(() => ({
  semanticGapLargerBottom: {
    marginBottom: 24,
  },

  semanticGapSmallTop: {
    marginTop: 8,
  },
}));

interface Props {
  defaultValues: FormStore;
  onSubmit: (data: FormStore) => void | Promise<void>;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
  mode?: ListingFormMode;
}

/**
 * Form to create and edit IP Listings
 */
const IpListingForm: React.FC<Props> = ({
  defaultValues,
  onSubmit,
  onCancel,
  submitButtonText,
  isSubmitting,
  mode = CREATE_MODE,
}) => {
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformDecoupleListingCreationFromLicenseCreation } = settings;
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const ipFamiliesReq = useIpFamiliesQuery();
  const { confirmWithLoading, confirmationContent } = useConfirmation();
  const [thumbnailValidationErrors, setThumbnailValidationErrors] = useState<
    ThumbnailValidationError[]
  >([]);

  const submitWithConfirmation = async (data: FormStore) => {
    const [result, closeConfirmation] = await confirmWithLoading({
      title: translate('Action.SubmitForReview'),
      description: translate('Description.UpdateListingConfirmation'),
      primaryActionLabel: translate('Action.Submit'),
      isDangerous: true,
    });

    if (!result.confirmed) {
      return;
    }

    try {
      await Promise.resolve(onSubmit(data));
    } finally {
      closeConfirmation();
    }
  };

  const { control, handleSubmit, formState } = useForm<FormStore>({
    defaultValues,
    mode: 'onSubmit',
  });

  const thumbnailFields = useFieldArray({
    name: 'thumbnails',
    control,
    rules: { minLength: 1, required: translate('Label.FieldIsRequired') },
  });

  if (!isFetched || ipFamiliesReq.isPending) {
    return <CircularProgress />;
  }

  if (ipFamiliesReq.isError) {
    return <IpLoadError error={ipFamiliesReq.error} />;
  }

  const { ipFamilies } = ipFamiliesReq.data;

  if (ipFamilies.length === 0) {
    // the only reason users could end up here, is with a direct link.
    // The UI itself should not link to this page until we have at least one IP Family
    return (
      <Grid container direction='column' spacing={3} maxWidth={708}>
        <Grid item>
          <EmptyStateBorder>
            <EmptyState
              title={translate('Heading.NoIpFamily')}
              size='small'
              description={translate('Description.CantCreateIpListingWithoutIpFamily')}>
              <Button
                component={Link}
                href={IP_FAMILY_CREATE_HREF}
                color='primaryBrand'
                variant='contained'>
                {translate('Action.CreateIpFamily')}
              </Button>
            </EmptyState>
          </EmptyStateBorder>
        </Grid>
      </Grid>
    );
  }

  /** error message for the thumbnails list itself (e.g length check) */
  const thumbnailsError = formState.errors.thumbnails?.root?.message;

  return (
    <>
      <Grid
        container
        direction='column'
        spacing={4}
        maxWidth={708}
        component='form'
        onSubmit={
          enableIpPlatformDecoupleListingCreationFromLicenseCreation
            ? handleSubmit(submitWithConfirmation)
            : mode.type === 'edit'
              ? handleSubmit(submitWithConfirmation)
              : handleSubmit(onSubmit)
        }>
        <Grid item>
          <Typography
            variant='h5'
            component='h2'
            className={mode.type === 'edit' ? '' : classes.semanticGapLargerBottom}
            gutterBottom={mode.type === 'edit'}>
            {translate('Label.IpFamily')}
          </Typography>
          {mode.type === 'edit' && (
            <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
              {translate('Description.EditListingDetails')}
            </Typography>
          )}
          <FormControl fullWidth>
            <Controller
              name='ipFamilyId'
              control={control}
              disabled={mode.type === 'edit'}
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  id='ip-family-select'
                  error={!!error}
                  helperText={error?.message}
                  label={translate('Label.IpFamily')}>
                  {ipFamilies.map((family) => (
                    <MenuItem key={family.id} value={family.id}>
                      {family.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
              rules={{ required: translate('Label.FieldIsRequired') }}
            />
          </FormControl>
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Label.ListingDetails')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.ListingDetails')}
          </Typography>
          <Controller
            name='name'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                className={classes.semanticGapLargerBottom}
                id='license-listing-create-name'
                label={translate('Label.Title')}
                fullWidth
                error={!!error}
                helperText={error?.message}
                maxLength={MAX_IP_LISTING_NAME_LENGTH}
                showCharacterCount
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMaxLengthValidationRule(MAX_IP_LISTING_NAME_LENGTH, translate),
            }}
          />
          <Controller
            name='description'
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextFieldWithEnhancedHelperText
                {...field}
                id='license-listing-create-description'
                label={translate('Label.Description')}
                fullWidth
                multiline
                rows={4}
                error={!!error}
                helperText={error?.message}
                maxLength={MAX_IP_LISTING_DESCRIPTION_LENGTH}
                showCharacterCount
              />
            )}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMaxLengthValidationRule(MAX_IP_LISTING_DESCRIPTION_LENGTH, translate),
            }}
          />
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Label.Thumbnails')}
          </Typography>
          <Typography color='secondary' component='p' className={classes.semanticGapLargerBottom}>
            {translate('Description.Thumbnails')}
          </Typography>

          {thumbnailFields.fields.length > 0 && (
            <EditableImageList
              thumbnails={thumbnailFields.fields}
              onReorder={(sourceIndex, destinationIndex) => {
                thumbnailFields.move(sourceIndex, destinationIndex);
              }}
              onRemove={(index) => thumbnailFields.remove(index)}
              disabled={isSubmitting}
              className={classes.semanticGapLargerBottom}
            />
          )}

          <Button
            variant='outlined'
            size='small'
            component='label'
            disabled={isSubmitting || thumbnailFields.fields.length >= MAX_LISTING_THUMBNAIL_COUNT}
            color='primary'>
            <span>{translate('Action.AddImage')}</span>
            <input
              type='file'
              hidden
              multiple
              accept='image/png, image/jpeg'
              aria-label={translate('Action.AddImage')}
              onChange={async (event) => {
                if (event.target.files) {
                  const files = Array.from(event.target.files);

                  const validationResults = await Promise.all(
                    files.map(async (file) => {
                      const validationError = await validateIpListingThumbnail(file);
                      return { file, validationError };
                    }),
                  );

                  const validationErrors: ThumbnailValidationError[] = [];
                  validationResults.forEach(({ file, validationError }) => {
                    if (validationError) {
                      validationErrors.push(validationError);
                    } else {
                      thumbnailFields.append({ file, type: 'new' });
                    }
                  });

                  setThumbnailValidationErrors(validationErrors);

                  // reset the file input
                  // to handle the case where you upload the same file twice (e.g. upload A, delete A, upload A again)
                  // otherwise, the onChange event won't be triggered again
                  const inputEl = event.target;
                  inputEl.value = '';
                }
              }}
            />
          </Button>
          {thumbnailsError && (
            <FormHelperText error className={classes.semanticGapSmallTop}>
              {thumbnailsError}
            </FormHelperText>
          )}
          {thumbnailValidationErrors.length > 0 && (
            <FormHelperText error className={classes.semanticGapSmallTop}>
              {thumbnailValidationErrors.map((error) => (
                <div key={`${error.type}-${error.message}`}>{translate(error.message)}</div>
              ))}
            </FormHelperText>
          )}
          <FormHelperText className={classes.semanticGapSmallTop}>
            {translate('Description.ThumbnailFormat')}
          </FormHelperText>
        </Grid>
        <Grid item container spacing={2}>
          <Grid item>
            <Button
              variant='contained'
              onClick={onCancel}
              disabled={isSubmitting}
              color='secondary'>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button variant='contained' type='submit' loading={isSubmitting}>
              {submitButtonText}
            </Button>
          </Grid>
        </Grid>
      </Grid>
      {confirmationContent}
    </>
  );
};

export default IpListingForm;
