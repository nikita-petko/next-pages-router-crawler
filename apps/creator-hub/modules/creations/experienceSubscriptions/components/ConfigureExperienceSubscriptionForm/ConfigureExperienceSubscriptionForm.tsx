import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { FailureReason } from '@rbx/client-developer-subscriptions-api/v1';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  FileCopyOutlinedIcon,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { GetExperienceSubscriptionResponse } from '@modules/clients/experienceSubscriptions';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { getResponseFromError } from '@modules/clients/utils';
import { FormMode } from '@modules/miscellaneous/common';
import {
  ROBLOX_COMMUNITY_STANDARDS,
  SUBSCRIPTION_TERMS_OF_USE,
} from '@modules/miscellaneous/common/constants/linkConstants';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ConfigureSubscriptionRegisterOptions } from '../../constants/ConfigureSubscriptionRegisterOptions';
import type { CreateSubscriptionFormType } from '../../constants/CreateSubscriptionRegisterConstants';
import {
  CreateSubscriptionRegisterOptions,
  ProductTypeMenuSelection,
  SubscriptionPeriodMenuSelection,
  ImageDimension,
} from '../../constants/CreateSubscriptionRegisterConstants';
import getPriceChangeCooldownErrorArgs from '../../utils/getPriceChangeCooldownErrorArgs';
import parseExperienceSubscriptionErrorCode from '../../utils/parseExperienceSubscriptionErrorCode';
import useSubscriptionFormStyles from '../ExperienceSubscription.styles';
import ExperienceSubscriptionDialog from '../ExperienceSubscriptionDialog';
import ExperienceSubscriptionFormErrorText from '../ExperienceSubscriptionFormErrorText';
import { ExperienceSubscriptionLimitErrorMessage } from '../ExperienceSubscriptionFormMessages';

type TConfigureExperienceSubscriptionFormProps = {
  experienceSubscriptionDetailsInfo: GetExperienceSubscriptionResponse;
  priceTierMap?: Record<string, Money>;
  refreshData: () => void;
};

