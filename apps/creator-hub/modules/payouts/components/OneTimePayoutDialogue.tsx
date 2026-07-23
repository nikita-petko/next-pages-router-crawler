import React, {
  Fragment,
  useState,
  useCallback,
  FunctionComponent,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  makeStyles,
  Typography,
  Dialog,
  DialogContent,
  Button,
  DialogActions,
  InputAdornment,
  Grid,
  FormHelperText,
  TextField,
  RobuxIcon,
  Divider,
  Skeleton,
  Tooltip,
  Alert,
  AlertTitle,
  IconButton,
  CloseIcon,
} from '@rbx/ui';
import Papa from 'papaparse';
import { User, economyClient, groupsClient, usersClient } from '@modules/clients';
import { CreatorType, FormMode } from '@modules/miscellaneous/common';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  RobloxGroupsApiPayoutRecipientRequest,
  RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum,
  RobloxGroupsApiPayoutRequestPayoutTypeEnum,
} from '@rbx/clients/groups';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
// eslint-disable-next-line no-restricted-imports -- needed for group members search
import { checkGroupMembership } from '@modules/group/utils/groupUtils';
import { Organization } from '@modules/clients/organizationApi';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
// eslint-disable-next-line no-restricted-imports -- events
import { logOrganizationsEvent, OrganizationsEventName } from '@modules/group/utils/eventUtils';
import { OneTimePayoutBase, OneTimePayoutFormType } from '../interface/OneTimePayoutFormType';
import {
  validateAllPayoutsNonZero,
  validatePositiveIntegerInput,
  validateTotalGroupPayoutSum,
} from '../utils/payoutsUtils';
import { getOneTimePayoutStatus } from '../utils/oneTimePayoutStatus';
import usePaymentSentToast from '../hooks/usePaymentSentToast';
import DebouncedUserSelector from './DebouncedUserSelector';
import { EconomyEligibilityMaxPageSize } from '../constants/payoutsConstants';
import FilteredUserType from '../interface/FilteredUserType';
import PayoutInitiatedDialog from './PayoutInitiatedDialog';

const useOneTimePayoutDialogueStyles = makeStyles()((theme) => ({
  dialogTitleWithClose: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  dialogContent: {
    paddingBottom: 0,
    minHeight: 32,
    [theme.breakpoints.down('Large')]: {
      minWidth: 200,
    },
  },

  dialogActions: {
    marginTop: 32,
    '& > *:not(:last-child)': {
      marginRight: 8,
    },
    '& .MuiButton-root': {
      paddingLeft: 8,
      paddingRight: 8,
    },
  },

  buttonGridItem: {
    '& button': {
      height: '100%',
    },
  },

  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },

  rowContainer: {
    '& > *': {
      padding: '12px 0px',
    },
    '&:first-child': {
      paddingTop: 0,
    },
    '&:last-child': {
      paddingBottom: 0,
    },
  },

  rowInner: {
    '& > *:not(:first-child)': {
      marginLeft: 8,
    },
  },

  divider: {
    paddingBottom: 16,
  },

  mutedText: {
    color: theme.palette.content.muted,
  },

  robuxIcon: {
    width: 24,
    height: 24,
    verticalAlign: 'sub',
    fontSize: '1rem',
    marginRight: 4,
  },

  paddedContainer: {
    '& > *:not(:last-child)': {
      margin: `16px 0px`,
    },
  },

  marginBottom: {
    marginBottom: 16,
  },

  fromToLabel: {
    marginBottom: 8,
  },

  dialogContainer: {
    '& .MuiDialog-container': {
      '& .MuiDialog-paper': {
        minWidth: 600,
        maxHeight: '652px',
        [theme.breakpoints.down('Large')]: {
          width: 390,
          minWidth: 390,
        },
        [theme.breakpoints.down('Medium')]: {
          width: 360,
          minWidth: 360,
        },
      },
    },
  },

  robuxInput: {
    minWidth: 100,
    maxWidth: 120,
  },

  thumbnailWrapper: {
    flex: '1 1 auto',
    minWidth: 0,
    marginRight: 8,
    '& > div': {
      width: '100%',
    },
  },

  amountWrapper: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
  },
}));

