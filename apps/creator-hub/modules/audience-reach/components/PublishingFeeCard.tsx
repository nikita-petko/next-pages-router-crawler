import { useMemo, useState, type FC } from 'react';
import { AllowlistTypeEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { StatusCodes } from '@rbx/core';
import { Alert, Button, Snackbar, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Skeleton } from '@rbx/ui';
import { getResponseFromError } from '@modules/clients/utils';
import useUniversePublishStatus from '@modules/creations-overview/hooks/useUniversePublishStatus';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import { useGetOrganizationPermissionsByGroupId } from '@modules/react-query/organizations/organizationsQueries';
import { PublishingFee, PublishingPermissionsRoute } from '../constants/audienceReachConstants';
import { useCoreContentTransactionStatus } from '../hooks/useCoreContentTransactionStatus';
import { ReachLevel } from '../types/audienceReach';
import AudienceReachExpediteUpsellBanner from './AudienceReachExpediteUpsellBanner';
import TransactionDepositDialog from './TransactionDepositDialog';

interface PublishingFeeCardProps {
  isCreator: boolean;
  isBelowThreshold: boolean;
  creatorId?: number;
  isEligibilityContextReady?: boolean;
  audienceReach: ReachLevel;
  isRated: boolean;
  is16Plus: boolean;
  isAccountAllAgesTier: boolean;
  activeAllowlists?: AllowlistTypeEnum[] | null;
}

const PublishingFeeCard: FC<PublishingFeeCardProps> = ({
  isCreator,
  isBelowThreshold,
  creatorId,
  audienceReach,
  isEligibilityContextReady = true,
  isRated,
  is16Plus,
  isAccountAllAgesTier,
  activeAllowlists,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;
  const groupId =
    gameDetails?.creator?.type === CreatorType.Group
      ? (gameDetails.creator.id ?? undefined)
      : undefined;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const { isPublished, isLoading: isUniversePublishStatusLoading } =
    useUniversePublishStatus(universeId);
  const {
    data: publishingFeeTransactionStatus,
    isLoading: isPublishingFeeTransactionStatusLoading,
    error: publishingFeeError,
  } = useCoreContentTransactionStatus(universeId, TransactionVariantEnum.PublishFee);
  const {
    data: expeditedTransactionStatus,
    isLoading: isExpeditedTransactionStatusLoading,
    error: expeditedFeeError,
  } = useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);

  const canSubmitPublishingFee = !publishingFeeTransactionStatus?.hasDeposit;
  const { data: creatorEligibilityResponse, isLoading: isCreatorEligibilityLoading } =
    useCreatorEligibility({
      overrideUserId: creatorId,
      isReady: isEligibilityContextReady,
    });
  const { data: groupPermissions, isLoading: isGroupPermissionsLoading } =
    useGetOrganizationPermissionsByGroupId(groupId);

  const canConfigureGroupRevenue =
    Boolean(groupId) &&
    (groupPermissions?.isOwner === true || groupPermissions?.canConfigureRevenueDetails === true);
  // Non-owner group revenue managers may pay, but only from group funds.
  const canPay = isCreator || canConfigureGroupRevenue;
  const canView = !(
    getResponseFromError(publishingFeeError)?.status === StatusCodes.FORBIDDEN ||
    getResponseFromError(expeditedFeeError)?.status === StatusCodes.FORBIDDEN
  );
  const forceGroupFunds = !isCreator && canConfigureGroupRevenue;

  const exemptDueToActiveSubscription =
    !creatorEligibilityResponse?.everyoneTierWithoutSubscription &&
    creatorEligibilityResponse?.creatorTier === CreatorTierEnum.Everyone;

  const isAllowlistedExempt =
    Boolean(activeAllowlists?.includes(AllowlistTypeEnum.UniverseBypass)) ||
    Boolean(activeAllowlists?.includes(AllowlistTypeEnum.TemporaryExpeditedFeeBypass));

  const shouldShowExpediteUpsell =
    // Eligible to pay expedited fee:
    (isBelowThreshold && // Creators above threshold can just pay the normal fee
      !isAllowlistedExempt &&
      canPay &&
      audienceReach !== ReachLevel.AllAges &&
      !(isRated && is16Plus)) ||
    // Or already paid fee
    expeditedTransactionStatus?.hasDeposit;

  const [feeStatusText, feeDescriptionText, ctaButton, shouldShowPublishingFeeUpsell] =
    useMemo(() => {
      // Variant 1: The user does not have permission to view the publishing fee status
      if (!canView) {
        return [
          translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.NotAvailable'),
          translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Description.DepositOwnerOnly',
          ),
          null,
          false,
        ];
      }
      // Variant 2: The game has already had a deposit paid. No action is needed.
      if (publishingFeeTransactionStatus?.hasDeposit) {
        return [
          translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Paid'),
          translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Description.PublishingFeeReturnV2',
          ),
          null,
          false,
        ];
      }
      if (
        exemptDueToActiveSubscription ||
        expeditedTransactionStatus?.hasDeposit ||
        isAllowlistedExempt
      ) {
        // Variant 3: The user has an active subscription that exempts them from the deposit, they
        // have already paid the expedited review fee, or the universe is on a fee-bypass allowlist.
        // No action is needed.
        return [
          translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Exempt'),
          expeditedTransactionStatus?.hasDeposit
            ? translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Description.NoPaymentWithExpedited',
              )
            : translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Description.PublishingFeeNotApplicable',
              ),
          <Button
            as='a'
            key='cta'
            href={PublishingPermissionsRoute}
            variant='Standard'
            size='Small'
            className='width-2100'>
            {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.ViewDetails')}
          </Button>,
          false,
        ];
      }
      // Variant 4: There is no deposit for this game and the user has the permission level to
      // pay for it. Pay always uses Emphasis; the upsell banner is still gated on being
      // published and above the engagement threshold.
      const paymentButton = (
        <Button
          key='cta'
          variant='Emphasis'
          size='Small'
          onClick={() => setIsDialogOpen(true)}
          isDisabled={!canSubmitPublishingFee || !canPay}
          className='width-2100'>
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Pay')}
        </Button>
      );
      // Tooltip is only for the insufficient permissions case, already having a payment is covered elsewhere in
      // the copy.
      const disabledPaymentButtonWithTooltip = (
        <Tooltip
          position='top-center'
          title={translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Label.InsufficientPermission',
          )}
          description={translateWithNamespace(
            TranslationNamespace.AudienceReach,
            'Tooltip.InsufficientPermissionsPublishingFee',
          )}>
          <TooltipTrigger asChild>{paymentButton}</TooltipTrigger>
        </Tooltip>
      );
      return [
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.NotSubmitted'),
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Description.PublishingFee'),
        canPay ? paymentButton : disabledPaymentButtonWithTooltip,
        canPay && !isBelowThreshold && isPublished,
      ];
    }, [
      canPay,
      canView,
      publishingFeeTransactionStatus,
      exemptDueToActiveSubscription,
      isAllowlistedExempt,
      translateWithNamespace,
      isBelowThreshold,
      canSubmitPublishingFee,
      isPublished,
      expeditedTransactionStatus,
    ]);

  if (
    isPublishingFeeTransactionStatusLoading ||
    isExpeditedTransactionStatusLoading ||
    isUniversePublishStatusLoading ||
    isCreatorEligibilityLoading ||
    (Boolean(groupId) && isGroupPermissionsLoading) ||
    !isEligibilityContextReady
  ) {
    return (
      // I don't think this component is in foundation yet
      <Skeleton className='flex flex-col gap-xlarge padding-large radius-medium stroke-standard stroke-emphasis height-3000' />
    );
  }

  const paymentModalBody = (
    <p className='text-body-medium margin-none'>
      {translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Description.PublishingFeeDialogV2',
      )}
    </p>
  );

  // Note: there is a known edge case where an otherwise select eligible, at private game will see the expedite upsell
  // because we do not know their actual eligibility status. Fixing this is blocked without additional backend changes
  return (
    <div className='flex flex-col gap-xlarge padding-large radius-medium stroke-standard stroke-emphasis'>
      {shouldShowExpediteUpsell && (
        <AudienceReachExpediteUpsellBanner
          universeId={universeId}
          isRated={isRated}
          isAccountAllAgesTier={isAccountAllAgesTier}
          expeditedTransactionStatus={expeditedTransactionStatus ?? null}
          openSuccessSnackbar={setSnackbarMessage}
          groupId={groupId}
          forceGroupFunds={forceGroupFunds}
        />
      )}
      {shouldShowPublishingFeeUpsell && (
        <Alert variant='Feedback' severity='Warning' hasCloseAffordance={false}>
          <div className='flex min-width-0 items-center gap-xsmall'>
            <span className='text-label-medium'>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Heading.ExpandYourReach',
              )}
            </span>
            {translateWithNamespace(
              TranslationNamespace.PublicPublish,
              'Description.ExpandYourReach',
              { number: PublishingFee.toString() },
            )}
          </div>
        </Alert>
      )}
      <div>
        <div className='flex items-center'>
          <div className='flex flex-col gap-xsmall grow-1 shrink-1'>
            <span className='text-body-medium content-system-neutral'>
              {translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Label.RefundablePublishingFee',
              )}
            </span>
            <span className='text-title-large'>
              <span>{feeStatusText}</span>
            </span>
          </div>
          <div className='grow-0 shrink-0'>{ctaButton}</div>
        </div>
        <div className='grow-0 shrink-0 width-full content-system-neutral'>
          <p className='text-body-medium margin-none padding-top-small'>{feeDescriptionText}</p>
        </div>
      </div>
      <TransactionDepositDialog
        universeId={universeId}
        variant={TransactionVariantEnum.PublishFee}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        openSuccessSnackbar={setSnackbarMessage}
        modalHeading={translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Label.RefundablePublishingFee',
        )}
        modalBody={paymentModalBody}
        fee={PublishingFee}
        groupId={groupId}
        forceGroupFunds={forceGroupFunds}
      />
      {snackbarMessage !== null ? (
        <Snackbar
          title={snackbarMessage}
          autoDismissDurationMs={3000}
          shouldAutoDismiss
          onClose={() => setSnackbarMessage(null)}
        />
      ) : null}
    </div>
  );
};

export default PublishingFeeCard;