// TODO: (@kevinli 08172023): SUBS-1845, breakup component into smaller pieces
// oxlint-disable-next-line react/react-compiler -- pre-existing: useForm from react-hook-form is flagged as incompatible
function ConfigureExperienceSubscriptionForm({
  experienceSubscriptionDetailsInfo,
  priceTierMap,
}: TConfigureExperienceSubscriptionFormProps) {
  const {
    classes: {
      formContainer,
      createButton,
      errorMessageStyle,
      inputFormPadding,
      buttonContainerStyle,
      copyIconStyle,
    },
  } = useSubscriptionFormStyles();
  const { user } = useAuthentication();
  const { translate, translateHTML } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { register, formState, handleSubmit, control, setValue, watch, setError } =
    useForm<CreateSubscriptionFormType>({
      mode: FormMode.OnTouched,
      reValidateMode: FormMode.OnChange,
      defaultValues: {
        name: experienceSubscriptionDetailsInfo.name ?? undefined,
        description: experienceSubscriptionDetailsInfo.description ?? undefined,
        productType: (experienceSubscriptionDetailsInfo.productType ?? '').toString(),
        price: '',
        period: (experienceSubscriptionDetailsInfo.periodType ?? '').toString(),
        file: null,
        currencyType: 'fiat',
        priceInRobux: 0,
        isRegionalPricingEnabled: false,
      },
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isDirty, isValidating } = formState;

  const [subscriptionErrorMsg, setSubscriptionErrorMsg] = useState<string>('');
  const [subscriptionErrorArgs, setSubscriptionErrorArgs] = useState<
    { [key: string]: string } | undefined
  >(undefined);
  const [isConfigureDialogShown, setIsConfigureDialogShown] = useState(false);
  const [canUpdateDescription, setCanUpdateDescription] = useState(false);

  useEffect(() => {
    setCanUpdateDescription(true);
  }, []);

  // ! (@kevinli 02/12/23) for details see:
  // ! https://github.com/react-hook-form/react-hook-form/issues/4704
  // ! doesn't seem like there is a good solution right now when a field
  // ! need to be `File`, which extends `Object`, than waiting for library
  // ! level typing fixes
  const inputDescription = watch('description');
  const inputFile = watch('file');

  const displayPrice = useMemo(() => {
    if (
      typeof priceTierMap !== 'undefined' &&
      typeof experienceSubscriptionDetailsInfo.basePriceId !== 'undefined' &&
      experienceSubscriptionDetailsInfo.basePriceId !== null
    ) {
      const priceData = priceTierMap[experienceSubscriptionDetailsInfo.basePriceId];
      if (priceData) {
        return `$${priceData.units}.${priceData.cents}`;
      }
    }
    return '';
  }, [experienceSubscriptionDetailsInfo.basePriceId, priceTierMap]);

  const showSnackbar = useCallback(
    (msg: string, isSuccess: boolean) => {
      enqueue({
        children: <Alert severity={isSuccess ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  useEffect(() => {
    register('file', ConfigureSubscriptionRegisterOptions.file);
  }, [register]);

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const handleFormCancel = useCallback(() => {
    void router.push(
      `/dashboard/creations/experiences/${String(router.query.id)}/associated-items?activeTab=Subscription`,
    );
  }, [router]);

  const communityStandardsLink = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank' color='inherit' underline='always'>
        {chunks}
      </Link>
    ),
    [],
  );

  const termsOfUseLink = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={SUBSCRIPTION_TERMS_OF_USE} target='_blank' color='inherit' underline='always'>
        {chunks}
      </Link>
    ),
    [],
  );

  const uploadImage = useCallback(
    async (
      data: CreateSubscriptionFormType,
      experienceSubscriptionId: string,
    ): Promise<[boolean, string]> => {
      try {
        const product = await experienceSubscriptionsClient.getExperienceSubscription(
          gameDetails?.id ?? 0,
          experienceSubscriptionId,
        );
        if (product.id !== undefined) {
          const response = await experienceSubscriptionsClient.uploadImage(
            gameDetails?.id ?? 0,
            experienceSubscriptionId,
            user?.id ?? 0,
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pre-existing: file is validated before reaching here
            data.file as Blob,
          );
          if (response.status) {
            return [true, ''];
          }
        }
      } catch (e) {
        const errorResponse = getResponseFromError(e);
        const { errorKey } = await parseExperienceSubscriptionErrorCode(errorResponse);
        return [
          false,
          translate(errorKey === 'Error.FileTooLarge' ? errorKey : 'Error.UploadImageFailure'),
        ];
      }
      return [false, translate('Error.UploadImageFailure')];
    },
    [user?.id, gameDetails?.id, translate],
  );

  const updateExperienceSubscription = useCallback(
    async (universeId: number, data: CreateSubscriptionFormType) => {
      let subscriptionUpdateSuccess = true;

      if (
        data.description.length > 0 &&
        data.description !== experienceSubscriptionDetailsInfo.description
      ) {
        try {
          await experienceSubscriptionsClient.updateExperienceSubscription(
            universeId,
            experienceSubscriptionDetailsInfo.id ?? '0',
            experienceSubscriptionDetailsInfo.imageAssetId ?? 0,
            data.description,
          );
        } catch (e) {
          subscriptionUpdateSuccess = false;
          const errorResponse = getResponseFromError(e);
          const { errorKey, errorObject } =
            await parseExperienceSubscriptionErrorCode(errorResponse);

          setSubscriptionErrorMsg(errorKey);
          setSubscriptionErrorArgs(
            errorObject?.failureReason === FailureReason.PriceChangeCooldown
              ? getPriceChangeCooldownErrorArgs(errorObject.details)
              : undefined,
          );

          if (
            errorObject?.failureReason === FailureReason.ProductContentModerated &&
            errorObject.details
          ) {
            const moderatedDescription = errorObject.details.description ?? data.description;

            setValue('description', moderatedDescription);

            if (moderatedDescription !== data.description) {
              setError('description', { type: 'manual', message: 'Error.InputTextModerated' });
            }
          }
        }
      }

      return subscriptionUpdateSuccess;
    },
    [experienceSubscriptionDetailsInfo, setError, setValue],
  );

  const handleFormSubmit: SubmitHandler<CreateSubscriptionFormType> = useCallback(
    async (data) => {
      setSubscriptionErrorMsg('');
      setSubscriptionErrorArgs(undefined);
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        const experienceSubscriptionId = experienceSubscriptionDetailsInfo.id;

        if (experienceSubscriptionId) {
          let subscriptionUpdateSuccess = true;

          if (canUpdateDescription) {
            subscriptionUpdateSuccess = await updateExperienceSubscription(gameDetails.id, data);
          }

          if (!subscriptionUpdateSuccess) {
            setIsConfigureDialogShown(false);
            return;
          }

          let imageUploadSuccess = true;
          let imageUploadError = '';
          if (data.file !== null && data.file !== undefined) {
            [imageUploadSuccess, imageUploadError] = await uploadImage(
              data,
              experienceSubscriptionId,
            );
          }

          if (imageUploadSuccess) {
            await queryClient.invalidateQueries({
              queryKey: ['universes', gameDetails.id, 'subscriptions'],
            });

            await router.push(
              `/dashboard/creations/experiences/${gameDetails.id}/associated-items?activeTab=Subscription`,
            );

            showSnackbar(translate('Message.UpdateSubscriptionSuccess'), true);
          } else {
            showSnackbar(imageUploadError, false);
          }

          setIsConfigureDialogShown(false);
        }
        return;
      }
      void router.push('/dashboard/creations');
    },
    [
      isLoadingGame,
      gameDetails,
      router,
      queryClient,
      experienceSubscriptionDetailsInfo.id,
      canUpdateDescription,
      updateExperienceSubscription,
      uploadImage,
      showSnackbar,
      translate,
    ],
  );

  const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void navigator.clipboard.writeText(`EXP-${experienceSubscriptionDetailsInfo.id}`);
    showSnackbar(translate('Message.CopiedSubscriptionID'), true);
  };

  return (
    <>
      <Grid container item direction='column' classes={{ root: formContainer }}>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.UpdateSubscription')}
        </Typography>

        <Grid container item direction='column' marginTop={-2}>
          <Grid container item direction='row' alignItems='center'>
            <Typography color='primary' variant='subtitle1'>
              {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- "EXP-" is a product identifier prefix, not translatable */}
              {`${translate('Label.SubscriptionID')}: EXP-${experienceSubscriptionDetailsInfo.id}`}
            </Typography>
            <IconButton
              aria-label='copy'
              color='secondary'
              size='small'
              classes={{ root: copyIconStyle }}
              onClick={copyToClipboard}>
              <FileCopyOutlinedIcon fontSize='small' />
            </IconButton>
          </Grid>
          <br />
          <Typography color='primary' variant='subtitle1'>
            {`${translate('Label.LastUpdated')}: ${new Date(
              experienceSubscriptionDetailsInfo.updatedTimestampMs ?? 0,
            ).toLocaleString()}`}
          </Typography>
        </Grid>

        {!canUpdateDescription && (
          <Alert
            severity='warning'
            variant='outlined'
            sx={{
              border: 0,
            }}>
            <AlertTitle>{translate('Heading.UpdateSubscriptionWarning')}</AlertTitle>
          </Alert>
        )}

        <Grid container item direction='row' XSmall={12}>
          <ThumbnailImageUploader
            onChange={handleFileChange}
            imageType={['jpg', 'png', 'bmp']}
            imageDimensionWidth={ImageDimension}
            imageDimensionHeight={ImageDimension}
            targetId={experienceSubscriptionDetailsInfo.imageAssetId ?? undefined}
            targetType={ThumbnailTypes.assetThumbnail}
          />
        </Grid>

        <Grid
          container
          item
          direction='column'
          XSmall={12}
          XLarge={6}
          classes={{ root: inputFormPadding }}>
          <Grid item XSmall={12}>
            <Controller
              name='name'
              control={control}
              rules={CreateSubscriptionRegisterOptions.name}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.name}
                  fullWidth
                  multiline
                  required
                  disabled
                  id='name'
                  label={translate('Label.SubscriptionName')}
                  inputProps={{
                    maxLength: CreateSubscriptionRegisterOptions.name.maxLength,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item XSmall={12}>
            <Controller
              name='description'
              control={control}
              rules={CreateSubscriptionRegisterOptions.description}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.description}
                  fullWidth
                  disabled={!canUpdateDescription}
                  multiline
                  minRows={6}
                  id='description'
                  label={translate('Label.Description')}
                  inputProps={{
                    maxLength: CreateSubscriptionRegisterOptions.description.maxLength,
                  }}
                  helperText={
                    canUpdateDescription && (
                      <ExperienceSubscriptionLimitErrorMessage
                        error={errors.description}
                        charCount={field.value.length}
                        limit={CreateSubscriptionRegisterOptions.description.maxLength}
                      />
                    )
                  }
                />
              )}
            />
          </Grid>

          <Grid item XSmall={12}>
            <Controller
              name='productType'
              control={control}
              rules={CreateSubscriptionRegisterOptions.productType}
              render={({ field }) => (
                <Select
                  {...field}
                  fullWidth
                  disabled
                  error={!!errors.productType}
                  id='productType'
                  label={translate('Label.ProductType')}
                  required
                  InputProps={{
                    'aria-label': 'productType',
                  }}
                  sx={{
                    '& .MuiSelect-icon': {
                      fontSize: '0',
                    },
                  }}>
                  {ProductTypeMenuSelection.map((menuItem) => {
                    return (
                      <MenuItem
                        data-testid={`product${menuItem.value}`}
                        key={menuItem.value}
                        value={menuItem.value}>
                        <Grid container item direction='column'>
                          <Typography>{translate(menuItem.name)}</Typography>
                          <Typography variant='captionBody' color='secondary' display='block'>
                            {translate(menuItem.description)}
                          </Typography>
                        </Grid>
                      </MenuItem>
                    );
                  })}
                </Select>
              )}
            />
          </Grid>

          <Grid item XSmall={12}>
            <TextField
              value={displayPrice}
              fullWidth
              multiline
              required
              disabled
              id='price'
              label={translate('Label.Price')}
            />
          </Grid>

          <Grid item XSmall={12}>
            <Controller
              name='period'
              control={control}
              rules={CreateSubscriptionRegisterOptions.period}
              render={({ field }) => (
                <Select
                  {...field}
                  fullWidth
                  error={!!errors.period}
                  id='period'
                  label={translate('Label.SubscriptionPeriod')}
                  required
                  disabled // Monthly is the only currently available recurrence cadence
                  sx={{
                    '& .MuiSelect-icon': {
                      fontSize: '0',
                    },
                  }}>
                  {SubscriptionPeriodMenuSelection.map((menuItem) => {
                    return (
                      <MenuItem key={menuItem.value} value={menuItem.value}>
                        {translate(menuItem.name)}
                      </MenuItem>
                    );
                  })}
                </Select>
              )}
            />
          </Grid>
        </Grid>
        <Grid container item XSmall={12} XLarge={8} direction='column'>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid item XSmall={12} classes={{ root: buttonContainerStyle }}>
            <Grid container direction={isCompactView ? 'column' : 'row'}>
              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={handleFormCancel}
                disabled={isSubmitting}>
                {translate('Action.Cancel')}
              </Button>
              <Button
                classes={{ root: createButton }}
                data-testid='save-changes-button'
                variant='contained'
                size='large'
                disabled={
                  (!isValidating && !isValid) ||
                  !isDirty ||
                  (inputDescription === experienceSubscriptionDetailsInfo.description &&
                    (inputFile === null || inputFile === undefined))
                }
                onClick={() => setIsConfigureDialogShown(true)}
                loading={isSubmitting}>
                {translate('Action.SaveChanges')}
              </Button>
            </Grid>
            <ExperienceSubscriptionFormErrorText
              subscriptionErrorMsg={subscriptionErrorMsg}
              subscriptionErrorArgs={subscriptionErrorArgs}
              errorMessageStyle={errorMessageStyle}
              communityStandardsLink={communityStandardsLink}
            />
          </Grid>
        </Grid>
      </Grid>
      <ExperienceSubscriptionDialog
        isOpen={isConfigureDialogShown}
        onConfirm={handleSubmit(handleFormSubmit)}
        onCancel={() => setIsConfigureDialogShown(false)}
        title='Heading.UpdateSubscription'
        content={
          <>
            <Typography color='primary' paragraph>
              {inputDescription !== experienceSubscriptionDetailsInfo.description &&
                translateHTML('Description.UpdateSubscriptionConfirmation', [
                  {
                    opening: 'LinkStart',
                    closing: 'LinkEnd',
                    content(chunks) {
                      return termsOfUseLink(chunks);
                    },
                  },
                ])}
            </Typography>
            <Typography color='primary' paragraph>
              {inputFile !== null &&
                inputFile !== undefined &&
                translate('Message.UpdateSubscriptionConfirmation')}
            </Typography>
          </>
        }
        confirmText='Action.YesConfirm'
        cancelText='Action.NoGoBack'
        loading={isSubmitting}
      />
    </>
  );
}

export default ConfigureExperienceSubscriptionForm;
