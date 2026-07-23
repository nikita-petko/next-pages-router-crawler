import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import type { RobloxUsersApiGetUserResponse } from '@rbx/client-users/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  DeleteIcon,
  Divider,
  EditIcon,
  FormHelperText,
  Grid,
  IconButton,
  InfoOutlinedIcon,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  makeStyles,
  useSnackbar,
  useTheme,
  useMediaQuery,
  PercentIcon,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { TGroup } from '@modules/authentication/types';
import type { Organization } from '@modules/clients/organizationApi';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import useCurrentOrganization from '@modules/group/hooks/useCurrentOrganization';
import { CreatorType, FormMode, toastDurationTime } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { groupPayoutColor } from '../constants/payoutsConstants';
import type PayoutColorType from '../interface/PayoutColorType';
import type { PayoutsBase, PayoutsFormType } from '../interface/PayoutsFormType';
import PayoutType from '../interface/PayoutType';
import {
  getNextColor,
  getPayoutChartThemedColors,
  getPayoutStyle,
  getRandomPayoutColorType,
  validateNumberInput,
  validatePayoutAmountsLessThanOrEqualTo100,
} from '../utils/payoutsUtils';
import AddPayoutCreator from './AddPayoutCreator';
import PayoutsChart from './PayoutsChart';

const useGroupPayoutsStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    '& > *:not(:last-child)': {
      marginBottom: 24,
    },
    [theme.breakpoints.down('Large')]: {
      marginLeft: 12,
      marginRight: 12,
    },
    [theme.breakpoints.down('Medium')]: {
      marginLeft: 0,
      marginRight: 0,
    },
  },

  container: {
    minWidth: 0,
    width: 'fit-content',
  },

  formContainer: {
    marginTop: 8,
    marginBottom: 8,
  },

  bottomContainer: {
    height: '100%',
  },

  title: {
    flexBasis: '100%',
    margin: '4px 0px',
  },

  buttonContainer: {
    padding: '16px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
    '& > *:not(:first-child)': {
      margin: '0 12px',
    },
    '&:last-child': {
      marginLeft: 0,
    },
  },

  errorMessageStyles: {
    width: '100%',
    paddingTop: 8,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  colorBar: {
    width: 4,
    minWidth: 4,
    height: '100%',
    marginRight: 12,
  },

  rowInner: {
    padding: '8px 0px',
    '& > *:not(:first-child)': {
      marginRight: 8,
      minWidth: 0,
      width: 'fit-content',
    },
  },

  thumbnailContainer: {
    marginRight: 36,
  },

  percentageInput: {
    width: 100,
    minWidth: 100,
  },

  leftColumn: {
    minWidth: 0,
    maxWidth: 512,
  },
}));

export type ConfigurePayoutsFormProps = {
  organization: Organization;
  initialPayouts: PayoutsBase[];
  onSave: (
    payouts: PayoutsBase[],
  ) => Promise<{ updateSucceeded: boolean; translatedErrorMessage?: string | null }>;
  payoutType: PayoutType;
  disabled?: boolean;
};

