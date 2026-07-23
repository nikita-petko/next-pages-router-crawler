import React, { FunctionComponent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { components, urls } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import openCloudSafetyClient from '@modules/clients/openCloudSafety';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import UseAddUsersToBanContainerStyles from './AddUsersToBanContainer.styles';
import {
  DurationUnits,
  ModerationEvents,
  NOT_FOUND_ERROR_CODE,
  ROBLOX_COMMUNITY_STANDARDS_URL,
} from '../constants/userBansConstants';
import {
  AddUserBansFormProps,
  getFormValidation,
  formConfig,
  BanDurationType,
  getBanDurationFromUserBanData,
  parseUserIdsToBan,
} from '../utils/addUserBansFormUtils';
import { getExperienceIdFromQueryParams } from '../utils/userBansDataUtils';
import { UserBansState, useUserBansStateContext } from '../layout/UserBansStateProvider';
import { OpenCloudError } from '@rbx/google-gax';

const { Flex } = components;

const AddUsersToBan: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: {
      rootContainer,
      pageContainer,
      headerTitle,
      sectionContainer,
      sectionTitle,
      descriptionText,
      userInput,
      checkboxContainer,
      radioLabelContainer,
      durationUnitsContainer,
      radioLabels,
      button,
    },
  } = UseAddUsersToBanContainerStyles();

  const { setUserBansState, setSnackbarMessage, setListUserIdsError } = useUserBansStateContext();

  const { translate, translateHTML } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { dirtyFields, errors, isSubmitting, isValidating },
    watch,
  } = useForm<AddUserBansFormProps>(formConfig);
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const isSubmitDisabled =
    !dirtyFields.usersToBan || !dirtyFields.publicReason || !dirtyFields.privateReason;

  const router = useRouter();
  const queryParams = router.query;
  const experienceId = getExperienceIdFromQueryParams(queryParams.id);
  const userBansUrl = urls.creatorHub.dashboard.getUserBansUrl(experienceId);

  const banDurationTypeRef = watch('banDurationType');
  const formValidation = getFormValidation(translate, banDurationTypeRef);

  const handleApplyBan = async (addUserBansFormData: AddUserBansFormProps) => {
    const applyBanPromises = addUserBansFormData.usersToBan.map((user) =>
      openCloudSafetyClient.updateUserRestriction({
        userRestriction: {
          path: openCloudSafetyClient.universeUserRestrictionPath(experienceId.toString(), user),
          gameJoinRestriction: {
            active: true,
            duration: getBanDurationFromUserBanData(addUserBansFormData),
            privateReason: addUserBansFormData.privateReason,
            displayReason: addUserBansFormData.publicReason,
            excludeAltAccounts: !addUserBansFormData.banAltAccounts,
          },
        },
      }),
    );

    const res = await Promise.allSettled(applyBanPromises);
    const errorResults = res
      .map((res, index) => ({
        res: res,
        userId: addUserBansFormData.usersToBan[index],
      }))
      .filter(({ res }) => res.status !== 'fulfilled');
    const errorUserIds = errorResults.map(({ userId }) => userId);

    const errorState = errorResults.some(
      ({ res }) =>
        // The check for res.status !== 'fulfilled' is a no-op but is necessary for TS to know res.reason exists
        res.status !== 'fulfilled' &&
        (!(res.reason instanceof OpenCloudError) || res.reason.code !== NOT_FOUND_ERROR_CODE),
    )
      ? UserBansState.BanUsersGenericDialogError
      : UserBansState.BanUsersNotFoundDialogError;

    if (errorUserIds.length > 0) {
      setListUserIdsError(errorUserIds);
      setUserBansState(errorState);

      unifiedLogger.logClickEvent({
        eventName: ModerationEvents.BAN_CLICK_EVENT_ERROR,
        parameters: {
          erroredUsers: errorUserIds.toString(),
        },
      });
    } else {
      setSnackbarMessage(
        translate(
          res.length === 1
            ? 'Tooltip.BanSuccessfullyAppliedSingular'
            : 'Tooltip.BanSuccessfullyApplied',
          {
            numUsers: res.length.toString(),
          },
        ),
      );
      setUserBansState(UserBansState.SnackbarSuccess);

      unifiedLogger.logClickEvent({
        eventName: ModerationEvents.BAN_CLICK_EVENT,
        parameters: {
          usersToBan: addUserBansFormData.usersToBan.toString(),
        },
      });
    }

    router.push(userBansUrl);
  };

  return (
    <div className={rootContainer}>
      <Typography classes={{ root: headerTitle }} component='h1' variant='h1'>
        {translate('Title.AddUsersToBan')}
      </Typography>
      <div className={pageContainer}>
        <Flex classes={{ root: sectionContainer }} flexDirection='column'>
          <Typography classes={{ root: sectionTitle }} component='h3' variant='h3'>
            {translate('Heading.AddUserIds')}
          </Typography>
          <Typography classes={{ root: descriptionText }} variant='body2'>
            {translate('Description.AddUserIds')}
          </Typography>
          <Controller
            name='usersToBan'
            control={control}
            rules={formValidation.validateUsersToBan}
            render={({ field }) => (
              <Autocomplete
                {...field}
                clearIcon={false}
                options={[]}
                freeSolo
                multiple
                onChange={(e, value) => {
                  const valuesWithCommaSplit = Array.from(new Set(parseUserIdsToBan(value)));
                  return field.onChange(valuesWithCommaSplit);
                }}
                renderTags={(values) =>
                  values.map((userId) => {
                    return (
                      <Chip
                        color={Number.isNaN(Number(userId)) ? 'error' : 'secondary'}
                        key={userId}
                        label={userId}
                        onDelete={() => {
                          const newValues = values.filter((curUserId) => userId !== curUserId);
                          field.onChange(newValues);
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    classes={{ root: userInput }}
                    error={!!errors.usersToBan}
                    onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                      // The logic here is to transform the current textInput into a pill when clicking out of the input
                      const currInput = event.target.value;
                      if (!currInput) {
                        return;
                      }

                      const valuesWithCommaSplit = Array.from(
                        new Set([...field.value, ...parseUserIdsToBan([currInput])]),
                      );
                      field.onChange(valuesWithCommaSplit);

                      // Set the TextField input to empty
                      if (params?.inputProps?.onChange) {
                        params.inputProps.onChange({
                          target: { value: '' },
                        } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }}
                    fullWidth
                    id='users-to-ban'
                    label={translate('Label.UserIds')}
                  />
                )}
              />
            )}
          />
          <Controller
            control={control}
            name='banAltAccounts'
            render={({ field }) => (
              <FormControlLabel
                classes={{ root: checkboxContainer }}
                control={
                  <Checkbox onChange={field.onChange} checked={field.value} color='secondary' />
                }
                label={translate('Label.BanAltAccounts')}
              />
            )}
          />
        </Flex>
        <Flex classes={{ root: sectionContainer }} flexDirection='column'>
          <Typography classes={{ root: sectionTitle }} component='h3' variant='h3'>
            {translate('Heading.SetDuration')}
          </Typography>
          <Typography classes={{ root: descriptionText }} variant='body2'>
            {translate('Description.SetDuration')}
          </Typography>
          <Controller
            control={control}
            name='banDurationType'
            render={({ field }) => (
              <RadioGroup {...field}>
                <FormControlLabel
                  control={<Radio aria-label={translate('Label.PermanentBan')} />}
                  label={
                    <Typography classes={{ root: radioLabels }}>
                      {translate('Label.PermanentBan')}
                    </Typography>
                  }
                  value={BanDurationType.PermanentBan}
                />
                {/* We have the Duration dropdown and TextField outside of the label, as there's a bug where the area with text is not clickable */}
                <Flex alignItems='flex-start'>
                  <FormControlLabel
                    className={radioLabelContainer}
                    control={<Radio aria-label={translate('Label.CustomBan')} />}
                    disableTypography
                    value={BanDurationType.CustomBan}
                    label={
                      <Typography classes={{ root: radioLabels }}>
                        {translate('Label.CustomBan')}
                      </Typography>
                    }
                  />
                  <Controller
                    control={control}
                    name='banDurationUnits'
                    rules={formValidation.validateBanDurationUnits}
                    render={({ field: unitsField }) => (
                      <Select
                        {...unitsField}
                        error={
                          banDurationTypeRef === BanDurationType.CustomBan &&
                          !!errors.banDurationUnits
                        }
                        classes={{ root: durationUnitsContainer }}
                        disabled={banDurationTypeRef !== BanDurationType.CustomBan}
                        fullWidth
                        label={translate('Label.DurationUnits')}>
                        {Object.values(DurationUnits).map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {translate(unit)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Controller
                    control={control}
                    name='banDurationQuantity'
                    rules={formValidation.validateBanDurationQuantity}
                    render={({ field: quantityField }) => (
                      <TextField
                        {...quantityField}
                        disabled={banDurationTypeRef === BanDurationType.PermanentBan}
                        error={
                          banDurationTypeRef === BanDurationType.CustomBan &&
                          !!errors.banDurationQuantity
                        }
                        fullWidth
                        helperText={
                          errors.banDurationQuantity?.message ??
                          translate('Label.NumericalInputOnly')
                        }
                        id='ban-duration-quantity'
                        label={translate('Label.DurationQuantity')}
                      />
                    )}
                  />
                </Flex>
              </RadioGroup>
            )}
          />
        </Flex>
        <Flex classes={{ root: sectionContainer }} flexDirection='column'>
          <Typography classes={{ root: sectionTitle }} component='h3' variant='h3'>
            {translate('Heading.AddDetails')}
          </Typography>
          <Typography classes={{ root: descriptionText }} variant='body2'>
            {translateHTML('Description.AddDetails', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <a rel='noopener' target='_blank' href={ROBLOX_COMMUNITY_STANDARDS_URL}>
                      {chunks}
                    </a>
                  );
                },
              },
            ])}
          </Typography>
          <Controller
            control={control}
            name='publicReason'
            rules={formValidation.validatePublicReason}
            render={({ field }) => (
              <TextField
                {...field}
                classes={{ root: userInput }}
                error={!!errors.publicReason}
                fullWidth
                helperText={errors.publicReason?.message ?? translate('Label.VisibleToUsers')}
                id='public-ban-reason'
                label={translate('Label.PublicBanReason')}
              />
            )}
          />
          <Controller
            control={control}
            name='privateReason'
            rules={formValidation.validatePrivateReason}
            render={({ field }) => (
              <TextField
                {...field}
                classes={{ root: userInput }}
                error={!!errors.privateReason}
                fullWidth
                helperText={errors.privateReason?.message ?? translate('Label.NotVisibleToUsers')}
                id='private-ban-reason'
                label={translate('Label.PrivateBanReason')}
              />
            )}
          />
        </Flex>
      </div>
      <Flex>
        <Button
          classes={{ root: button }}
          color='secondary'
          onClick={() => router.push(userBansUrl)}
          variant='outlined'>
          {translate('Action.Back')}
        </Button>
        <Button
          classes={{ root: button }}
          onClick={handleSubmit(handleApplyBan)}
          disabled={isSubmitDisabled}
          loading={isSubmitting || isValidating}
          variant='contained'>
          {translate('Action.ApplyBan')}
        </Button>
      </Flex>
    </div>
  );
};

export default withTranslation(AddUsersToBan, [
  TranslationNamespace.SafetyControls,
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
]);
