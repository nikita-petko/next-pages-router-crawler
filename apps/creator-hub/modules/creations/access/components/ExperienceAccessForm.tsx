import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import type { ControllerRenderProps, SubmitHandler } from 'react-hook-form';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import type { RobloxApiDevelopModelsUniverseSettingsRequestV2PlayableDevicesEnum as DevicesV2Type } from '@rbx/client-develop/v2';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Button,
  Checkbox,
  CloseIcon,
  Divider,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Link,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  Typography,
} from '@rbx/ui';
/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises -- pre-existing: promise-returning handlers passed to void-expecting props */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison -- pre-existing: enum-to-primitive comparisons */
/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- pre-existing: narrow type assertions */
/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion -- pre-existing */
import { useAuthentication } from '@modules/authentication/providers';
import developClient, {
  ActivateExperienceErrorCodes,
  DevicesType,
  FiatProductChangeType,
  FiatProductModerationStatus,
} from '@modules/clients/develop';
import UniverseSettingsErrorCode from '@modules/clients/develop/enums/UniverseSettingsErrorCode';
import type {
  CreatorControlsAgeRestriction,
  CreatorControlsGeoRestriction,
} from '@modules/clients/experienceGuidelinesService';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import groupsClient from '@modules/clients/groups';
import universesClient from '@modules/clients/universes';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { CreatorType } from '@modules/miscellaneous/common';
import { PRIVATE_SERVER_LEARN_MORE_URL } from '@modules/miscellaneous/common/constants/linkConstants';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils/enumUtils';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useDeactivateProduct } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  devicesTypeTranslationKeys,
  FIAT_PAID_ACCESS_LEARN_MORE_URL,
  TELEPORT_LEARN_MORE_URL,
  MinimumRobuxPriceForPlaceSales,
} from '../constants/AccessConstants';
import { openAccessChangeConfirmationDialog } from '../dialogs/AccessChangeConfirmationDialog';
import type { AccessChangeType } from '../dialogs/AccessChangeConfirmationDialog';
import type {
  CountryInfo,
  DevicesTypeForm,
  ExperienceAccessFormType,
  UniverseAccessConfiguration,
  ExperienceAccessMetaData,
} from '../ExperienceAccessTypes';
import {
  AccessType,
  PaymentType,
  Privacy,
  PlaceJoinRestrictionType,
} from '../ExperienceAccessTypes';
import getPriceChangeTooSoonMessage from '../utils/getPriceChangeTooSoonMessage';
import ExperienceAccessAge from './ExperienceAccessAge';
import ExperienceAccessClearJoinRestrictionsOverridesButton from './ExperienceAccessClearJoinRestrictionsOverridesButton';
import useExperienceAccessFormStyles from './ExperienceAccessForm.styles';
import ExperienceAccessPayment from './ExperienceAccessPayment';
import ExperienceAccessPaymentType from './ExperienceAccessPaymentType';
import ExperienceAccessRegion from './ExperienceAccessRegion';
import ExperiencePrivateServerCard from './ExperiencePrivateServerCard';

const hasPositivePrivateServerPrice = (price: number | undefined): boolean =>
  typeof price !== 'undefined' && price > 0;

type Props = {
  universeAccessConfiguration: UniverseAccessConfiguration;
  universeAccessMetaData: ExperienceAccessMetaData;
  showVrDeviceOption: boolean | null;
  allCountries: CountryInfo[];
  enableAudienceControls?: boolean;
  enableAudiencesReplacement?: boolean;
  isAudiencePublic?: boolean;
  showTvDeviceOption?: boolean;
};