export interface OneTimePayoutDialogueProps {
  organization: Organization;
  onClose: () => void;
  open: boolean;
  groupFunds: undefined | number;
  fetchGroupFunds: () => Promise<void>;
}

enum PayoutDialogueStage {
  Search = 'Search',
  Input = 'Input',
  Confirm = 'Confirm',
}

const OneTimePayoutDialogue: FunctionComponent<OneTimePayoutDialogueProps> = ({
  organization,
  onClose,
  open,
  groupFunds,
  fetchGroupFunds,
}) => {
  const {
    classes: {
      dialogTitleWithClose,
      dialogContent,
      dialogActions,
      errorMessageStyles,
      rowContainer,
      rowInner,
      divider,
      mutedText,
      paddedContainer,
      robuxIcon,
      marginBottom,
      fromToLabel,
      dialogContainer,
      robuxInput,
      thumbnailWrapper,
      amountWrapper,
      buttonGridItem,
    },
    cx,
  } = useOneTimePayoutDialogueStyles();

  const { translate } = useTranslation();
  const showTopMessageV2 = usePaymentSentToast();
  const currentGroup = useCurrentGroup();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const [payoutDialogueStage, setPayoutDialogueStage] = useState<PayoutDialogueStage>(
    PayoutDialogueStage.Search,
  );

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPayoutInitiatedDialogOpen, setIsPayoutInitiatedDialogOpen] = useState<boolean>(false);
  const [isCsvUploading, setIsCsvUploading] = useState<boolean>(false);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<string | null>(null);
  const { control, setValue, formState, getValues, reset, trigger } =
    useForm<OneTimePayoutFormType>({
      mode: FormMode.OnChange,
      reValidateMode: FormMode.OnChange,
      defaultValues: {
        payouts: [], // When dialog first opens, there are no default payouts
      },
      shouldUnregister: false,
    });
  const { isSubmitting, isValid, isValidating, isDirty } = formState;

  const payoutValidationRules = useMemo(
    () => ({
      validate: (payouts: OneTimePayoutBase[]) => {
        return (
          validateTotalGroupPayoutSum(payouts, groupFunds) &&
          validateAllPayoutsNonZero(payouts) &&
          payouts.length === selectedUsers.length
        );
      },
    }),
    [groupFunds, selectedUsers.length],
  );

  // Sync payouts with selectedUsers - initialize payouts for new users, remove for deselected users
  useEffect(() => {
    const currentPayouts = getValues('payouts') ?? [];
    const payoutMap = new Map(currentPayouts.map((p) => [p.userId, p.amount]));

    // Initialize payouts for all selected users (default to '0' if not present)
    const syncedPayouts: OneTimePayoutBase[] = selectedUsers.map((user) => {
      const userId = user.id?.toString() ?? '';
      return {
        userId,
        amount: payoutMap.get(userId) ?? '0',
      };
    });

    // Only update if payouts changed
    const hasChanged =
      syncedPayouts.length !== currentPayouts.length ||
      syncedPayouts.some((p, i) => p.userId !== currentPayouts[i]?.userId);

    if (hasChanged) {
      setValue('payouts', syncedPayouts);
    }
  }, [selectedUsers, getValues, setValue]);

  // Trigger validation when entering Input stage
  useEffect(() => {
    if (payoutDialogueStage === PayoutDialogueStage.Input) {
      trigger('payouts');
    }
  }, [payoutDialogueStage, trigger]);

  const checkUserEligibility = useCallback(
    async (userIds: number[]) => {
      if (userIds.length === 0) {
        return { memberUserIds: [], eligibilityMap: new Map<number, string>() };
      }

      const groupId = Number.parseInt(organization.groupId, 10);

      // Check group membership
      const membershipPromises = userIds.map((userId) => checkGroupMembership(groupId, userId));
      const resolvedMembershipPromises = await Promise.all(membershipPromises);
      const memberUserIds = userIds.filter((_userId, index) => resolvedMembershipPromises[index]);

      // Check payout eligibility
      const totalChunks = Math.ceil(memberUserIds.length / EconomyEligibilityMaxPageSize);
      const eligibilityPromises = [];
      for (let i = 0; i < totalChunks; i += 1) {
        const start = i * EconomyEligibilityMaxPageSize;
        const end = start + EconomyEligibilityMaxPageSize;
        const chunk = memberUserIds.slice(start, end);
        const promise = economyClient.getGroupUserPayoutEligibility(groupId, chunk);
        eligibilityPromises.push(promise);
      }

      const resolvedEligibilityPromises = await Promise.all(eligibilityPromises);

      const eligibilityMap: Map<number, string> = new Map();
      resolvedEligibilityPromises.forEach((result) => {
        Object.entries(result.usersGroupPayoutEligibility ?? []).forEach(([key, value]) => {
          eligibilityMap.set(Number.parseInt(key, 10), value);
        });
      });

      return { memberUserIds, eligibilityMap };
    },
    [organization.groupId],
  );

  const filterUsers = useCallback(
    async (results: Array<User>) => {
      if (results.length === 0) {
        return [];
      }

      const userIds = results
        .map((result) => result.id)
        .filter((id) => id !== undefined) as Array<number>;

      const { memberUserIds, eligibilityMap } = await checkUserEligibility(userIds);

      // Filter to only include group members and map to FilteredUserType
      const eligibleGroupMembers: Array<FilteredUserType> = results
        .filter((member) => member.id && memberUserIds.includes(member.id))
        .map((member) => {
          const isUserEligible = !member?.id || eligibilityMap.get(member.id) === 'Eligible';

          return {
            user: member,
            label: !isUserEligible ? translate('Label.UserNotEligible') : undefined,
            disabled: !isUserEligible,
          };
        });

      return eligibleGroupMembers;
    },
    [checkUserEligibility, translate],
  );

  const handleClose = useCallback(() => {
    onClose();
    setPayoutDialogueStage(PayoutDialogueStage.Search);
    setSelectedUsers([]);
    setCsvErrors([]);
    setCsvWarnings([]);
    setFormSubmissionErrorMsg(null);
    reset();
  }, [onClose, reset]);

  const handleCsvUpload = useCallback(
    async (file: File) => {
      setCsvErrors([]);
      setCsvWarnings([]);
      setIsCsvUploading(true);

      const maxSizeInKilobytes = 2;
      const bytesPerKB = 1024;
      if (file.size > maxSizeInKilobytes * bytesPerKB) {
        setCsvErrors([
          translate('Error.CsvFileTooLarge', {
            maxSizeStringWithUnits: `${maxSizeInKilobytes}KB`,
            actualSizeStringWithUnits: `${(file.size / bytesPerKB).toFixed(2)}KB`,
          }),
        ]);
        setIsCsvUploading(false);
        return;
      }

      Papa.parse<{ userid: string; payoutinrobux: string }>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
        transform: (v: string) => v.trim(),
        complete: async (result: Papa.ParseResult<{ userid: string; payoutinrobux: string }>) => {
          const errors: string[] = [];
          const userIds: number[] = [];

          // Validate headers
          const requiredCsvHeaders = ['userId', 'payoutInRobux'];
          const headers = result.meta.fields || [];
          const normalizedRequiredHeaders = requiredCsvHeaders.map((h) => h.toLowerCase());
          const missingHeaders = normalizedRequiredHeaders.filter(
            (header) => !headers.includes(header),
          );

          if (missingHeaders.length > 0) {
            errors.push(
              translate('Error.CsvMissingHeaders', {
                requiredHeaders: requiredCsvHeaders.join(', '),
              }),
            );
            setCsvErrors(errors);
            setIsCsvUploading(false);
            return;
          }

          // Validate user IDs
          result.data.forEach((row: { userid: string; payoutinrobux: string }, i: number) => {
            const line = i + 2; // account for header row and 0 index
            const userIdStr = row.userid;
            const amountStr = row.payoutinrobux;
            const userId = Number(userIdStr);
            const amount = Number(amountStr);

            if (!userIdStr || !amountStr) {
              errors.push(
                translate('Error.CsvMissingValueAtLine', { lineNumber: line.toString() }),
              );
            } else if (Number.isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
              errors.push(
                translate('Error.CsvInvalidUserIdAtLine', {
                  userIdString: userIdStr,
                  lineNumber: line.toString(),
                }),
              );
            } else if (Number.isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
              errors.push(
                translate('Error.CsvInvalidAmountAtLine', {
                  amountString: amountStr,
                  lineNumber: line.toString(),
                }),
              );
            } else {
              userIds.push(userId);
            }
          });

          if (errors.length > 0) {
            setCsvErrors(errors);
            setIsCsvUploading(false);
            return;
          }

          const uniqueUserIds = Array.from(new Set(userIds));
          const duplicateUserIds = uniqueUserIds.filter(
            (id) => userIds.filter((userId) => userId === id).length > 1,
          );

          try {
            const { memberUserIds, eligibilityMap } = await checkUserEligibility(uniqueUserIds);

            const warnings: string[] = [];

            if (duplicateUserIds.length > 0) {
              warnings.push(
                translate('Message.CsvDuplicateUserIds', {
                  duplicatedUserIds: duplicateUserIds.join(', '),
                }),
              );
            }

            // Check for users not in group - add as warning, not error
            const nonMemberUserIds = uniqueUserIds.filter((id) => !memberUserIds.includes(id));
            if (nonMemberUserIds.length > 0) {
              warnings.push(
                translate('Message.CsvUsersNotInGroup', {
                  groupName: currentGroup?.name ?? '',
                  nonMemberUserIds: nonMemberUserIds.join(', '),
                }),
              );
            }

            // Check for ineligible users - add as warning, not error
            const ineligibleUserIds = memberUserIds.filter(
              (userId) => eligibilityMap.get(userId) !== 'Eligible',
            );
            if (ineligibleUserIds.length > 0) {
              warnings.push(
                translate('Message.CsvUsersNotEligible', {
                  ineligibleUserIds: ineligibleUserIds.join(', '),
                }),
              );
            }

            const usersResponse = await usersClient.getUsersByIds(memberUserIds);
            const users: User[] = usersResponse.data ?? [];

            // Add to existing selectedUsers, filtering out duplicates and enforcing max limit
            setSelectedUsers((prev) => {
              const existingUserIds = new Set(prev.map((u) => u.id));
              const newUsers = users.filter((u) => !existingUserIds.has(u.id));
              const maxUsers = 20;
              const availableSlots = maxUsers - prev.length;
              const usersToAdd = newUsers.slice(0, availableSlots);

              // Add warning if some users couldn't be added due to max limit
              if (newUsers.length > availableSlots) {
                const skippedCount = newUsers.length - availableSlots;
                warnings.push(
                  translate('Message.CsvMaxUsersReached', {
                    skippedCount: skippedCount.toString(),
                    maxUsers: maxUsers.toString(),
                  }),
                );
              }

              return [...prev, ...usersToAdd];
            });

            setCsvWarnings(warnings);

            // Create payouts array from CSV data (only for eligible members)
            const memberUserIdSet = new Set(memberUserIds);
            const newPayouts: OneTimePayoutBase[] = result.data.reduce<OneTimePayoutBase[]>(
              (accumulator, row: { userid: string; payoutinrobux: string }) => {
                if (memberUserIdSet.has(Number(row.userid))) {
                  accumulator.push({ userId: row.userid, amount: row.payoutinrobux });
                }
                return accumulator;
              },
              [],
            );

            // Merge with existing payouts, updating amounts for duplicates
            const existingPayouts = getValues('payouts') ?? [];
            const payoutMap = new Map(existingPayouts.map((p) => [p.userId, p.amount]));
            newPayouts.forEach((p) => payoutMap.set(p.userId, p.amount));
            const mergedPayouts = Array.from(payoutMap.entries()).map(([userId, amount]) => ({
              userId,
              amount,
            }));

            setValue('payouts', mergedPayouts, { shouldValidate: true });
          } catch {
            errors.push(translate('Error.CsvParsingFailed'));
            setCsvErrors(errors);
          } finally {
            setIsCsvUploading(false);
          }
        },
        error: () => {
          setCsvErrors([translate('Error.CsvParsingFailed')]);
          setIsCsvUploading(false);
        },
      });
    },
    [checkUserEligibility, currentGroup?.name, getValues, setValue, translate],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleCsvUpload(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleCsvUpload],
  );

  const handleUploadCsvClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const searchDialogContent = useCallback(() => {
    return (
      <DialogContent className={dialogContent}>
        <Grid container className={dialogTitleWithClose}>
          <Typography variant='h3' align='left'>
            {translate('Title.SendAOneTimePayout')}
          </Typography>
          <IconButton
            aria-label={translate('Action.Close')}
            onClick={handleClose}
            edge='end'
            size='medium'
            color='secondary'>
            <CloseIcon />
          </IconButton>
        </Grid>

        {csvErrors.length > 0 && (
          <Alert severity='error' variant='standard' style={{ marginBottom: 16 }}>
            <AlertTitle>{translate('Title.CsvUploadFailed')}</AlertTitle>
            {csvErrors.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </Alert>
        )}

        {csvWarnings.length > 0 && (
          <Alert severity='warning' variant='standard' style={{ marginBottom: 16 }}>
            <AlertTitle>{translate('Title.UploadCsvWarning')}</AlertTitle>
            {csvWarnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </Alert>
        )}

        <DebouncedUserSelector
          value={selectedUsers}
          onChange={setSelectedUsers}
          onFilter={filterUsers}
          multiselect
          altHelperText={translate('Label.MaxCreators')}
        />
      </DialogContent>
    );
  }, [
    dialogContent,
    dialogTitleWithClose,
    translate,
    selectedUsers,
    filterUsers,
    handleClose,
    csvErrors,
    csvWarnings,
  ]);

  const parsePayoutAmount = useCallback((amount: string): number => {
    return amount.length === 0 ? 0 : Number.parseInt(amount, 10);
  }, []);

  const getPayoutsTotal = useCallback(
    (payouts: OneTimePayoutBase[]) => {
      if (!payouts || payouts.length === 0) {
        return 0;
      }
      return payouts.reduce((sum, payout) => sum + parsePayoutAmount(payout.amount), 0);
    },
    [parsePayoutAmount],
  );

  const getPayoutsTotalLabel = useCallback(
    (payouts: OneTimePayoutBase[]) => {
      return (
        <Grid container justifyItems='space-between' wrap='nowrap'>
          <Grid container>
            <Typography variant='h5' align='left'>
              {translate('Label.Total')}
            </Typography>
          </Grid>

          <Grid container alignItems='center' justifyContent='end'>
            <RobuxIcon className={robuxIcon} />
            <Typography variant='h6'>{getPayoutsTotal(payouts).toLocaleString()}</Typography>
          </Grid>
        </Grid>
      );
    },
    [robuxIcon, translate, getPayoutsTotal],
  );

  const inputDialogContent = useCallback(() => {
    return (
      <DialogContent className={dialogContent}>
        <Grid container className={cx(marginBottom, dialogTitleWithClose)}>
          <Typography variant='h3' align='left'>
            {translate('Title.SendAOneTimePayout')}
          </Typography>
          <IconButton
            aria-label={translate('Action.Close')}
            onClick={handleClose}
            edge='end'
            size='medium'
            color='secondary'>
            <CloseIcon />
          </IconButton>
        </Grid>

        <Controller
          name='payouts'
          control={control}
          rules={payoutValidationRules}
          render={({ field: { value: payouts } }) => (
            <Grid container className={paddedContainer}>
              <Grid item XSmall>
                {!validateTotalGroupPayoutSum(payouts, groupFunds) && (
                  <Alert severity='error' variant='filled'>
                    {translate('Error.PayoutSumExceedsFunds')}
                  </Alert>
                )}
              </Grid>

              <Fragment>{getPayoutsTotalLabel(payouts)}</Fragment>

              <Grid container className={rowContainer}>
                {selectedUsers.map((user) => {
                  const payout = payouts?.find(
                    (p: OneTimePayoutBase) => p.userId === user.id?.toString(),
                  ) ?? { userId: user.id?.toString(), amount: '0' };

                  return (
                    <Grid
                      key={user.id}
                      container
                      wrap='nowrap'
                      alignItems='center'
                      className={rowInner}>
                      <Grid item className={thumbnailWrapper}>
                        <ThumbnailWithNames
                          target={user}
                          targetType={CreatorType.User}
                          textVariant='secondary'
                        />
                      </Grid>

                      <Grid item className={amountWrapper}>
                        <TextField
                          className={robuxInput}
                          variant='outlined'
                          size='small'
                          label='Amount'
                          id='payout-amount'
                          error={
                            Number.parseInt(payout?.amount || '0', 10) <= 0 ||
                            !validateTotalGroupPayoutSum(payouts, groupFunds)
                          }
                          value={payout?.amount}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            let newAmount = event.target.value;
                            const filteredPayouts = payouts.filter(
                              (p) => p.userId !== user.id?.toString(),
                            );

                            if (validatePositiveIntegerInput(newAmount)) {
                              if (newAmount !== '') {
                                newAmount = Number.parseInt(newAmount, 10).toString();
                              }

                              const newPayouts = [
                                ...filteredPayouts,
                                {
                                  userId: user.id!.toString(),
                                  amount: newAmount,
                                },
                              ];
                              setValue('payouts', newPayouts, { shouldValidate: true });
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position='end'>
                                <RobuxIcon fontSize='large' />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>

              {formSubmissionErrorMsg && !isDirty && (
                <FormHelperText className={errorMessageStyles}>
                  {formSubmissionErrorMsg}
                </FormHelperText>
              )}
            </Grid>
          )}
        />
      </DialogContent>
    );
  }, [
    control,
    cx,
    dialogContent,
    dialogTitleWithClose,
    errorMessageStyles,
    formSubmissionErrorMsg,
    getPayoutsTotalLabel,
    groupFunds,
    handleClose,
    isDirty,
    marginBottom,
    paddedContainer,
    rowContainer,
    rowInner,
    selectedUsers,
    setValue,
    translate,
    robuxInput,
    payoutValidationRules,
    thumbnailWrapper,
    amountWrapper,
  ]);

  const getUserPayoutAmount = useCallback((payouts: OneTimePayoutBase[], user: User) => {
    const payout = payouts?.find((p) => p.userId === user.id?.toString())?.amount ?? '0';
    return Number.parseInt(payout, 10).toLocaleString();
  }, []);

  const confirmDialogContent = useCallback(() => {
    const { payouts } = getValues();

    return (
      <DialogContent className={dialogContent}>
        <Grid container className={cx(dialogTitleWithClose, marginBottom)}>
          <Typography variant='h3' align='left'>
            {translate('Title.ConfirmPayment')}
          </Typography>
          <IconButton
            aria-label={translate('Action.Close')}
            onClick={handleClose}
            edge='end'
            size='medium'
            color='secondary'>
            <CloseIcon />
          </IconButton>
        </Grid>
        <Grid container className={paddedContainer}>
          <Grid container wrap='wrap' direction='column'>
            <Typography variant='h6' align='left' className={cx(mutedText, fromToLabel)}>
              {translate('Label.From')}
            </Typography>

            {currentGroup ? (
              <ThumbnailWithNames
                target={currentGroup}
                targetType={CreatorType.Group}
                textVariant='secondary'
              />
            ) : (
              <Skeleton variant='square' width={400} height={48} animate />
            )}
          </Grid>

          <Grid container wrap='wrap' direction='column'>
            <Typography variant='h6' align='left' className={cx(mutedText, fromToLabel)}>
              {translate('Label.To')}
            </Typography>

            <Grid container className={rowContainer}>
              {selectedUsers.map((user) => (
                <Grid
                  key={user.id}
                  container
                  wrap='nowrap'
                  alignItems='center'
                  className={rowInner}
                  style={{ overflow: 'hidden' }}>
                  <Grid item className={thumbnailWrapper}>
                    <ThumbnailWithNames
                      target={user}
                      targetType={CreatorType.User}
                      textVariant='secondary'
                    />
                  </Grid>

                  <Grid item className={amountWrapper}>
                    <RobuxIcon fontSize='large' />
                    <Typography variant='h6' style={{ marginLeft: '6px' }}>
                      {getUserPayoutAmount(payouts, user)}
                    </Typography>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item XSmall={12} className={divider}>
            <Divider />
          </Grid>

          <Fragment>{getPayoutsTotalLabel(payouts)}</Fragment>
        </Grid>
      </DialogContent>
    );
  }, [
    currentGroup,
    cx,
    dialogContent,
    dialogTitleWithClose,
    divider,
    fromToLabel,
    getPayoutsTotalLabel,
    getUserPayoutAmount,
    getValues,
    handleClose,
    marginBottom,
    mutedText,
    paddedContainer,
    rowContainer,
    rowInner,
    selectedUsers,
    translate,
    thumbnailWrapper,
    amountWrapper,
  ]);

  const handleFormSubmit: SubmitHandler<OneTimePayoutFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);
      setIsSaving(true);
      try {
        const { payouts } = data;
        const payoutRecipients: Array<RobloxGroupsApiPayoutRecipientRequest> = payouts.map(
          (payout) => ({
            recipientId: Number.parseInt(payout.userId, 10),
            recipientType: RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum.NUMBER_0, // User
            amount: parsePayoutAmount(payout.amount),
          }),
        );

        const groupId = Number.parseInt(organization.groupId, 10);
        const payoutResponse = await groupsClient.updateGroupPayouts(groupId, {
          payoutType: RobloxGroupsApiPayoutRequestPayoutTypeEnum.NUMBER_1, // FixedAmount
          recipients: payoutRecipients,
        });

        const payoutStatus = getOneTimePayoutStatus(payoutResponse);
        if (payoutStatus === 'Held') {
          handleClose();
          setIsPayoutInitiatedDialogOpen(true);
        } else {
          showTopMessageV2(translate('Title.PaymentSent'));
          handleClose();
        }
        logOrganizationsEvent(unifiedLogger, OrganizationsEventName.ClickOrgsConfirmOneTimePayout, {
          group_id: organization?.groupId ?? '',
          payouts: JSON.stringify(payouts),
        });
      } catch {
        setFormSubmissionErrorMsg(translate('Error.SendingPayments'));
        setPayoutDialogueStage(PayoutDialogueStage.Input);
      } finally {
        setIsSaving(false);
        await fetchGroupFunds();
      }
    },
    [
      handleClose,
      organization.groupId,
      showTopMessageV2,
      translate,
      fetchGroupFunds,
      unifiedLogger,
      parsePayoutAmount,
    ],
  );

  const nextAction = useCallback(() => {
    if (payoutDialogueStage === PayoutDialogueStage.Search) {
      setCsvErrors([]);
      setCsvWarnings([]);
      setPayoutDialogueStage(PayoutDialogueStage.Input);
    }
    if (payoutDialogueStage === PayoutDialogueStage.Input) {
      setPayoutDialogueStage(PayoutDialogueStage.Confirm);
    }
    if (payoutDialogueStage === PayoutDialogueStage.Confirm) {
      handleFormSubmit(getValues());
    }
  }, [payoutDialogueStage, handleFormSubmit, getValues]);

  const isNextDisabled = useCallback(() => {
    if (payoutDialogueStage === PayoutDialogueStage.Search) {
      return isCsvUploading || selectedUsers.length === 0;
    }

    if (payoutDialogueStage === PayoutDialogueStage.Input) {
      return isValidating || !isValid;
    }

    if (payoutDialogueStage === PayoutDialogueStage.Confirm) {
      return isSaving || isSubmitting;
    }

    return true;
  }, [
    payoutDialogueStage,
    selectedUsers.length,
    isCsvUploading,
    isValidating,
    isValid,
    isSaving,
    isSubmitting,
  ]);

  return (
    <React.Fragment>
      <Dialog open={open} onClose={handleClose} className={dialogContainer}>
        <input
          ref={fileInputRef}
          type='file'
          accept='.csv'
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        {payoutDialogueStage === PayoutDialogueStage.Search && searchDialogContent()}
        {payoutDialogueStage === PayoutDialogueStage.Input && inputDialogContent()}
        {payoutDialogueStage === PayoutDialogueStage.Confirm && confirmDialogContent()}

        <DialogActions className={dialogActions}>
          <Grid container spacing={1}>
            <Grid item XSmall={6} className={buttonGridItem}>
              <Button
                onClick={nextAction}
                color='primaryBrand'
                variant='contained'
                fullWidth
                disabled={isNextDisabled()}
                loading={isSubmitting || isSaving}>
                {payoutDialogueStage === PayoutDialogueStage.Search && translate('Action.Next')}
                {payoutDialogueStage === PayoutDialogueStage.Input &&
                  translate('Action.ContinueToReview')}
                {payoutDialogueStage === PayoutDialogueStage.Confirm &&
                  translate('Action.ConfirmAndSend')}
              </Button>
            </Grid>
            <Grid item XSmall={6} className={buttonGridItem}>
              {payoutDialogueStage === PayoutDialogueStage.Search ? (
                <Tooltip
                  placement='bottom'
                  title={translate('Tooltip.ExamplePayoutCsv')}
                  slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
                  arrow
                  data-testid='csv-format-tooltip'>
                  <div>
                    <Button
                      onClick={handleUploadCsvClick}
                      variant='contained'
                      color='secondary'
                      fullWidth
                      disabled={isSubmitting || isCsvUploading}
                      loading={isCsvUploading}>
                      {translate('Action.UploadFileType', {
                        fileType: '.csv',
                      })}
                    </Button>
                  </div>
                </Tooltip>
              ) : (
                <Button
                  onClick={() => {
                    if (payoutDialogueStage === PayoutDialogueStage.Confirm) {
                      setPayoutDialogueStage(PayoutDialogueStage.Input);
                    } else {
                      setPayoutDialogueStage(PayoutDialogueStage.Search);
                    }
                  }}
                  variant='contained'
                  color='secondary'
                  fullWidth
                  disabled={isSubmitting}>
                  {translate('Action.Back')}
                </Button>
              )}
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
      <PayoutInitiatedDialog
        open={isPayoutInitiatedDialogOpen}
        onClose={() => setIsPayoutInitiatedDialogOpen(false)}
      />
    </React.Fragment>
  );
};

export default OneTimePayoutDialogue;
