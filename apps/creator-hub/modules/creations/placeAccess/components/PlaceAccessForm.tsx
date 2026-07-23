import type { FunctionComponent } from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Divider,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InfoOutlinedIcon,
  Link,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useSnackbar,
} from '@rbx/ui';
import developClient from '@modules/clients/develop';
import universesClient from '@modules/clients/universes';
import { FormMode } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { TELEPORT_LEARN_MORE_URL } from '../../access/constants/AccessConstants';
import {
  defaultCustomSocialSlots,
  defaultIsSpecificJoinToNonRootPlacesAllowed,
  defaultMaxPlayerCount,
} from './constants';
import PlaceAccessClearJoinRestrictionsOverrideButton from './PlaceAccessClearJoinRestrictionsOverrideButton';
import usePlaceAccessFormStyles from './PlaceAccessForm.styles';
import type { PlaceAccessFormType } from './types';
import { PlaceAccessSocialSlotStrategy, PlaceJoinRestrictionType } from './types';

export type PlaceAccessFormProps = {
  placeId: number;
  maxPlayersAllowed: number;
  maxPlayerCount: number;
  socialSlotStrategy: PlaceAccessSocialSlotStrategy;
  customSocialSlotsCount: number;
  isSpecificJoinToNonRootPlacesAllowed: boolean;
  hasPlaceOverride: boolean;
  isRootPlace: boolean;
  placeJoinRestrictionType: PlaceJoinRestrictionType;
};

