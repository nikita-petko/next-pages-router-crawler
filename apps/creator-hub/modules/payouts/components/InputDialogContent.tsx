import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import { numberFormatter } from '@rbx/core';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
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
import type { NormalizedEstimatedFiat } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { MaxPayoutCount } from '../constants/payoutsConstants';
import type { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import {
  computePerRecipientAllocations,
  allocatePayoutWatermarkBuckets,
} from '../utils/groupWatermarkUtils';
import {
  validatePositiveIntegerInput,
  validateTotalGroupPayoutSum,
  calculatePayoutsTotal,
} from '../utils/payoutsUtils';
import GroupMemberSelector, { type UserWithMetadata } from './GroupMemberSelector';
import PayoutAllocationBreakdown from './PayoutAllocationBreakdown';

export interface InputDialogContentProps {
  payouts: OneTimePayoutBase[];
  groupId: string;
  organizationId: string;
  groupFunds?: number;
  csvErrors: string[];
  csvWarnings: string[];
  formSubmissionErrorMsg?: string;
  normalizedWatermarks?: NormalizedEstimatedFiat;
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
  normalizedWatermarks,
  onUserSelect,
  onPayoutRemove,
  onPayoutAmountChange,
}) => {
  const { translate } = useTranslation();
  const [isTotalBreakdownExpanded, setIsTotalBreakdownExpanded] = useState(false);

  const perRecipientAllocations = useMemo(() => {
    if (!normalizedWatermarks || payouts.length === 0) {
      return undefined;
    }
    const amounts = payouts.map((p) => {
      const n = Number.parseInt(p.amount, 10);
      return Number.isNaN(n) ? 0 : n;
    });
    return computePerRecipientAllocations(amounts, normalizedWatermarks);
  }, [payouts, normalizedWatermarks]);

  const totalAllocation = useMemo(() => {
    if (!normalizedWatermarks || payouts.length === 0) {
      return undefined;
    }
    const total = calculatePayoutsTotal(payouts);
    if (total <= 0) {
      return undefined;
    }
    return allocatePayoutWatermarkBuckets(total, normalizedWatermarks);
  }, [payouts, normalizedWatermarks]);

  return (
    <>
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
                  {payouts.map((thisPayout, index) => (
                    <Grid key={thisPayout.user.id} container alignItems='center' gap={1}>
                      <Grid item XSmall overflow='hidden'>
                        <ThumbnailWithNames
                          target={thisPayout.user}
                          targetType={CreatorType.User}
                          textVariant='secondary'
                        />
                      </Grid>

                      <Grid item XSmall={12} Medium={3} order={{ XSmall: 2, Medium: 1 }}>
                        <Grid container direction='column' gap={0.5}>
                          <Grid item>
                            <TextField
                              fullWidth
                              variant='outlined'
                              size='small'
                              label=''
                              id={`payout-amount-${thisPayout.user.id}`}
                              error={
                                Number.parseInt(thisPayout?.amount || '0', 10) <= 0 ||
                                !validateTotalGroupPayoutSum(payouts, groupFunds)
                              }
                              value={thisPayout.amount}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                let { value } = event.target;

                                if (validatePositiveIntegerInput(value)) {
                                  if (value !== '') {
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
                          {perRecipientAllocations?.[index] &&
                            perRecipientAllocations[index].totalUsd > 0 && (
                              <Grid item>
                                <Typography
                                  variant='caption'
                                  className='font-semibold padding-left-xxlarge margin-left-small'>
                                  {String(
                                    numberFormatter(
                                      perRecipientAllocations[index].totalUsd,
                                      'currency',
                                    ),
                                  )}
                                </Typography>
                              </Grid>
                            )}
                        </Grid>
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
                    <>
                      <Grid item XSmall={12}>
                        <Divider />
                      </Grid>

                      <Grid container alignItems='flex-start' gap={1}>
                        <Grid item XSmall>
                          <Grid container direction='column' gap={2}>
                            <Grid item>
                              <Grid container alignItems='center' gap={0.5}>
                                <Grid item>
                                  <Typography variant='h5'>{translate('Label.Total')}</Typography>
                                </Grid>
                                {totalAllocation && (
                                  <Grid item>
                                    <IconButton
                                      aria-label={translate('Action.ToggleBreakdown')}
                                      size='small'
                                      color='secondary'
                                      variant='default'
                                      onClick={() => setIsTotalBreakdownExpanded((prev) => !prev)}>
                                      <Icon
                                        name={
                                          isTotalBreakdownExpanded
                                            ? 'icon-regular-chevron-large-up'
                                            : 'icon-regular-chevron-large-down'
                                        }
                                        size='XSmall'
                                      />
                                    </IconButton>
                                  </Grid>
                                )}
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>

                        <Grid item XSmall={12} Medium={3} order={{ XSmall: 2, Medium: 1 }}>
                          <Grid container direction='column' gap={0.5}>
                            <Grid item>
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
                            {totalAllocation && totalAllocation.totalUsd > 0 && (
                              <Grid item>
                                <Typography
                                  variant='caption'
                                  className='font-semibold padding-left-xxlarge margin-left-small'>
                                  {String(numberFormatter(totalAllocation.totalUsd, 'currency'))}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>

                        <Grid item XSmall={1} order={{ XSmall: 1, Medium: 2 }} id='test-id'>
                          {/* Empty space to align with remove button above */}
                        </Grid>
                      </Grid>
                      {isTotalBreakdownExpanded && totalAllocation && normalizedWatermarks && (
                        <Grid item className='width-full'>
                          <PayoutAllocationBreakdown
                            allocation={totalAllocation}
                            normalizedWatermarks={normalizedWatermarks}
                            breakdownLayout={{
                              labelGrow: 2,
                              robuxGrow: 1,
                              robuxLeftPaddingClass: 'padding-left-small',
                            }}
                          />
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </>
  );
};

export default InputDialogContent;
