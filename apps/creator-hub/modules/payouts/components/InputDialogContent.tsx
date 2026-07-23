import React, { Fragment, FunctionComponent } from 'react';
import {
  Typography,
  DialogContent,
  InputAdornment,
  Grid,
  TextField,
  RobuxIcon,
  Divider,
  Alert,
  AlertTitle,
  IconButton,
  RemoveCircleOutlineIcon,
  DialogTitle,
} from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import {
  validatePositiveIntegerInput,
  validateTotalGroupPayoutSum,
  calculatePayoutsTotal,
} from '../utils/payoutsUtils';
import GroupMemberSelector, { type UserWithMetadata } from './GroupMemberSelector';
import { MaxPayoutCount } from '../constants/payoutsConstants';

export interface InputDialogContentProps {
  payouts: OneTimePayoutBase[];
  groupId: string;
  organizationId: string;
  groupFunds?: number;
  csvErrors: string[];
  csvWarnings: string[];
  formSubmissionErrorMsg?: string;
  onUserSelect: (userWithMetadata: UserWithMetadata | undefined) => void;
  onPayoutRemove: (userId: number) => void;
  onPayoutAmountChange: (userId: number, amount: string) => void;
}

const InputDialogContent: FunctionComponent<InputDialogContentProps> = ({
  payouts,
  groupId,
  organizationId,
  groupFunds,
  csvErrors,
  csvWarnings,
  formSubmissionErrorMsg,
  onUserSelect,
  onPayoutRemove,
  onPayoutAmountChange,
}) => {
  const { translate } = useTranslation();

  return (
    <Fragment>
      <DialogTitle>{translate('Title.SendAOneTimePayout')}</DialogTitle>
      <DialogContent>
        <Grid container direction='column' gap={3}>
          <Grid item>
            <Grid container direction='column' gap={1}>
              <Grid item>
                <GroupMemberSelector
                  groupId={groupId}
                  organizationId={organizationId}
                  excludeUserIds={new Set(payouts.map((payout) => payout.user.id))}
                  helperText={
                    payouts.length >= MaxPayoutCount
                      ? translate('Label.SearchMaxUsersReached', {
                          maxUsers: MaxPayoutCount.toString(),
                        })
                      : undefined
                  }
                  disabled={payouts.length >= MaxPayoutCount}
                  onSelectUser={onUserSelect}
                />
              </Grid>

              {csvWarnings.length > 0 && (
                <Grid item>
                  <Alert severity='warning' variant='standard'>
                    <AlertTitle>{translate('Title.UploadCsvWarning')}</AlertTitle>
                    {csvWarnings.map((warning) => (
                      <div key={warning}>{warning}</div>
                    ))}
                  </Alert>
                </Grid>
              )}

              {csvErrors.length > 0 && (
                <Grid item>
                  <Alert severity='error' variant='standard'>
                    <AlertTitle>{translate('Title.CsvUploadFailed')}</AlertTitle>
                    {csvErrors.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </Alert>
                </Grid>
              )}

              {formSubmissionErrorMsg && (
                <Alert severity='error' variant='standard'>
                  <Typography variant='body1'>{formSubmissionErrorMsg}</Typography>
                </Alert>
              )}

              {!validateTotalGroupPayoutSum(payouts, groupFunds) && (
                <Grid item>
                  <Alert severity='error' variant='standard'>
                    <Typography variant='body1'>
                      {translate('Error.PayoutSumExceedsFunds')}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Grid>
          <Grid item>
            <Grid container gap={3}>
              <Grid item minWidth={0}>
                <Grid container gap={3}>
                  {payouts.map((thisPayout) => (
                    <Grid key={thisPayout.user.id} container alignItems='center' gap={1}>
                      <Grid item XSmall overflow='hidden'>
                        <ThumbnailWithNames
                          target={thisPayout.user}
                          targetType={CreatorType.User}
                          textVariant='secondary'
                        />
                      </Grid>

                      <Grid item XSmall={12} Medium={3} order={{ XSmall: 2, Medium: 1 }}>
                        <TextField
                          fullWidth
                          variant='outlined'
                          size='small'
                          label=''
                          id='payout-amount'
                          error={
                            Number.parseInt(thisPayout?.amount || '0', 10) <= 0 ||
                            !validateTotalGroupPayoutSum(payouts, groupFunds)
                          }
                          value={thisPayout.amount}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            let { value } = event.target;

                            if (validatePositiveIntegerInput(value)) {
                              // Prevent empty field from becoming NaN
                              if (value !== '') {
                                // This conversion serves to eliminate any leading 0s
                                value = Number.parseInt(value, 10).toString();
                              }
                              onPayoutAmountChange(thisPayout.user.id, value);
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

                      <Grid item XSmall={1} order={{ XSmall: 1, Medium: 2 }}>
                        <IconButton
                          aria-label={translate('Action.RemoveUser')}
                          color='secondary'
                          variant='default'
                          size='medium'
                          onClick={() => {
                            onPayoutRemove(thisPayout.user.id);
                          }}>
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                  {payouts.length > 0 && (
                    <Fragment>
                      <Grid item XSmall={12}>
                        <Divider />
                      </Grid>

                      <Grid container alignItems='center' gap={1}>
                        <Grid item XSmall>
                          <Typography variant='h5'>{translate('Label.Total')}</Typography>
                        </Grid>

                        <Grid item XSmall={12} Medium={3} order={{ XSmall: 2, Medium: 1 }}>
                          <TextField
                            fullWidth
                            variant='outlined'
                            size='small'
                            label=''
                            id='payout-total'
                            disabled
                            value={calculatePayoutsTotal(payouts)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position='end'>
                                  <RobuxIcon fontSize='large' />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid item XSmall={1} order={{ XSmall: 1, Medium: 2 }} id='test-id'>
                          {/* Empty space to align with remove button above */}
                        </Grid>
                      </Grid>
                    </Fragment>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Fragment>
  );
};

export default InputDialogContent;