const PlaceAccessForm: FunctionComponent<PropsWithChildren<PlaceAccessFormProps>> = ({
  placeId,
  maxPlayersAllowed,
  maxPlayerCount,
  socialSlotStrategy,
  customSocialSlotsCount,
  isSpecificJoinToNonRootPlacesAllowed,
  hasPlaceOverride,
  isRootPlace,
  placeJoinRestrictionType,
}) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: {
      divider,
      button,
      error,
      info,
      subtitle,
      subtitleAccessControl,
      radioGroup,
      maxPlayer,
      customSlots,
      container,
      switchStyle,
      placeJoinRestrictionSwitchStyle,
      placeJoinRestrictionLabel,
      placeJoinRestrictionContainer,
    },
  } = usePlaceAccessFormStyles();
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValidating, isValid, isDirty },
    trigger,
    getValues,
    resetField,
    reset,
    watch,
    setValue,
  } = useForm<PlaceAccessFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      maxPlayerCount,
      socialSlotStrategy,
      customSocialSlotsCount,
      isSpecificJoinToNonRootPlacesAllowed,
      placeJoinRestrictionType,
    },
    shouldUnregister: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { enqueue } = useSnackbar();
  const router = useRouter();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const { settings } = useSettings();

  const selectedOption = watch('socialSlotStrategy');
  const currentMaxPlayerCount = watch('maxPlayerCount');

  const shouldDisableCustomize = useMemo(() => {
    return !!errors.maxPlayerCount || parseInt(currentMaxPlayerCount.toString(), 10) === 1;
  }, [errors.maxPlayerCount, currentMaxPlayerCount]);

  // Places with max players <= 100: 90% of max players with an upper bound of 20 slots
  // Places with max players > 100: 20% of max players
  const thresholdForLargePlace = 100;
  const socialSlotRatioForLargePlace = 0.2;
  const maxSocialSlotsAllowedForSmallPlace = Math.floor(
    thresholdForLargePlace * socialSlotRatioForLargePlace,
  );

  const [hasPlaceOverrideValue, setHasPlaceOverrideValue] = useState<boolean>(hasPlaceOverride);

  useEffect(() => {
    if (selectedOption !== PlaceAccessSocialSlotStrategy.Customized) {
      resetField('customSocialSlotsCount');
    }
  }, [resetField, selectedOption]);

  useEffect(() => {
    if (shouldDisableCustomize && selectedOption === PlaceAccessSocialSlotStrategy.Customized) {
      setValue('socialSlotStrategy', PlaceAccessSocialSlotStrategy.Disabled);
      resetField('customSocialSlotsCount');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE
(jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
responsible for triaging issue. */
  }, [setValue, resetField, shouldDisableCustomize]);

  const getElementWithInfo = (node: ReactNode, information: string) => {
    return (
      <Grid container direction='row' alignItems='center'>
        <Grid item>{node}</Grid>
        <Grid className={info} item>
          <Tooltip arrow title={information} placement='bottom'>
            <InfoOutlinedIcon fontSize='small' />
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  const handleClickCancelButton = useCallback(() => {
    router.push(`${router.asPath.split('places')[0]}places`);
  }, [router]);

  const handleFormSubmit: SubmitHandler<PlaceAccessFormType> = useCallback(
    async (data) => {
      try {
        setErrorMessage(null);
        const response = await developClient.patchPlaceConfigurationInfo({
          placeId,
          _configuration: {
            maxPlayerCount: data.maxPlayerCount,
            socialSlotType: data.socialSlotStrategy,
            customSocialSlotsCount: data.customSocialSlotsCount,
          },
        });
        resetField('maxPlayerCount', {
          defaultValue: response.maxPlayerCount ?? defaultMaxPlayerCount,
        });
        resetField('customSocialSlotsCount', {
          defaultValue: response.customSocialSlotsCount ?? defaultCustomSocialSlots,
        });
        resetField('socialSlotStrategy', {
          defaultValue: response.socialSlotType as PlaceAccessSocialSlotStrategy,
        });

        if (!isRootPlace) {
          const isOpen = data.placeJoinRestrictionType === PlaceJoinRestrictionType.Open;
          await universesClient.updatePlaceJoinRestrictions({
            placeId,
            placesUpdatePlaceJoinRestrictionsRequest: {
              isSpecificJoinToNonRootPlacesAllowed: isOpen,
              ...(data.placeJoinRestrictionType !== PlaceJoinRestrictionType.Default && {
                placeJoinRestrictionType: data.placeJoinRestrictionType,
              }),
            },
          });
          resetField('isSpecificJoinToNonRootPlacesAllowed', {
            defaultValue: data.isSpecificJoinToNonRootPlacesAllowed,
          });
          resetField('placeJoinRestrictionType', {
            defaultValue: data.placeJoinRestrictionType,
          });
          setHasPlaceOverrideValue(true);
        }

        reset();

        enqueue(
          {
            message: (
              <span data-testid='success-message'>{translate('Message.PlaceAccessUpdated')}</span>
            ),
            autoHide: true,
          },
          (reason) => reason === 'timeout',
        );
      } catch {
        setErrorMessage(translate('Error.FailedToSaveChanges'));
      }
    },
    [enqueue, placeId, resetField, reset, translate, isRootPlace],
  );

  const handleClearJoinRestrictionOverrides = useCallback(async () => {
    const response = await universesClient.getPlaceJoinRestrictions({ placeId });
    const responseType = response.placeJoinRestrictionType;
    const isAllowed =
      response.isSpecificJoinToNonRootPlacesAllowed ?? defaultIsSpecificJoinToNonRootPlacesAllowed;

    let joinRestrictionType;
    if (!responseType || responseType === PlaceJoinRestrictionType.Default) {
      joinRestrictionType = isAllowed
        ? PlaceJoinRestrictionType.Open
        : PlaceJoinRestrictionType.Legacy;
    } else {
      joinRestrictionType = responseType;
    }

    resetField('isSpecificJoinToNonRootPlacesAllowed', {
      defaultValue: isAllowed,
    });
    resetField('placeJoinRestrictionType', {
      defaultValue: joinRestrictionType,
    });
    setHasPlaceOverrideValue(false);
  }, [resetField, placeId]);

  return (
    <Grid className={container}>
      <Grid container item XSmall={12} direction='column'>
        <Grid className={subtitle}>
          <Typography variant='h2'>{translate('Label.BasicSettings')}</Typography>
        </Grid>
        <Grid className={maxPlayer} item XSmall={12} Large={3}>
          <Controller
            name='maxPlayerCount'
            control={control}
            rules={{
              required: translate('Error.FieldCannotBeEmpty'),
              validate: {
                pattern: () => {
                  const regExp = new RegExp(/^[1-9]\d*$/);
                  return (
                    regExp.test(getValues('maxPlayerCount').toString()) ||
                    translate('Error.NumberShouldBeValid')
                  );
                },
                max: () => {
                  return (
                    getValues('maxPlayerCount') <= maxPlayersAllowed ||
                    translate('Error.ValueTooBig', { value: maxPlayersAllowed.toString() })
                  );
                },
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  trigger();
                }}
                error={!!errors.maxPlayerCount}
                id='maxPlayerCount'
                fullWidth
                label={translate('Label.MaxPlayerCount')}
                InputLabelProps={{ shrink: true }}
                helperText={errors.maxPlayerCount && errors.maxPlayerCount.message}
              />
            )}
          />
        </Grid>
      </Grid>
      <Grid container item XSmall={12}>
        <Grid className={subtitle}>
          <Typography variant='h2'>{translate('Label.ServerSettings')}</Typography>
        </Grid>
        <Grid container item XSmall={12} direction='column'>
          <Controller
            name='socialSlotStrategy'
            control={control}
            render={({ field }) => (
              <>
                <FormLabel>{translate('Label.SocialSlots')}</FormLabel>
                <RadioGroup className={radioGroup} {...field}>
                  <FormControlLabel
                    value={PlaceAccessSocialSlotStrategy.RobloxOptimized}
                    control={<Radio aria-label={PlaceAccessSocialSlotStrategy.RobloxOptimized} />}
                    label={getElementWithInfo(
                      translate('Label.RobloxOptimized'),
                      translate('Label.RobloxOptimizedDescription'),
                    )}
                  />
                  <FormControlLabel
                    value={PlaceAccessSocialSlotStrategy.Disabled}
                    control={<Radio aria-label={PlaceAccessSocialSlotStrategy.Disabled} />}
                    label={getElementWithInfo(
                      translate('Label.Disable'),
                      translate('Label.DisableDescription'),
                    )}
                  />
                  <FormControlLabel
                    value={PlaceAccessSocialSlotStrategy.Customized}
                    control={
                      <Radio
                        onChange={(e) => {
                          field.onChange(e);
                          const isSmallPlace = currentMaxPlayerCount <= thresholdForLargePlace;
                          const socialSlotRatio = isSmallPlace ? 1 : socialSlotRatioForLargePlace;

                          const maxSocialSlotsAllowed =
                            currentMaxPlayerCount <= thresholdForLargePlace
                              ? Math.min(
                                  maxSocialSlotsAllowedForSmallPlace,
                                  currentMaxPlayerCount - 1,
                                )
                              : Number.POSITIVE_INFINITY;

                          const calculatedSocialSlots = Math.min(
                            Math.floor(currentMaxPlayerCount * socialSlotRatio),
                            maxSocialSlotsAllowed,
                          );

                          const newSocialSlotsCount = Math.max(calculatedSocialSlots, 1);

                          if (newSocialSlotsCount < customSocialSlotsCount) {
                            setValue('customSocialSlotsCount', newSocialSlotsCount);
                          }
                        }}
                        aria-label={PlaceAccessSocialSlotStrategy.Customized}
                        disabled={shouldDisableCustomize}
                      />
                    }
                    label={getElementWithInfo(
                      translate('Label.Customize'),
                      translate('Label.CustomizeDescription'),
                    )}
                  />
                </RadioGroup>
              </>
            )}
          />
        </Grid>
        {selectedOption === PlaceAccessSocialSlotStrategy.Customized && (
          <Grid className={customSlots} item XSmall={12} Large={3}>
            <Controller
              name='customSocialSlotsCount'
              control={control}
              rules={{
                required: translate('Error.FieldCannotBeEmpty'),
                validate: {
                  pattern: () => {
                    const regExp = new RegExp(/^[1-9]\d*$/);
                    return (
                      regExp.test(getValues('customSocialSlotsCount').toString()) ||
                      translate('Error.NumberShouldBeValid')
                    );
                  },
                  max: () => {
                    const isSmallPlace =
                      getValues('maxPlayerCount') >= 1 &&
                      getValues('maxPlayerCount') <= thresholdForLargePlace;

                    const maxAllowedSocialSlot = isSmallPlace
                      ? Math.max(
                          1,
                          Math.min(
                            getValues('maxPlayerCount') - 1,
                            maxSocialSlotsAllowedForSmallPlace,
                          ),
                        )
                      : Math.floor(socialSlotRatioForLargePlace * getValues('maxPlayerCount'));
                    if (
                      getValues('customSocialSlotsCount') < 1 ||
                      getValues('customSocialSlotsCount') > maxAllowedSocialSlot
                    ) {
                      return translate('Error.SocialSlotAllowedRange', {
                        value: maxAllowedSocialSlot.toString(),
                      });
                    }
                    return true;
                  },
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.customSocialSlotsCount}
                  id='customSocialSlotsCount'
                  fullWidth
                  label={translate('Label.CustomSocialSlots')}
                  InputLabelProps={{ shrink: true }}
                  helperText={
                    errors.customSocialSlotsCount && errors.customSocialSlotsCount.message
                  }
                />
              )}
            />
          </Grid>
        )}
      </Grid>
      {!isRootPlace && (
        <Grid container item XSmall={12}>
          <Grid className={subtitleAccessControl}>
            <Typography variant='h2'>
              {settings.enableSecureTeleports
                ? translate('Label.AccessControlToPlace')
                : translate('Label.JoinSettings')}
            </Typography>
          </Grid>
          {settings.enableSecureTeleports ? (
            <>
              <Grid item XSmall={12}>
                <FormHelperText>
                  {translateHTML('Message.LearnMoreAboutPlaceAccessControls', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return (
                          <Link href={TELEPORT_LEARN_MORE_URL} target='_blank' underline='always'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </FormHelperText>
              </Grid>
              <Grid container item XSmall={12} direction='column'>
                <Grid item XSmall={12} classes={{ root: placeJoinRestrictionSwitchStyle }}>
                  <Controller
                    name='placeJoinRestrictionType'
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field}>
                        <FormControlLabel
                          value={PlaceJoinRestrictionType.Open}
                          control={
                            <Radio aria-label={translate('Label.PlaceJoinRestriction.Open')} />
                          }
                          classes={{ root: placeJoinRestrictionContainer }}
                          label={
                            <Grid
                              container
                              direction='column'
                              className={placeJoinRestrictionLabel}>
                              <Typography variant='body1'>
                                {translate('Label.PlaceJoinRestriction.Open')}
                              </Typography>
                              <FormHelperText>
                                {translate('Description.PlaceJoinRestriction.Open')}
                              </FormHelperText>
                            </Grid>
                          }
                        />
                        <FormControlLabel
                          value={PlaceJoinRestrictionType.Legacy}
                          control={
                            <Radio aria-label={translate('Label.PlaceJoinRestriction.Legacy')} />
                          }
                          classes={{ root: placeJoinRestrictionContainer }}
                          label={
                            <Grid
                              container
                              direction='column'
                              className={placeJoinRestrictionLabel}>
                              <Typography variant='body1'>
                                {translate('Label.PlaceJoinRestriction.Legacy')}
                              </Typography>
                              <FormHelperText>
                                {translate('Description.PlaceJoinRestriction.Legacy')}
                              </FormHelperText>
                            </Grid>
                          }
                        />
                        <FormControlLabel
                          value={PlaceJoinRestrictionType.Secure}
                          control={
                            <Radio aria-label={translate('Label.PlaceJoinRestriction.Secure')} />
                          }
                          classes={{ root: placeJoinRestrictionContainer }}
                          label={
                            <Grid
                              container
                              direction='column'
                              className={placeJoinRestrictionLabel}>
                              <Typography variant='body1'>
                                {translate('Label.PlaceJoinRestriction.Secure')}
                              </Typography>
                              <FormHelperText>
                                {translate('Description.PlaceJoinRestriction.Secure')}
                              </FormHelperText>
                            </Grid>
                          }
                        />
                      </RadioGroup>
                    )}
                  />
                </Grid>
              </Grid>
            </>
          ) : (
            <Grid container item XSmall={12}>
              <Grid item XSmall={12} classes={{ root: switchStyle }}>
                <Controller
                  name='isSpecificJoinToNonRootPlacesAllowed'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          id='allow-specific-join-to-nonroot-places-checkbox'
                          aria-label={translate('Label.AllowDirectJoins')}
                          onChange={(e) => field.onChange(e.target.checked)}
                          checked={field.value}
                        />
                      }
                      label={translate('Label.AllowDirectJoins')}
                    />
                  )}
                />
                <FormHelperText>{translate('Message.NonrootPlaceToggleInfo')}</FormHelperText>
              </Grid>
            </Grid>
          )}

          {hasPlaceOverrideValue && (
            <Grid container item XSmall={12}>
              <Grid item XSmall={12} classes={{ root: switchStyle }}>
                <FormHelperText>
                  {translate('Message.HasPlaceOverrideInfo')}
                  <PlaceAccessClearJoinRestrictionsOverrideButton
                    placeId={placeId}
                    handleClear={handleClearJoinRestrictionOverrides}
                  />
                </FormHelperText>
              </Grid>
            </Grid>
          )}
        </Grid>
      )}
      <Grid item XSmall={12} XLarge={8}>
        <Divider className={divider} />
        <Grid container direction={isCompactView ? 'column' : 'row'}>
          <Button
            data-testid='cancel-button'
            className={button}
            size='large'
            variant='outlined'
            color='primary'
            onClick={handleClickCancelButton}>
            {translate('Label.Cancel')}
          </Button>
          <Button
            data-testid='save-button'
            size='large'
            variant='contained'
            color='primaryBrand'
            loading={isSubmitting}
            disabled={!isValid || isValidating || !isDirty}
            onClick={handleSubmit(handleFormSubmit)}>
            {translate('Label.Save')}
          </Button>
        </Grid>
        {errorMessage && (
          <Grid className={error}>
            <Typography variant='smallLabel2' color='error'>
              {errorMessage}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default PlaceAccessForm;
