import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler, ControllerRenderProps } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  RobuxIcon,
  Switch,
  TextField,
  Typography,
  VisuallyHidden,
  useSnackbar,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { GetBadgesMetadataResponse } from '@modules/clients/badges';
import badgesClient from '@modules/clients/badges';
import economyClient from '@modules/clients/economy';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import useLanguageManagement from '@modules/localization/localization/hooks/useLanguageManagement';
import { rtlLanguages } from '@modules/localization/translation/constants';
import { CreatorType, Item } from '@modules/miscellaneous/common';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { ConfirmDialog } from '@modules/miscellaneous/components';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import badgeErrorCodeToDescription from '../../constants/badgeErrorCodesDescription';
import BadgesErrorCodes from '../../enums/BadgeErrorCodes';
import useCreateBadgeFormStyles from './CreateBadgeForm.styles';
import type { CreateBadgeFormType } from './types';
import { CreateBadgeFormDefaultValue, CreateBadgeRegisterOptions } from './types';

const { docs } = creatorHub;
export interface CreateBadgeFormProps {
  badgeMetadata: GetBadgesMetadataResponse;
  hasFreeQuota: boolean;
}

const CreateBadgeForm: FunctionComponent<React.PropsWithChildren<CreateBadgeFormProps>> = ({
  badgeMetadata,
  hasFreeQuota,
}) => {
  const {
    classes: {
      createBadgeInfoText,
      createButton,
      priceIcon,
      formContainer,
      inputFormPadding,
      errorMessageStyles,
      rtlInputStyle,
    },
  } = useCreateBadgeFormStyles();
  const { translate, translateHTML } = useTranslation();
  const { enqueue } = useSnackbar();
  const { error } = useMetricsMonitoring();
  const router = useRouter();
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const { sourceLanguageCode } = useLanguageManagement();
  const { register, handleSubmit, control, setValue, formState, getValues, getFieldState } =
    useForm<CreateBadgeFormType>({
      mode: FormMode.OnTouched,
      reValidateMode: FormMode.OnChange,
      defaultValues: CreateBadgeFormDefaultValue,
      shouldUnregister: true,
    });
  const { isSubmitting, errors, isValid, isValidating } = formState;

  const [isConfirmDialogShown, setIsConfirmDialogShown] = useState<boolean>(false);
  const [badgeCreationErrorMsg, setBadgeCreationErrorMsg] = useState<string>('');
  const [currentBalance, setCurrentBalance] = useState<number | undefined>();
  const [isLoadingCurrency, setIsLoadingCurrency] = useState<boolean>(false);

  const createNewBadge = useCallback(
    async (
      universeId: number,
      data: CreateBadgeFormType,
      expectedCost: number,
      paymentResourceType?: string,
    ) => {
      try {
        await badgesClient.postNewBadge(
          universeId,
          data.name,
          data.description,
          paymentResourceType,
          expectedCost,
          data.isItemActive,
          data.file as Blob,
        );
        return true;
      } catch (e) {
        if (e instanceof GenericBEDEV1Error && Object.values(BadgesErrorCodes).includes(e.code)) {
          setBadgeCreationErrorMsg(
            translate(badgeErrorCodeToDescription[e.code as BadgesErrorCodes]),
          );
        } else {
          setBadgeCreationErrorMsg(translate('Message.BadgeCreationFailure'));
        }
        if (typeof e === 'string') {
          error(e);
        }
        return false;
      }
    },
    [translate, error],
  );

  const loadCurrency = useCallback(
    async (creatorType: CreatorType, id: number) => {
      try {
        if (creatorType === CreatorType.User) {
          const userCurrency = await economyClient.getUserCurrency(id);
          setCurrentBalance(userCurrency.robux);
        } else if (creatorType === CreatorType.Group) {
          const groupCurrency = await economyClient.getGroupCurrency(id);
          setCurrentBalance(groupCurrency.robux);
        } else {
          throw new Error('Invalid payment source type');
        }
      } catch (e) {
        if (typeof e === 'string') {
          error(e);
        }
      }
    },
    [error],
  );

  const handleOnUseGroupFundChanged = useCallback(
    async (fieldOnchange: ControllerRenderProps['onChange'], checked: boolean) => {
      setIsLoadingCurrency(true);
      fieldOnchange(checked);
      if (
        !hasFreeQuota &&
        gameDetails &&
        gameDetails.creator &&
        gameDetails.creator.id &&
        user &&
        user.id
      ) {
        await loadCurrency(
          checked ? CreatorType.Group : CreatorType.User,
          checked ? gameDetails.creator.id : user.id,
        );
        setIsLoadingCurrency(false);
      }
    },
    [hasFreeQuota, gameDetails, user, loadCurrency],
  );

  const handleFileChange = useCallback(
    (file: File | null) => {
      setValue('file', file, { shouldValidate: true });
      if (!getFieldState('name').isDirty) {
        setValue('name', file ? file.name : '', { shouldValidate: true });
      }
    },
    [setValue, getFieldState],
  );

  const badgeCreationPrice = useMemo(() => {
    if (!hasFreeQuota && badgeMetadata && badgeMetadata.badgeCreationPrice) {
      return badgeMetadata.badgeCreationPrice;
    }
    return 0;
  }, [badgeMetadata, hasFreeQuota]);

  const handleFormSubmit: SubmitHandler<CreateBadgeFormType> = useCallback(
    (data) => {
      setIsConfirmDialogShown(false);
      setBadgeCreationErrorMsg('');
      if (!isLoadingGame && gameDetails && gameDetails.id) {
        return createNewBadge(
          gameDetails.id,
          data,
          badgeCreationPrice,
          data.isGroupFundUsed ? 'Group' : 'User',
        ).then(async (isBadgeCreatedSuccess) => {
          if (isBadgeCreatedSuccess) {
            const { id: _, ...routerQueryWithoutId } = router.query;
            await router
              .push({
                pathname: `/dashboard/creations/experiences/${gameDetails.id}/associated-items`,
                query: { ...routerQueryWithoutId, activeTab: Item.Badge },
              })
              .then(() => {
                enqueue(
                  {
                    message: translate('Message.BadgeCreationSuccess'),
                    autoHide: true,
                  },
                  (reason) => reason === 'timeout',
                );
              });
          }
        });
      }
      return router.push('/dashboard/creations');
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue.
     */
    [badgeCreationPrice, gameDetails, router, isLoadingGame, createNewBadge, translate],
  );

  const handlePrimaryButtonClick = useCallback(() => {
    if (hasFreeQuota) {
      handleSubmit(handleFormSubmit)();
    } else {
      setIsConfirmDialogShown(true);
    }
  }, [hasFreeQuota, handleSubmit, handleFormSubmit]);

  const handleFormCancel = useCallback(() => {
    const { id: _, ...routerQueryWithoutId } = router.query;
    router.push({
      pathname: `/dashboard/creations/experiences/${gameDetails?.id ?? 0}/associated-items`,
      query: { ...routerQueryWithoutId, activeTab: Item.Badge },
    });
  }, [gameDetails?.id, router]);

  const getTextLengthMessage = (max: number, current: number) => {
    if (current === 0) {
      return translate('Message.CharacterLimit', { limit: String(max) });
    }
    return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
  };

  const inputStyleWithRtlSupport = useMemo(
    () => (rtlLanguages.has(sourceLanguageCode ?? '') ? rtlInputStyle : ''),
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue.
     */
    [sourceLanguageCode],
  );

  useEffect(() => {
    register('file', CreateBadgeRegisterOptions.file);
  });

  useEffect(() => {
    if (user && user.id) {
      loadCurrency(CreatorType.User, user.id);
    }
  }, [user, loadCurrency]);

  return (
    <>
      <Grid container item direction='column' className={formContainer}>
        <Grid container item>
          <Grid item XSmall={12} className={createBadgeInfoText}>
            <Typography variant='body1'>
              {translate('Message.CreateBadgeInfo')}&nbsp;
              <Link
                href={docs.getBadgesPublishingUrl()}
                aria-label={`${translate('Message.CreateBadgeInfo')}${translate(
                  'Label.LearnMore',
                )}`}
                target='_blank'>
                {translate('Label.LearnMore')}
              </Link>
            </Typography>
          </Grid>
        </Grid>

        <Grid container item direction='row' XSmall={12}>
          <ThumbnailImageUploader
            imageAltText={translate('Label.BadgeImage')}
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

        <Grid container item direction='column' XSmall={12} XLarge={6} className={inputFormPadding}>
          <Grid item XSmall={12}>
            <Controller
              name='name'
              control={control}
              rules={CreateBadgeRegisterOptions.name}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.name}
                  fullWidth
                  multiline
                  required
                  id='name'
                  label={translate('Label.Name')}
                  FormHelperTextProps={{ 'aria-live': 'polite' }}
                  helperText={
                    errors.name && errors.name.message
                      ? translate(errors.name.message)
                      : getTextLengthMessage(50, getValues('name').length)
                  }
                  className={inputStyleWithRtlSupport}
                />
              )}
            />
          </Grid>
          <Grid item XSmall={12}>
            <Controller
              name='description'
              control={control}
              rules={CreateBadgeRegisterOptions.description}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.description}
                  fullWidth
                  multiline
                  minRows={6}
                  id='description'
                  label={translate('Label.Description')}
                  FormHelperTextProps={{ 'aria-live': 'polite' }}
                  helperText={
                    errors.description && errors.description.message
                      ? translate(errors.description.message)
                      : getTextLengthMessage(1000, getValues('description').length)
                  }
                  className={inputStyleWithRtlSupport}
                />
              )}
            />
          </Grid>
          <Grid item XSmall={12}>
            <Controller
              name='isItemActive'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      aria-label={translate('Label.BadgeIsEnabled')}
                      onChange={(e) => field.onChange(e.target.checked)}
                      checked={field.value}
                    />
                  }
                  label={translate('Label.BadgeIsEnabled')}
                />
              )}
            />
            <FormHelperText>{translateHTML('Message.BadgeEnabledDescription')}</FormHelperText>
          </Grid>
          {gameDetails?.creator?.type === 'Group' && !hasFreeQuota && (
            <Grid item XSmall={12}>
              <Controller
                name='isGroupFundUsed'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        aria-label='useGroupFundCheckbox'
                        color='secondary'
                        onChange={(e) =>
                          handleOnUseGroupFundChanged(field.onChange, e.target.checked)
                        }
                        checked={field.value}
                      />
                    }
                    label={translate('Label.UseGroupFund', {
                      groupName: gameDetails?.creator?.name ?? '',
                    })}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        <Grid container item spacing={4} XSmall={12} XLarge={8} direction='column'>
          <Grid item XSmall={12}>
            <Typography variant='body1' color='secondary'>
              {translate('Message.CreateBadgeLimitWarningV3', {
                price: `${badgeMetadata?.badgeCreationPrice}`,
              })}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid item XSmall={12}>
            <Button
              variant='outlined'
              color='primary'
              size='large'
              onClick={handleFormCancel}
              disabled={isSubmitting}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              className={createButton}
              data-testid='create-badge-button'
              variant='contained'
              size='large'
              disabled={!isValidating && !isValid}
              onClick={handlePrimaryButtonClick}
              loading={isSubmitting}>
              {hasFreeQuota
                ? translate('Action.CreateBadge')
                : translate('Action.PurchaseBadge', {
                    price: `${badgeMetadata?.badgeCreationPrice}`,
                  })}
            </Button>
            {!hasFreeQuota && (
              <Typography variant='body2' color='secondary'>
                <span>{translate('Label.CurrentBalance')}</span>&nbsp;
                {isLoadingCurrency ? (
                  <CircularProgress size={14} />
                ) : (
                  <Fragment>
                    <RobuxIcon className={priceIcon} /> <span>{currentBalance}</span>
                  </Fragment>
                )}
              </Typography>
            )}
            {badgeCreationErrorMsg && (
              <FormHelperText className={errorMessageStyles}>
                {badgeCreationErrorMsg}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Grid>
      <ConfirmDialog
        open={isConfirmDialogShown}
        onCancel={() => setIsConfirmDialogShown(false)}
        onConfirm={handleSubmit(handleFormSubmit)}
        title={translate('Heading.ConfirmPurchase')}
        content={translateHTML('Message.BadgePurchaseConfirmation', null, {
          price: (
            <span>
              <RobuxIcon className={priceIcon} /> {badgeMetadata?.badgeCreationPrice}
            </span>
          ),
        })}
        confirmText={translate('Action.Yes')}
        cancelText={translate('Action.No')}
      />
    </>
  );
};

export default CreateBadgeForm;