const ConfigurePayoutsForm: FunctionComponent<ConfigurePayoutsFormProps> = ({
  organization,
  initialPayouts,
  onSave,
  payoutType,
  disabled = false,
}) => {
  const {
    classes: {
      root,
      container,
      formContainer,
      bottomContainer,
      title,
      buttonContainer,
      errorMessageStyles,
      colorBar,
      rowInner,
      thumbnailContainer,
      percentageInput,
      leftColumn,
    },
    cx,
  } = useGroupPayoutsStyles();

  const { translate } = useTranslation();
  const { enqueue, close } = useSnackbar();
  const currentGroup = useCurrentGroup();
  const { permissions } = useCurrentOrganization();
  const { user: currentUser } = useAuthentication();

  const theme = useTheme();
  const { background, accordionBackground } = getPayoutChartThemedColors(theme);
  const showLabels = useMediaQuery(theme.breakpoints.up('XLarge'));
  const isCompact = useMediaQuery(theme.breakpoints.down('Large'));

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<string | null>(null);
  const [userInfoMap, setUserInfoMap] = useState<Map<string, RobloxUsersApiGetUserResponse | null>>(
    new Map<string, RobloxUsersApiGetUserResponse | null>(),
  );
  const [userInfoMapLastUpdated, setUserInfoMapLastUpdated] = useState<Date>(new Date());
  const [colorMapLastUpdated, setColorMapLastUpdated] = useState<Date>(new Date());

  const [colorMap, setColorMap] = useState<Map<string, PayoutColorType>>(
    new Map<string, PayoutColorType>(),
  );

  const configurePayoutsFormDefaultValue = useMemo(() => {
    return {
      payouts: initialPayouts,
    };
  }, [initialPayouts]);

  const { handleSubmit, control, setValue, formState, reset } = useForm<PayoutsFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: configurePayoutsFormDefaultValue,
    shouldUnregister: true,
  });
  const { isSubmitting, errors, isValid, isValidating, isDirty } = formState;

  const handleFormCancel = useCallback(() => {
    if (reset) {
      reset(configurePayoutsFormDefaultValue);
    }

    setFormSubmissionErrorMsg(null);
    setIsEditing(false);
  }, [configurePayoutsFormDefaultValue, reset]);

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

  const handleFormSubmit: SubmitHandler<PayoutsFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);
      try {
        const updateResponse = await onSave(data.payouts);
        const { updateSucceeded, translatedErrorMessage } = updateResponse;

        if (!updateSucceeded) {
          if (translatedErrorMessage) {
            setFormSubmissionErrorMsg(translatedErrorMessage);
          } else {
            setFormSubmissionErrorMsg(translate('Error.SavingPayouts'));
          }
          reset(undefined, { keepValues: true, keepDirty: true });
          return;
        }

        showBottomToast(translate('Message.ChangeSaved'));
      } catch {
        setFormSubmissionErrorMsg(translate('Error.SavingPayouts'));
        reset(undefined, { keepValues: true, keepDirty: true });
      }
    },
    [onSave, showBottomToast, translate, reset],
  );

  useEffect(() => {
    if (reset) {
      reset(configurePayoutsFormDefaultValue);
    }
  }, [configurePayoutsFormDefaultValue, reset]);

  const getGroupPayoutPercentage = useCallback((payouts: PayoutsBase[]) => {
    const nonGroupPayoutPercentages = payouts.map((payout) =>
      payout.percentage === '' ? 0 : Number.parseInt(payout.percentage, 10),
    );
    const nonGroupPayoutSum =
      nonGroupPayoutPercentages.length === 0
        ? 0
        : nonGroupPayoutPercentages.reduce((sum, curr) => sum + curr);

    return 100 - nonGroupPayoutSum;
  }, []);

  const getUserInfo = useCallback(
    (creatorId: string) => {
      if (!userInfoMapLastUpdated && userInfoMap.size === 0) {
        return;
      }

      return userInfoMap.get(creatorId);
    },
    [userInfoMap, userInfoMapLastUpdated],
  );

  const getColor = useCallback(
    (creatorId: string) => {
      if (!colorMapLastUpdated && colorMap.size === 0) {
        return;
      }

      return colorMap.get(creatorId);
    },
    [colorMap, colorMapLastUpdated],
  );

  const fetchUsers = useCallback(
    async (userIds: number[]) => {
      if (userIds.length === 0) {
        return;
      }

      try {
        const usersResponse = await usersClient.getUsersByIds(userIds);

        setUserInfoMap((prevMap) => {
          usersResponse.data?.forEach((userInfo) => prevMap.set(`${userInfo.id ?? 0}`, userInfo));
          return prevMap;
        });
      } catch {
        setUserInfoMap((prevMap) => {
          userIds.forEach((id) => prevMap.set(`${id}`, null));
          return prevMap;
        });
      } finally {
        setUserInfoMapLastUpdated(new Date());
      }
    },
    [setUserInfoMap],
  );

  const assignColors = useCallback((userIds: number[]) => {
    setColorMap((prevMap) => {
      userIds.forEach((id) => {
        const existingColor = prevMap.get(`${id}`);
        prevMap.set(`${id}`, existingColor || getNextColor(Array.from(prevMap.values())));
      });

      return prevMap;
    });

    setColorMapLastUpdated(new Date());
  }, []);

  useEffect(() => {
    // Fetch user information that have already been added to the payouts, but not yet fetched
    const userIds = initialPayouts.map((payout) => Number.parseInt(payout.creatorId, 10));
    fetchUsers(userIds);

    // Choose colors for each user
    assignColors(userIds);
  }, [assignColors, fetchUsers, initialPayouts]);

  const isPriviligedUser = useCallback(() => {
    return (
      permissions?.isOwner === true ||
      permissions?.canConfigureRevenueDetails === true ||
      permissions?.canViewRevenueDetails === true
    );
  }, [permissions]);

  const payoutRow = useCallback(
    (
      creator: User | TGroup,
      creatorType: CreatorType,
      payout: PayoutsBase,
      payouts: PayoutsBase[],
      onDelete?: (payoutToDelete: PayoutsBase) => void,
      onChange?: (updatedPayout: PayoutsBase) => void,
    ) => {
      if (!creator.id) {
        return null;
      }

      const percentage =
        creatorType === CreatorType.User ? payout?.percentage : getGroupPayoutPercentage(payouts);

      // We will obfuscate the row if the user is not the owner or has all
      // viewing priviliges unless the row is for the user themselves
      const showUserDetails =
        isPriviligedUser() ||
        (creatorType === CreatorType.User && currentUser !== null && creator.id === currentUser.id);

      return (
        <Grid container wrap='nowrap' alignItems='center'>
          {creatorType === CreatorType.User ? (
            <Grid
              item
              className={colorBar}
              style={getPayoutStyle(
                colorMap.get(`${creator.id}`) ?? getRandomPayoutColorType(),
                'background',
              )}
            />
          ) : (
            <Grid
              item
              className={colorBar}
              style={getPayoutStyle(groupPayoutColor, 'background')}
            />
          )}

          <Grid container wrap='nowrap' justifyContent='space-between' className={rowInner}>
            <Grid container className={cx(thumbnailContainer, container)}>
              <ThumbnailWithNames
                target={creator}
                targetType={creatorType}
                obfuscate={!showUserDetails}
                textVariant='secondary'
              />
            </Grid>

            <Grid
              container
              wrap='nowrap'
              alignItems='center'
              justifyContent='flex-end'
              className={container}>
              {creatorType === CreatorType.User && isEditing ? (
                <TextField
                  size='small'
                  label={translate('Label.Earnings')}
                  id='earnings'
                  value={percentage}
                  className={percentageInput}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    if (!onChange) {
                      return;
                    }

                    const payoutAmounts = payouts.map((po) =>
                      po.percentage === '' ? 0 : Number.parseInt(po.percentage, 10),
                    );
                    payoutAmounts.push(-payout.percentage, Number(event.target.value));

                    // Input must be a number and the sum of all payouts must be less than or equal to 100
                    if (
                      validateNumberInput(event.target.value) &&
                      validatePayoutAmountsLessThanOrEqualTo100(payoutAmounts)
                    ) {
                      onChange({
                        ...payout,
                        percentage: event.target.value,
                      });
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='start'>
                        <PercentIcon fontSize='small' />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <>
                  <Typography variant='h6'>
                    <span>{percentage}</span>&nbsp;
                  </Typography>
                  <PercentIcon />
                </>
              )}

              {/* Group row shows tooltip */}
              {creatorType === CreatorType.Group && !disabled && isEditing && (
                <Tooltip
                  arrow
                  title={translate('Message.GroupEarnings')}
                  placement='right'
                  enterTouchDelay={0}
                  leaveTouchDelay={3000}
                  color='disabled'>
                  <IconButton aria-label='tooltip' color='secondary'>
                    <InfoOutlinedIcon color='disabled' />
                  </IconButton>
                </Tooltip>
              )}

              {/* User row shows delete button if editing */}
              {creatorType === CreatorType.User && isEditing && (
                <IconButton
                  aria-label='delete-payout'
                  color='secondary'
                  onClick={() => {
                    if (onDelete) {
                      onDelete(payout);
                    }
                  }}>
                  <DeleteIcon color='error' />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Grid>
      );
    },
    [
      getGroupPayoutPercentage,
      currentUser,
      colorBar,
      colorMap,
      rowInner,
      cx,
      thumbnailContainer,
      container,
      isEditing,
      translate,
      disabled,
      percentageInput,
      isPriviligedUser,
    ],
  );

  const titleSection = useCallback(() => {
    return (
      <Grid className={cx(title, leftColumn)} item Large={6} XSmall={12}>
        <Grid container justifyContent='space-between' wrap='nowrap' alignItems='center'>
          <Typography variant='h6'>{translate('Title.Splits')}</Typography>

          {!isEditing && !disabled && permissions?.canConfigureRevenueDetails && (
            <Grid container alignItems='center' justifyContent='flex-end'>
              <IconButton
                aria-label='edit'
                color='secondary'
                onClick={() => setIsEditing(true)}
                disabled={disabled}>
                <EditIcon />
              </IconButton>
            </Grid>
          )}
        </Grid>
      </Grid>
    );
  }, [
    cx,
    title,
    leftColumn,
    translate,
    isEditing,
    disabled,
    permissions?.canConfigureRevenueDetails,
  ]);

  return (
    <Grid container className={root} wrap='wrap'>
      {/* Title */}
      {!isCompact && titleSection()}
      <Grid container flexDirection='row-reverse' justifyContent='start'>
        {/* All other payouts */}
        <Controller
          name='payouts'
          control={control}
          render={({ field: { value: payouts, onChange } }) => (
            <>
              <Grid item Large={6} XSmall={12}>
                <Grid container justifyContent='center'>
                  {currentGroup ? (
                    <PayoutsChart
                      payouts={payouts}
                      group={currentGroup}
                      groupPayoutPercentage={getGroupPayoutPercentage(payouts)}
                      getUserInfo={getUserInfo}
                      getColor={getColor}
                      showLabels={showLabels}
                      borderColor={
                        payoutType === PayoutType.Group ? background : accordionBackground
                      }
                      useOtherLabel={!isPriviligedUser()}
                    />
                  ) : (
                    <CircularProgress color='secondary' />
                  )}
                </Grid>
              </Grid>

              <Grid item Large={6} XSmall={12} className={leftColumn}>
                <Grid container className={root}>
                  {/* Title is below chart when compact */}
                  {isCompact && titleSection()}

                  {isEditing && (
                    <AddPayoutCreator
                      organization={organization}
                      payouts={payouts}
                      onSubmit={(payout, creator) => {
                        const newPayouts = payouts;
                        newPayouts.push(payout);
                        setValue('payouts', newPayouts);
                        onChange(newPayouts);

                        // Add to user info map
                        setUserInfoMap((prevMap) => {
                          prevMap.set(`${creator.id}`, creator);
                          return prevMap;
                        });
                        setUserInfoMapLastUpdated(new Date());

                        // Add user to color map
                        setColorMap((prevMap) => {
                          const existingColor = prevMap.get(`${creator.id}`);
                          prevMap.set(
                            `${creator.id}`,
                            existingColor || getNextColor(Array.from(prevMap.values())),
                          );
                          return prevMap;
                        });
                        setColorMapLastUpdated(new Date());
                      }}
                      disabled={disabled}
                    />
                  )}
                  <Grid item XSmall={12} className={bottomContainer}>
                    <Grid item>
                      <Divider />
                    </Grid>

                    <Grid container className={formContainer}>
                      {/* Group row */}
                      {currentGroup && (
                        <Fragment>
                          {payoutRow(
                            currentGroup,
                            CreatorType.Group,
                            {
                              creatorId: currentGroup.id.toString(),
                              percentage: getGroupPayoutPercentage(payouts).toString(),
                            },
                            payouts,
                          )}
                        </Fragment>
                      )}

                      {payouts.map((payout) => {
                        const userInfo = getUserInfo(payout.creatorId);
                        return (
                          <Fragment key={payout.creatorId}>
                            {payoutRow(
                              {
                                id: Number.parseInt(payout.creatorId, 10),
                                displayName: userInfo?.displayName,
                                name: userInfo?.name,
                              },
                              CreatorType.User,
                              payout,
                              payouts,
                              (payoutToDelete: PayoutsBase) => {
                                const newPayouts = payouts.filter(
                                  (p) => p.creatorId !== payoutToDelete.creatorId,
                                );
                                setValue('payouts', newPayouts);
                                onChange(newPayouts);

                                // Remove user from color map
                                setColorMap((prevMap) => {
                                  prevMap.delete(`${payoutToDelete.creatorId}`);
                                  return prevMap;
                                });
                                setColorMapLastUpdated(new Date());
                              },
                              (updatedPayout: PayoutsBase) => {
                                const newPayouts = payouts.map((p) =>
                                  p.creatorId === updatedPayout.creatorId ? updatedPayout : p,
                                );
                                setValue('payouts', newPayouts);
                                onChange(newPayouts);
                              },
                            )}
                          </Fragment>
                        );
                      })}
                    </Grid>

                    {isEditing && (
                      <Fragment>
                        <Grid item>
                          <Divider />
                        </Grid>

                        <Grid item className={buttonContainer}>
                          <Button
                            variant='outlined'
                            color='primary'
                            size='large'
                            onClick={handleFormCancel}>
                            {translate('Action.Cancel')}
                          </Button>
                          <Button
                            data-testid='save-payouts-button'
                            variant='contained'
                            size='large'
                            disabled={
                              !isDirty ||
                              (!isValidating && !isValid) ||
                              disabled ||
                              !!errors.payouts
                            }
                            onClick={handleSubmit(handleFormSubmit)}
                            loading={isSubmitting}>
                            {translate('Action.Save')}
                          </Button>

                          {formSubmissionErrorMsg && (
                            <FormHelperText className={errorMessageStyles}>
                              {formSubmissionErrorMsg}
                            </FormHelperText>
                          )}
                        </Grid>
                      </Fragment>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        />
      </Grid>
    </Grid>
  );
};

export default ConfigurePayoutsForm;
