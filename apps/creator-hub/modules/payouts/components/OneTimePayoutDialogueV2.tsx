import { useSettings } from '@modules/settings';
import React, { useState, useCallback, FunctionComponent, useRef } from 'react';
import { makeStyles, Dialog, Button, DialogActions, Grid, Tooltip } from '@rbx/ui';
import { groupsClient, isValidUser } from '@modules/clients';
import { FormMode } from '@modules/miscellaneous/common';
import { useForm, SubmitHandler, useWatch } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  RobloxGroupsApiPayoutRecipientRequest,
  RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum,
  RobloxGroupsApiPayoutRequestPayoutTypeEnum,
} from '@rbx/clients/groups';
// eslint-disable-next-line no-restricted-imports -- needed for group members search
import { Organization } from '@modules/clients/organizationApi';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
// eslint-disable-next-line no-restricted-imports -- events
import { logOrganizationsEvent, OrganizationsEventName } from '@modules/group/utils/eventUtils';
import { useQueryClient } from '@tanstack/react-query';
import { suggestedPayoutsQueryKey } from '@modules/react-query/payouts';
import { OneTimePayoutFormTypeV2 as OneTimePayoutFormType } from '../interface/OneTimePayoutFormType';
import {
  getEconomicRestrictionErrorMsg,
  tryParseEconomicRestrictionError,
  validateAllPayoutsNonZero,
  validateTotalGroupPayoutSum,
} from '../utils/payoutsUtils';
import { getOneTimePayoutStatus } from '../utils/oneTimePayoutStatus';
import useUserPayoutEligibility from '../hooks/useUserPayoutEligibility';
import usePayoutCsvUpload from '../hooks/usePayoutCsvUpload';
import useFirstTimePayoutCheck from '../hooks/useFirstTimePayoutCheck';
import usePaymentSentToast from '../hooks/usePaymentSentToast';
import { MaxDialogueHeightPx } from '../constants/payoutsConstants';
import InputDialogContent from './InputDialogContent';
import ReviewDialogContent from './ReviewDialogContent';
import FirstPayoutWarningDialogContent from './FirstPayoutWarningDialogContent';
import PayoutInitiatedDialog from './PayoutInitiatedDialog';
import { type UserWithMetadata } from './GroupMemberSelector';

const useOneTimePayoutDialogueStyles = makeStyles()(() => ({
  dialogActionButton: {
    height: '100%',
  },
}));

export interface OneTimePayoutDialogueProps {
  organization: Organization;
  onClose: () => void;
  open: boolean;
  groupFunds?: number;
  fetchGroupFunds: () => Promise<void>;
}

enum PayoutDialogueStage {
  Input = 'Input',
  Confirm = 'Confirm',
  FirstPayoutWarning = 'FirstPayoutWarning',
}