// oxlint-disable-next-line react/react-compiler
function ExperienceAccessForm({
  universeAccessConfiguration,
  universeAccessMetaData,
  showVrDeviceOption,
  showTvDeviceOption,
  allCountries,
  enableAudienceControls = false,
  enableAudiencesReplacement = false,
  isAudiencePublic = true,
}: Props) {
  // When audience controls are enabled and the audience is not Public, the
  // user cannot enable private servers or paid access; disable those controls.
  const isAudienceNonPublicLocked = enableAudienceControls && !isAudiencePublic;
  const {
    classes: {
      formContainer,
      section,
      controls,
      saveChangesButton,
      switchStyle,
      privateServerGrid,
      errorMessageStyle,
      buttonContainer,
      devicesTooltip,
      toolTipLabelContainer,
      tooltipLabel,
      title,
      placeAccessFormHelperText,
      placeJoinRestrictionLabel,
      placeJoinRestrictionContainer,
      placeJoinRestrictionRadioGroup,
    },
  } = useExperienceAccessFormStyles();
  const { translate, translateHTML } = useTranslation();
  const locale = useLocalization().locale ?? Locale.English;

  const { gameDetails, refreshGameDetails } = useCurrentGame();
  const { user } = useAuthentication();
  const [isCurrentUserGroupOwner, setIsCurrentUserGroupOwner] = useState<boolean | undefined>();
  const { settings, isFetched } = useSettings();
  const enableCreatorControlsAgeGate = isFetched && settings.enableCreatorControlsAgeGate;
  const enableCreatorControlsGeoGate = isFetched && settings.enableCreatorControlsGeoGate;
  const [fiatProductModerationStatus, setFiatProductModerationStatus] = useState<
    FiatProductModerationStatus | undefined
  >(universeAccessConfiguration.fiatProductModerationStatus);
  const { mutateAsync: deactivateProduct } = useDeactivateProduct();
  const rootPlaceId = gameDetails?.rootPlaceId ?? -1;
  const isGroup = gameDetails?.creator?.type === CreatorType.Group;

  const getDevicesDefaultFormValue = useMemo(() => {
    return {
      [DevicesType.Computer]: universeAccessConfiguration.devices.includes(DevicesType.Computer),
      [DevicesType.Console]: universeAccessConfiguration.devices.includes(DevicesType.Console),
      [DevicesType.Phone]: universeAccessConfiguration.devices.includes(DevicesType.Phone),
      [DevicesType.Tablet]: universeAccessConfiguration.devices.includes(DevicesType.Tablet),
      [DevicesType.Vr]: universeAccessConfiguration.devices.includes(DevicesType.Vr),
      [DevicesType.Tv]: universeAccessConfiguration.devices.includes(DevicesType.Tv),
    };
  }, [universeAccessConfiguration]);

  const experienceAccessFormDefaultValue = useMemo(() => {
    let paymentType = PaymentType.Free;
    if (
      universeAccessConfiguration.isForSaleInFiat ||
      (fiatProductModerationStatus !== FiatProductModerationStatus.NotModerated &&
        fiatProductModerationStatus !== FiatProductModerationStatus.Rejected)
    ) {
      paymentType = PaymentType.Fiat;
    } else if (universeAccessConfiguration.isForSale) {
      paymentType = PaymentType.Robux;
    }

    const responseType = universeAccessConfiguration.placeJoinRestrictionType;
    const isAllowed = universeAccessConfiguration.isSpecificJoinToNonRootPlacesAllowed;
    let joinRestrictionType;
    if (!responseType || (responseType as number) === 0) {
      joinRestrictionType = isAllowed
        ? PlaceJoinRestrictionType.Open
        : PlaceJoinRestrictionType.Legacy;
    } else {
      joinRestrictionType = responseType;
    }

    return {
      accessType: universeAccessConfiguration.accessType,
      isForSale: universeAccessConfiguration.isForSale,
      paymentType,
      price: universeAccessConfiguration.price,
      fiatBasePriceId: universeAccessConfiguration.fiatBasePriceId,
      devices: getDevicesDefaultFormValue,
      isPrivateServersAllowed: universeAccessConfiguration.isPrivateServersAllowed,
      isPrivateServerForSale: hasPositivePrivateServerPrice(
        universeAccessConfiguration.privateServerPrice,
      ),
      privateServerPrice: universeAccessConfiguration.privateServerPrice,
      isSpecificJoinToNonRootPlacesAllowed: isAllowed,
      hasPlaceOverrides: universeAccessConfiguration.hasPlaceOverrides,
      placeJoinRestrictionType: joinRestrictionType,
      privacy: universeAccessConfiguration.privacy,
      minimumAge: universeAccessConfiguration.minimumAge,
      restrictedCountries: universeAccessConfiguration.restrictedCountries,
      demoModeEnabled: universeAccessConfiguration.demoModeEnabled ?? false,
    };
  }, [universeAccessConfiguration, getDevicesDefaultFormValue, fiatProductModerationStatus]);

  const methods = useForm<ExperienceAccessFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: experienceAccessFormDefaultValue,
    shouldUnregister: true,
  });

  const { control, formState, reset, getValues, watch, setValue, handleSubmit } = methods;
  const { isSubmitting, errors, isValid, isValidating, isDirty, dirtyFields, defaultValues } =
    formState;
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Captured when Allow Private Servers is toggled off; undefined means the section has
  // never been toggled off this session (distinguishes first enable from re-enable).
  const savedIsPrivateServerForSaleRef = useRef<boolean | undefined>(undefined);

  // Last known private-server price, kept across both Allow Private Servers and Requires
  // Robux toggle-offs since either toggle unmounts (and unregisters) the price field.
  const savedPrivateServerPriceRef = useRef<number | undefined>(
    hasPositivePrivateServerPrice(universeAccessConfiguration.privateServerPrice)
      ? (universeAccessConfiguration.privateServerPrice as number)
      : undefined,
  );

  const currentIsPrivateServersAllowedValue = watch('isPrivateServersAllowed');
  const isAccessPublic = enableAudiencesReplacement
    ? isAudiencePublic
    : universeAccessConfiguration.accessType === AccessType.Public;
  const currentPaymentType = watch('paymentType');
  const currentFiatBasePriceId = watch('fiatBasePriceId');

  const isPrivateServerClosed = useMemo(() => {
    return !currentIsPrivateServersAllowedValue && dirtyFields.isPrivateServersAllowed;
  }, [currentIsPrivateServersAllowedValue, dirtyFields.isPrivateServersAllowed]);

  const currentIsPrivateServerForSale = watch('isPrivateServerForSale');
  const currentPrivateServerPrice = watch('privateServerPrice');

  const privateServerChangeType: AccessChangeType | undefined = useMemo(() => {
    if (
      !universeAccessConfiguration.isPrivateServersAllowed ||
      !currentIsPrivateServersAllowedValue
    ) {
      return undefined;
    }

    const wasForSale = hasPositivePrivateServerPrice(
      universeAccessConfiguration.privateServerPrice,
    );
    const isForSale = Boolean(currentIsPrivateServerForSale);

    if (!wasForSale && isForSale && hasPositivePrivateServerPrice(currentPrivateServerPrice)) {
      return 'PrivateServerFreeToPaid';
    }

    if (wasForSale && !isForSale) {
      return 'PrivateServerPaidToFree';
    }

    return undefined;
  }, [
    universeAccessConfiguration.isPrivateServersAllowed,
    universeAccessConfiguration.privateServerPrice,
    currentIsPrivateServersAllowedValue,
    currentIsPrivateServerForSale,
    currentPrivateServerPrice,
  ]);

  useEffect(() => {
    const fetchGroupOwner = async () => {
      if (isGroup && !!gameDetails?.creator?.id) {
        const groupInfo = await groupsClient.getGroupInfo(gameDetails.creator.id);
        return groupInfo.owner?.userId;
      }

      return undefined;
    };
    fetchGroupOwner().then((groupOwner: number | undefined) => {
      if (groupOwner && user) {
        setIsCurrentUserGroupOwner(groupOwner === user.id);
      }
    });
  }, [isGroup, user, gameDetails]);

  const setDeviceValue = useCallback(
    (device: DevicesType, checked: boolean) => {
      const devices = getValues('devices');
      const newDevices = { ...devices, [device]: checked };
      setValue('devices', newDevices, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue, getValues],
  );

  const convertDevicesFormToArray = useCallback((devicesForm: DevicesTypeForm) => {
    return (
      Object.entries(devicesForm)
        // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
        // responsible for triaging issue.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- this is standard map/filtering
        .filter(([deviceName, isSelected]) => isSelected)
        // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
        // responsible for triaging issue.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- this is standard map/filtering
        .map(([deviceName, isSelected]) => deviceName as DevicesV2Type)
    );
  }, []);

  const handlePaymentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      if (e.target.value === PaymentType.Robux && getValues('price') === 0) {
        setValue('price', MinimumRobuxPriceForPlaceSales, {
          shouldDirty: true,
        });
      } else if (e.target.value === PaymentType.Fiat) {
        setDeviceValue(DevicesType.Computer, true);
      }
      fieldOnChange(e.target.value);
    },
    [getValues, setDeviceValue, setValue],
  );

  const handlePrivateServerPaymentOnchange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      if (!e.target.checked) {
        // Capture before fieldOnChange unmounts the price field and unregisters it from RHF.
        savedPrivateServerPriceRef.current = getValues('privateServerPrice');
      } else if (savedPrivateServerPriceRef.current !== undefined) {
        // Pre-populate RHF before fieldOnChange mounts the field so that the controller populates it
        setValue('privateServerPrice', savedPrivateServerPriceRef.current, { shouldDirty: true });
      }
      fieldOnChange(e.target.checked);
    },
    [getValues, setValue],
  );

  const handlePrivateServersAllowedChange = useCallback(
    (checked: boolean, fieldOnChange: ControllerRenderProps['onChange']) => {
      if (checked) {
        // Check if the section has never been toggled off this session.
        const isFirstEnable = savedIsPrivateServerForSaleRef.current === undefined;
        if (isFirstEnable) {
          // First enable: Default Requires Robux on; seed price from config if present, otherwise leave empty.
          setValue('isPrivateServerForSale', true, { shouldDirty: true });
          if (savedPrivateServerPriceRef.current !== undefined) {
            setValue('privateServerPrice', savedPrivateServerPriceRef.current, {
              shouldDirty: true,
            });
          }
        } else {
          // Re-enable: Restore prior Requires Robux and price selections.
          setValue('isPrivateServerForSale', savedIsPrivateServerForSaleRef.current, {
            shouldDirty: true,
          });
          if (
            savedIsPrivateServerForSaleRef.current &&
            savedPrivateServerPriceRef.current !== undefined
          ) {
            setValue('privateServerPrice', savedPrivateServerPriceRef.current, {
              shouldDirty: true,
            });
          }
        }
      } else {
        const wasForSale = Boolean(getValues('isPrivateServerForSale'));
        savedIsPrivateServerForSaleRef.current = wasForSale;
        // Only capture price when Requires Robux is on - note getValues returns undefined for
        // unregistered fields, which would overwrite a previously captured price.
        if (wasForSale) {
          savedPrivateServerPriceRef.current = getValues('privateServerPrice');
        }
      }
      fieldOnChange(checked);
    },
    [getValues, setValue],
  );

  const updatePrivacy = useCallback(
    async (privacy: Privacy) => {
      try {
        if (privacy === Privacy.Public) {
          await developClient.activateGame(universeAccessConfiguration.id);
        } else {
          await developClient.deactivateGame(universeAccessConfiguration.id);
        }
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(ActivateExperienceErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }
        setErrorMessage(translate(errorMsgKey));
      }
    },
    [translate, universeAccessConfiguration.id],
  );

  const handleFormSubmit: SubmitHandler<ExperienceAccessFormType> = useCallback(
    async (data) => {
      setErrorMessage('');
      const updateValues = getValues();
      try {
        if (universeAccessConfiguration.id) {
          let fiatProductChangeType;
          if (
            data.paymentType === PaymentType.Fiat &&
            fiatProductModerationStatus !== FiatProductModerationStatus.Approved &&
            fiatProductModerationStatus !== FiatProductModerationStatus.Pending &&
            isCurrentUserGroupOwner !== false
          ) {
            fiatProductChangeType = FiatProductChangeType.Activate;
            setFiatProductModerationStatus(FiatProductModerationStatus.Pending);
          } else if (
            data.paymentType === PaymentType.Fiat &&
            fiatProductModerationStatus === FiatProductModerationStatus.Approved &&
            isCurrentUserGroupOwner !== false
          ) {
            fiatProductChangeType = FiatProductChangeType.Update;
          } else if (
            data.paymentType !== PaymentType.Fiat &&
            !!fiatProductModerationStatus &&
            fiatProductModerationStatus !== FiatProductModerationStatus.NotModerated &&
            isCurrentUserGroupOwner !== false
          ) {
            fiatProductChangeType = FiatProductChangeType.Deactivate;
            setFiatProductModerationStatus(FiatProductModerationStatus.NotModerated);
          }

          const isForSale =
            fiatProductChangeType === FiatProductChangeType.Activate ||
            fiatProductChangeType === FiatProductChangeType.Update
              ? undefined
              : data.paymentType === PaymentType.Robux;
          const price =
            (fiatProductChangeType === undefined ||
              fiatProductChangeType === FiatProductChangeType.Deactivate) &&
            (data.isForSale || data.paymentType === PaymentType.Robux)
              ? data.price
              : undefined;
          const demoModeEnabled =
            data.paymentType !== PaymentType.Free ? data.demoModeEnabled : undefined;

          await developClient.setUniverseConfigurationV2(
            universeAccessConfiguration.id,
            undefined, // name
            undefined, // description
            undefined, // isStudioAccessToApisAllowed
            undefined, // isMeshTextureApiAccessAllowed
            data.isPrivateServersAllowed,
            data.isPrivateServersAllowed && data.isPrivateServerForSale
              ? data.privateServerPrice
              : 0,
            undefined,
            convertDevicesFormToArray(data.devices),
            isForSale,
            price,
            data.fiatBasePriceId,
            fiatProductChangeType,
            undefined, // audiences
            demoModeEnabled,
          );

          await universesClient.updateJoinRestrictions({
            universeId: universeAccessConfiguration.id,
            placesUpdateJoinRestrictionsRequest: {
              isSpecificJoinToNonRootPlacesAllowed: settings.enableSecureTeleports
                ? data.placeJoinRestrictionType === PlaceJoinRestrictionType.Open
                : data.isSpecificJoinToNonRootPlacesAllowed,
              ...(settings.enableSecureTeleports && {
                placeJoinRestrictionType: Number(data.placeJoinRestrictionType),
              }),
            },
          });

          if (dirtyFields.privacy && data.privacy) {
            await updatePrivacy(data.privacy);
          }

          if (dirtyFields.minimumAge) {
            const ageRestriction: CreatorControlsAgeRestriction = {
              minimumAge: Number(data.minimumAge),
            };

            await experienceGuidelinesServiceApiClient.saveCreatorControlsAgeRestriction(
              universeAccessConfiguration.id,
              ageRestriction,
            );
          }

          if (dirtyFields.restrictedCountries) {
            const geoRestriction: CreatorControlsGeoRestriction = {
              restrictedCountries: data.restrictedCountries,
            };

            await experienceGuidelinesServiceApiClient.saveCreatorControlsGeoRestriction(
              universeAccessConfiguration.id,
              geoRestriction,
            );
          }

          toast({ title: translate('Message.ExperienceSaveSuccess') });
          reset(updateValues);
          refreshGameDetails();
        }
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        let resolved: string | undefined;
        const err = await tryParseResponseError(errRes);
        if (err) {
          const cooldownErr = err.allErrors?.find(
            (e) => e.code === UniverseSettingsErrorCode.PriceChangeTooSoon,
          );
          if (cooldownErr) {
            resolved = getPriceChangeTooSoonMessage(
              { ...cooldownErr, status: err.status },
              locale,
              translate,
            );
          } else {
            const nameOfError = getEnumKeyByValue(UniverseSettingsErrorCode, err.code);
            if (nameOfError) {
              errorMsgKey = `Error.${nameOfError}`;
            }
          }
        }
        setErrorMessage(resolved ?? translate(errorMsgKey));
      }
    },
    [
      getValues,
      universeAccessConfiguration.id,
      fiatProductModerationStatus,
      isCurrentUserGroupOwner,
      convertDevicesFormToArray,
      dirtyFields.privacy,
      dirtyFields.minimumAge,
      dirtyFields.restrictedCountries,
      reset,
      refreshGameDetails,
      updatePrivacy,
      translate,
      settings.enableSecureTeleports,
      locale,
    ],
  );

  const handleAccessChangeDialogOpen = useCallback(
    (changeType: AccessChangeType) => {
      openAccessChangeConfirmationDialog({
        changeType,
        onConfirm: handleSubmit(handleFormSubmit),
      });
    },
    [handleSubmit, handleFormSubmit],
  );

  // Turning off Robux paid access (Robux -> Free) starts a 24h re-enable cooldown, so warn first.
  const isPaidAccessTurnOff =
    defaultValues?.paymentType === PaymentType.Robux && currentPaymentType === PaymentType.Free;

  // TODO: make this a proper form submit handler
  const handleSaveButtonClick = useCallback(() => {
    if (isPrivateServerClosed) {
      handleAccessChangeDialogOpen('PrivateServerTurnOff');
    } else if (privateServerChangeType) {
      handleAccessChangeDialogOpen(privateServerChangeType);
    } else if (isPaidAccessTurnOff) {
      handleAccessChangeDialogOpen('PaidAccessTurnOff');
    } else {
      handleSubmit(handleFormSubmit)();
    }
  }, [
    handleSubmit,
    handleFormSubmit,
    isPrivateServerClosed,
    privateServerChangeType,
    handleAccessChangeDialogOpen,
    isPaidAccessTurnOff,
  ]);

  const handleClearJoinRestrictionsOverrides = useCallback(async () => {
    try {
      const response = await universesClient.getJoinRestrictions({
        universeId: universeAccessConfiguration.id,
      });

      const responseType = response.placeJoinRestrictionType;
      const isAllowed = response.isSpecificJoinToNonRootPlacesAllowed ?? false;

      let joinRestrictionType;
      if (!responseType || responseType === PlaceJoinRestrictionType.Default) {
        joinRestrictionType = isAllowed
          ? PlaceJoinRestrictionType.Open
          : PlaceJoinRestrictionType.Legacy;
      } else {
        joinRestrictionType = responseType;
      }

      setValue('hasPlaceOverrides', response.hasPlaceOverrides ?? false);
      setValue('isSpecificJoinToNonRootPlacesAllowed', isAllowed);
      setValue('placeJoinRestrictionType', joinRestrictionType);

      refreshGameDetails();
    } catch {
      setValue('hasPlaceOverrides', false);
    }
  }, [setValue, universeAccessConfiguration.id, refreshGameDetails]);

  const handleRejectionAlertDismissed = useCallback(async () => {
    await deactivateProduct({
      rootPlaceId,
    });
    setFiatProductModerationStatus(FiatProductModerationStatus.NotModerated);
  }, [deactivateProduct, rootPlaceId]);

  useEffect(() => {
    if (reset) {
      reset(experienceAccessFormDefaultValue);
    }
  }, [experienceAccessFormDefaultValue, reset]);

  return (
    <FormProvider {...methods}>
      <Grid container className={formContainer}>
        <Grid item XSmall={12}>
          {fiatProductModerationStatus === FiatProductModerationStatus.Pending && (
            <Alert severity='warning' variant='standard'>
              <AlertTitle className={title}>{translate('Label.UnderPolicyReview')}</AlertTitle>
              <span>
                {translate('Description.UnderPolicyReview', {
                  paymentType: universeAccessConfiguration.isForSale
                    ? translate('Label.RequiresRobux')
                    : translate('Label.FreeToPlay'),
                })}
              </span>
            </Alert>
          )}
          {fiatProductModerationStatus === FiatProductModerationStatus.Rejected && (
            <Alert
              severity='warning'
              variant='standard'
              action={
                <span>
                  <Button
                    size='small'
                    color='inherit'
                    onClick={() => window.open(FIAT_PAID_ACCESS_LEARN_MORE_URL, '_blank')}>
                    {translate('Label.ReviewPolicy')}
                  </Button>
                  <IconButton
                    aria-label='Close'
                    color='inherit'
                    onClick={() => handleRejectionAlertDismissed()}
                    size='small'>
                    <CloseIcon />
                  </IconButton>
                </span>
              }>
              <AlertTitle className={title}>{translate('Label.PolicyReviewRejected')}</AlertTitle>
              <span>{translate('Description.PolicyReviewRejected')}</span>
            </Alert>
          )}
        </Grid>

        <ExperienceAccessAge
          methods={methods}
          enableCreatorControlsAgeGate={enableCreatorControlsAgeGate}
        />

        <ExperienceAccessRegion
          methods={methods}
          enableCreatorControlsGeoGate={enableCreatorControlsGeoGate}
          allCountries={allCountries}
        />

        <Grid classes={{ root: section }}>
          <FormLabel error={!!errors.devices} sx={{ color: 'text.primary' }}>
            <Typography variant='h2'>{translate('Heading.DeviceType')}</Typography>
          </FormLabel>
          <Typography variant='body2' color='secondary'>
            {translate('Description.DeviceType')}
          </Typography>

          <Grid classes={{ root: controls }}>
            {Object.values(DevicesType)
              .filter((deviceType) => {
                if (deviceType === DevicesType.Vr) {
                  return showVrDeviceOption;
                } else if (deviceType === DevicesType.Tv) {
                  return showTvDeviceOption;
                }
                return true;
              })
              .map((deviceType) => (
                <Controller
                  name='devices'
                  control={control}
                  key={deviceType}
                  render={({ field }) => (
                    <FormControlLabel
                      key={deviceType}
                      value={deviceType}
                      control={
                        <Checkbox
                          {...field}
                          name={`devices.${deviceType}`}
                          checked={field.value[deviceType]}
                          onChange={(e) => {
                            setDeviceValue(deviceType, e.target.checked);
                          }}
                          disabled={
                            deviceType === DevicesType.Computer &&
                            (currentPaymentType === PaymentType.Fiat ||
                              (fiatProductModerationStatus ===
                                FiatProductModerationStatus.Pending &&
                                isCurrentUserGroupOwner === false))
                          }
                        />
                      }
                      label={
                        <Tooltip
                          title={
                            deviceType === DevicesType.Computer ? (
                              <Typography variant='body2' classes={{ root: devicesTooltip }}>
                                {translate('Tooltip.DesktopRequired')}
                              </Typography>
                            ) : (
                              ''
                            )
                          }
                          placement='right'
                          arrow>
                          <Typography variant='body1'>
                            {translate(devicesTypeTranslationKeys[deviceType])}
                          </Typography>
                        </Tooltip>
                      }
                    />
                  )}
                />
              ))}
          </Grid>
        </Grid>

        <Grid item container XSmall={12} gap={2}>
          <Grid item XSmall={12}>
            <Typography variant='h2'>{translate('Label.Payment')}</Typography>
          </Grid>
          {!!fiatProductModerationStatus &&
            fiatProductModerationStatus !== FiatProductModerationStatus.NotModerated &&
            isCurrentUserGroupOwner === false && (
              <Grid item XSmall={10}>
                <Alert severity='warning' variant='standard'>
                  <AlertTitle className={title}>
                    {translate('Label.PermissionNotAllowed')}
                  </AlertTitle>
                  <span>{translate('Description.PermissionNotAllowedEdit')}</span>
                </Alert>
              </Grid>
            )}
        </Grid>
        <Grid item XSmall={12}>
          <ExperienceAccessPaymentType
            handlePaymentTypeChange={handlePaymentTypeChange}
            isAccessPublic={isAccessPublic}
            currentPaymentType={currentPaymentType}
            experienceMarketPlaceCommissionRate={
              universeAccessMetaData.experienceMarketPlaceCommissionRate
            }
            currentIsPrivateServersAllowedValue={currentIsPrivateServersAllowedValue}
            isGroupOwner={isCurrentUserGroupOwner}
            universeAccessConfiguration={universeAccessConfiguration}
            isAudienceNonPublicLocked={isAudienceNonPublicLocked}
          />
        </Grid>

        <Grid classes={{ root: section }}>
          <Grid item XSmall={12}>
            <Typography variant='h2'>
              {settings.enableSecureTeleports
                ? translate('Heading.DirectAccessToPlaces')
                : translate('Heading.AdditionalSettings')}
            </Typography>
          </Grid>
          {settings.enableSecureTeleports ? (
            <>
              <Grid item XSmall={12} classes={{ root: placeAccessFormHelperText }}>
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
              <Grid item XSmall={12} classes={{ root: placeJoinRestrictionRadioGroup }}>
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
                          <Grid container direction='column' className={placeJoinRestrictionLabel}>
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
                          <Grid container direction='column' className={placeJoinRestrictionLabel}>
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
                          <Grid container direction='column' className={placeJoinRestrictionLabel}>
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
            </>
          ) : (
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
                    label={
                      <Grid classes={{ root: toolTipLabelContainer }}>
                        <Typography variant='body1'>
                          {translate('Label.AllowDirectJoins')}
                        </Typography>
                        <Tooltip
                          classes={{ tooltip: tooltipLabel }}
                          title={translate('Message.NonrootPlaceToggleInfo')}
                          placement='right'
                          arrow>
                          <InfoOutlinedIcon />
                        </Tooltip>
                      </Grid>
                    }
                  />
                )}
              />
            </Grid>
          )}

          {getValues('hasPlaceOverrides') && (
            <Grid item container XSmall={12}>
              <Grid item XSmall={12} classes={{ root: switchStyle }}>
                <FormHelperText>
                  {translate('Message.HasPlaceOverridesInfo')}
                  <ExperienceAccessClearJoinRestrictionsOverridesButton
                    universeId={universeAccessConfiguration.id}
                    isSpecificJoinToNonRootPlacesAllowed={getValues(
                      'isSpecificJoinToNonRootPlacesAllowed',
                    )}
                    handleClear={handleClearJoinRestrictionsOverrides}
                  />
                </FormHelperText>
              </Grid>
            </Grid>
          )}

          {!settings.enableSecureTeleports && (
            <Grid item XSmall={12} classes={{ root: switchStyle }}>
              <Controller
                name='isPrivateServersAllowed'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        id='allow-private-server-checkbox'
                        aria-label={translate('Label.AllowPrivateServer')}
                        onChange={(e) =>
                          handlePrivateServersAllowedChange(e.target.checked, field.onChange)
                        }
                        checked={field.value}
                        disabled={
                          currentPaymentType === PaymentType.Robux ||
                          currentPaymentType === PaymentType.Fiat
                        }
                      />
                    }
                    label={
                      <Grid classes={{ root: toolTipLabelContainer }}>
                        <Typography variant='body1'>
                          {translate('Label.AllowPrivateServer')}
                        </Typography>
                        <Tooltip
                          classes={{ tooltip: tooltipLabel }}
                          title={
                            <>
                              {translate('Message.PrivateServerInfo')}&nbsp;
                              <Link
                                href={PRIVATE_SERVER_LEARN_MORE_URL}
                                aria-label={`${translate('Message.PrivateServerInfo')}${translate(
                                  'Label.LearnMore',
                                )}`}
                                target='_blank'>
                                {translate('Label.LearnMore')}
                              </Link>
                            </>
                          }
                          placement='right'
                          arrow>
                          <InfoOutlinedIcon />
                        </Tooltip>
                      </Grid>
                    }
                  />
                )}
              />

              {currentIsPrivateServersAllowedValue && (
                <Grid item XSmall={12} classes={{ root: privateServerGrid }}>
                  <ExperiencePrivateServerCard
                    activePrivateServerCount={universeAccessMetaData.activeServersCount}
                    activePrivateServerSubscriptionCount={
                      universeAccessMetaData.activeSubscriptionsCount
                    }
                  />
                  <Grid item XSmall={12}>
                    <Grid item XSmall={12} classes={{ root: switchStyle }}>
                      <Controller
                        name='isPrivateServerForSale'
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                id='requires-robux-checkbox'
                                aria-label={translate('Label.RequiresRobux')}
                                onChange={(e) =>
                                  handlePrivateServerPaymentOnchange(e, field.onChange)
                                }
                                checked={field.value}
                              />
                            }
                            label={translate('Label.RequiresRobux')}
                          />
                        )}
                      />
                    </Grid>
                    {currentIsPrivateServerForSale && (
                      <ExperienceAccessPayment
                        commissionRate={
                          universeAccessMetaData.privateServerMarketPlaceCommissionRate
                        }
                        fieldName='privateServerPrice'
                        isFiatPaidAccessEnabled={false}
                        universeId={universeAccessConfiguration.id}
                      />
                    )}
                  </Grid>
                </Grid>
              )}
            </Grid>
          )}
        </Grid>

        {settings.enableSecureTeleports && (
          <Grid classes={{ root: section }}>
            <Grid item XSmall={12}>
              <Typography variant='h2'>{translate('Heading.AdditionalSettings')}</Typography>
            </Grid>

            <Grid item XSmall={12} classes={{ root: switchStyle }}>
              <Controller
                name='isPrivateServersAllowed'
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        id='allow-private-server-checkbox'
                        aria-label={translate('Label.AllowPrivateServer')}
                        onChange={(e) =>
                          handlePrivateServersAllowedChange(e.target.checked, field.onChange)
                        }
                        checked={field.value}
                        disabled={
                          currentPaymentType === PaymentType.Robux ||
                          currentPaymentType === PaymentType.Fiat
                        }
                      />
                    }
                    label={
                      <Grid classes={{ root: toolTipLabelContainer }}>
                        <Typography variant='body1'>
                          {translate('Label.AllowPrivateServer')}
                        </Typography>
                        <Tooltip
                          classes={{ tooltip: tooltipLabel }}
                          title={
                            <>
                              {translate('Message.PrivateServerInfo')}&nbsp;
                              <Link
                                href={PRIVATE_SERVER_LEARN_MORE_URL}
                                aria-label={`${translate('Message.PrivateServerInfo')}${translate(
                                  'Label.LearnMore',
                                )}`}
                                target='_blank'>
                                {translate('Label.LearnMore')}
                              </Link>
                            </>
                          }
                          placement='right'
                          arrow>
                          <InfoOutlinedIcon />
                        </Tooltip>
                      </Grid>
                    }
                  />
                )}
              />

              {currentIsPrivateServersAllowedValue && (
                <Grid item XSmall={12} classes={{ root: privateServerGrid }}>
                  <ExperiencePrivateServerCard
                    activePrivateServerCount={universeAccessMetaData.activeServersCount}
                    activePrivateServerSubscriptionCount={
                      universeAccessMetaData.activeSubscriptionsCount
                    }
                  />
                  <Grid item XSmall={12}>
                    <Grid item XSmall={12} classes={{ root: switchStyle }}>
                      <Controller
                        name='isPrivateServerForSale'
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                id='requires-robux-checkbox'
                                aria-label={translate('Label.RequiresRobux')}
                                onChange={(e) =>
                                  handlePrivateServerPaymentOnchange(e, field.onChange)
                                }
                                checked={field.value}
                              />
                            }
                            label={translate('Label.RequiresRobux')}
                          />
                        )}
                      />
                    </Grid>
                    {currentIsPrivateServerForSale && (
                      <ExperienceAccessPayment
                        commissionRate={
                          universeAccessMetaData.privateServerMarketPlaceCommissionRate
                        }
                        fieldName='privateServerPrice'
                        isFiatPaidAccessEnabled={false}
                        universeId={universeAccessConfiguration.id}
                      />
                    )}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}

        <Grid container item spacing={4} XSmall={12} XLarge={8}>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid container item XSmall={12} classes={{ root: buttonContainer }}>
            <Button
              // TODO(jeminpark): migrate to ButtonLink with foundation migration
              component={NextLink}
              data-testid='cancel-button'
              variant='outlined'
              color='primary'
              size='large'
              href={`/dashboard/creations/experiences/${universeAccessConfiguration.id}/overview`}
              disabled={isSubmitting}>
              {translate('Action.Cancel')}
            </Button>
            <Button
              classes={{ root: saveChangesButton }}
              data-testid='save-experience-access-button'
              variant='contained'
              size='large'
              disabled={
                !isDirty ||
                (!isValidating && !isValid) ||
                (currentPaymentType === PaymentType.Fiat && currentFiatBasePriceId === undefined)
              }
              onClick={handleSaveButtonClick}
              loading={isSubmitting}>
              {translate('Action.SaveChanges')}
            </Button>
          </Grid>
          {errorMessage && (
            <FormHelperText error classes={{ root: errorMessageStyle }}>
              {errorMessage}
            </FormHelperText>
          )}
        </Grid>
      </Grid>
    </FormProvider>
  );
}

export default ExperienceAccessForm;