const OneTimePayoutDialogueV2: FunctionComponent<OneTimePayoutDialogueProps> = ({
  organization,
  onClose,
  open,
  groupFunds,
  fetchGroupFunds,
}) => {
  const {
    classes: { dialogActionButton },
  } = useOneTimePayoutDialogueStyles();

  const { settings } = useSettings();
  const { translate } = useTranslation();
  const showTopMessageV2 = usePaymentSentToast();
  const currentGroup = useCurrentGroup();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { checkPayoutEligibility } = useUserPayoutEligibility({ groupId: organization.groupId });
  const queryClient = useQueryClient();

  const [payoutDialogueStage, setPayoutDialogueStage] = useState<PayoutDialogueStage>(
    PayoutDialogueStage.Input,
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPayoutInitiatedDialogOpen, setIsPayoutInitiatedDialogOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<string | undefined>(
    undefined,
  );
  const { control, setValue, formState, getValues, reset } = useForm<OneTimePayoutFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      payouts: [],
    },
    shouldUnregister: false,
  });
  const { isSubmitting, isValidating, isDirty } = formState;

  // Watch the payouts field to trigger re-renders when it changes
  const payouts = useWatch({
    control,
    name: 'payouts',
    defaultValue: [],
  });

  // Check for first-time payouts when we're on the Confirm stage
  const { firstTimePayouts, isLoading: isCheckingFirstTimePayouts } = useFirstTimePayoutCheck({
    organizationId: organization.id,
    payouts,
    enabled:
      payoutDialogueStage === PayoutDialogueStage.Confirm && !!settings?.enableFirstPayoutWarning,
  });

  const { handleCsvUpload, isCsvUploading, csvErrors, csvWarnings, clearCsvMessages } =
    usePayoutCsvUpload({
      checkPayoutEligibility,
      groupName: currentGroup?.name ?? '',
      getExistingPayouts: () => getValues('payouts') ?? [],
      onPayoutsUpdate: (updatedPayouts) => {
        setValue('payouts', updatedPayouts, { shouldValidate: true });
      },
    });

  const handleClose = useCallback(() => {
    onClose();
    setPayoutDialogueStage(PayoutDialogueStage.Input);
    clearCsvMessages();
    setFormSubmissionErrorMsg(undefined);
    reset();
  }, [onClose, reset, clearCsvMessages]);

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

  const handleUserSelect = useCallback(
    (userWithMetadata: UserWithMetadata | undefined) => {
      if (!userWithMetadata || !isValidUser(userWithMetadata.user)) {
        return;
      }

      const { user, metadata } = userWithMetadata;
      const currentPayouts = getValues('payouts') ?? [];
      const isAlreadySelected = currentPayouts.some((payout) => payout.user.id === user.id);
      if (isAlreadySelected) {
        return;
      }

      const amount = metadata?.amount ? metadata.amount.toString() : '0';
      setValue('payouts', [...currentPayouts, { user, amount }], {
        shouldValidate: true,
      });
    },
    [getValues, setValue],
  );

  const handlePayoutRemove = useCallback(
    (userId: number) => {
      const currentPayouts = getValues('payouts') ?? [];
      const newPayouts = currentPayouts.filter((payout) => payout.user.id !== userId);
      setValue('payouts', newPayouts, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const handlePayoutAmountChange = useCallback(
    (userId: number, amount: string) => {
      const currentPayouts = getValues('payouts') ?? [];
      const newPayouts = currentPayouts.map((payout) =>
        payout.user.id === userId ? { ...payout, amount } : payout,
      );
      setValue('payouts', newPayouts, { shouldValidate: true });
    },
    [getValues, setValue],
  );

  const handleFormSubmit: SubmitHandler<OneTimePayoutFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(undefined);
      setIsSaving(true);
      try {
        const { payouts: submittedPayouts } = data;
        const payoutRecipients: Array<RobloxGroupsApiPayoutRecipientRequest> = submittedPayouts.map(
          (payout) => ({
            recipientId: payout.user.id,
            recipientType: RobloxGroupsApiPayoutRecipientRequestRecipientTypeEnum.NUMBER_0, // User
            amount: Number.parseInt(payout.amount, 10),
          }),
        );

        const groupId = Number.parseInt(organization.groupId, 10);
        const payoutResponse = await groupsClient.updateGroupPayouts(groupId, {
          payoutType: RobloxGroupsApiPayoutRequestPayoutTypeEnum.NUMBER_1, // FixedAmount
          recipients: payoutRecipients,
        });

        // Invalidate suggested payouts cache after successful payment
        queryClient.invalidateQueries({ queryKey: suggestedPayoutsQueryKey(organization.id) });

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
          payouts: JSON.stringify(submittedPayouts),
        });
      } catch (err) {
        const restriction = await tryParseEconomicRestrictionError(err);
        const errorMsg = restriction
          ? getEconomicRestrictionErrorMsg(
              translate,
              restriction.failureReason,
              restriction.expirationTimeInMinutes,
            )
          : translate('Error.SendingPayments');

        setFormSubmissionErrorMsg(errorMsg);
        setPayoutDialogueStage(PayoutDialogueStage.Input);
      } finally {
        setIsSaving(false);
        await fetchGroupFunds();
      }
    },
    [
      organization.groupId,
      organization.id,
      queryClient,
      showTopMessageV2,
      translate,
      unifiedLogger,
      handleClose,
      fetchGroupFunds,
    ],
  );

  const nextAction = useCallback(() => {
    if (payoutDialogueStage === PayoutDialogueStage.Input) {
      clearCsvMessages();
      setPayoutDialogueStage(PayoutDialogueStage.Confirm);
    }
    if (payoutDialogueStage === PayoutDialogueStage.Confirm) {
      if (settings?.enableFirstPayoutWarning && firstTimePayouts.length > 0) {
        setPayoutDialogueStage(PayoutDialogueStage.FirstPayoutWarning);
        return;
      }
      handleFormSubmit(getValues());
    }
    if (payoutDialogueStage === PayoutDialogueStage.FirstPayoutWarning) {
      handleFormSubmit(getValues());
    }
  }, [
    payoutDialogueStage,
    handleFormSubmit,
    getValues,
    clearCsvMessages,
    settings?.enableFirstPayoutWarning,
    firstTimePayouts,
  ]);

  const isNextDisabled = useCallback(() => {
    if (payoutDialogueStage === PayoutDialogueStage.Input) {
      const isPayoutsValid =
        validateTotalGroupPayoutSum(payouts, groupFunds) &&
        validateAllPayoutsNonZero(payouts) &&
        payouts.length > 0;
      return isCsvUploading || isValidating || !isPayoutsValid;
    }

    if (payoutDialogueStage === PayoutDialogueStage.Confirm) {
      return isSaving || isSubmitting || isCheckingFirstTimePayouts;
    }

    if (payoutDialogueStage === PayoutDialogueStage.FirstPayoutWarning) {
      return isSaving || isSubmitting;
    }

    return true;
  }, [
    payoutDialogueStage,
    isCsvUploading,
    isValidating,
    isSaving,
    isSubmitting,
    isCheckingFirstTimePayouts,
    payouts,
    groupFunds,
  ]);

  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        PaperProps={{ sx: { maxHeight: `min(${MaxDialogueHeightPx}px, 90vh)` } }}>
        <input
          ref={fileInputRef}
          type='file'
          accept='.csv'
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        {payoutDialogueStage === PayoutDialogueStage.Input && (
          <InputDialogContent
            payouts={payouts}
            groupId={organization.groupId}
            organizationId={organization.id}
            groupFunds={groupFunds}
            csvErrors={csvErrors}
            csvWarnings={csvWarnings}
            formSubmissionErrorMsg={isDirty ? undefined : formSubmissionErrorMsg}
            onUserSelect={handleUserSelect}
            onPayoutRemove={handlePayoutRemove}
            onPayoutAmountChange={handlePayoutAmountChange}
          />
        )}
        {payoutDialogueStage === PayoutDialogueStage.Confirm && (
          <ReviewDialogContent payouts={payouts} currentGroup={currentGroup} />
        )}
        {payoutDialogueStage === PayoutDialogueStage.FirstPayoutWarning && (
          <FirstPayoutWarningDialogContent firstTimePayouts={firstTimePayouts} />
        )}

        <DialogActions>
          <Grid container spacing={1}>
            <Grid item XSmall={6}>
              <Button
                onClick={nextAction}
                color='primaryBrand'
                variant='contained'
                fullWidth
                disabled={isNextDisabled()}
                loading={isSubmitting || isSaving}
                className={dialogActionButton}>
                {payoutDialogueStage === PayoutDialogueStage.Input &&
                  translate('Action.ContinueToReview')}
                {payoutDialogueStage === PayoutDialogueStage.Confirm &&
                  translate('Action.ConfirmAndSend')}
                {payoutDialogueStage === PayoutDialogueStage.FirstPayoutWarning &&
                  translate('Action.ConfirmAndSend')}
              </Button>
            </Grid>
            <Grid item XSmall={6}>
              {payoutDialogueStage === PayoutDialogueStage.Input ? (
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
                      loading={isCsvUploading}
                      className={dialogActionButton}>
                      {translate('Action.UploadFileType', {
                        fileType: '.csv',
                      })}
                    </Button>
                  </div>
                </Tooltip>
              ) : (
                <Button
                  onClick={() => {
                    setPayoutDialogueStage(PayoutDialogueStage.Input);
                  }}
                  variant='contained'
                  color='secondary'
                  fullWidth
                  disabled={isSubmitting}
                  className={dialogActionButton}>
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

export default OneTimePayoutDialogueV2;
