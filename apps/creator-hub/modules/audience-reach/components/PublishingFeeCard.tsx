import { useMemo, useState, type FC } from 'react';
import type { AllowlistTypeEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import {
  Alert,
  Button,
  Icon,
  Skeleton,
  Snackbar,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { PublishingFee, PublishingPermissionsRoute } from '../constants/audienceReachConstants';
import { usePublishingFeeStatus } from '../hooks/usePublishingFeeStatus';
import type { ReachLevel } from '../types/audienceReach';
import AudienceReachExpediteUpsellBanner from './AudienceReachExpediteUpsellBanner';
import TransactionDepositDialog from './TransactionDepositDialog';

interface PublishingFeeCardProps {
  isCreator: boolean;
  isBelowThreshold: boolean;
  audienceReach: ReachLevel;
  isAccountAllAgesTier: boolean;
  activeAllowlists?: AllowlistTypeEnum[] | null;
}

const PublishingFeeCard: FC<PublishingFeeCardProps> = ({
  isCreator,
  isBelowThreshold,
  audienceReach,
  isAccountAllAgesTier,
  activeAllowlists,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;
  const isGroupOwned = gameDetails?.creator?.type === CreatorType.Group;
  const groupId = isGroupOwned ? (gameDetails?.creator?.id ?? undefined) : undefined;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const {
    hasPublishingFeeDeposit,
    hasExpeditedDeposit,
    canView,
    canPay,
    isExempt,
    shouldShowExpediteUpsell,
    shouldShowPublishingFeeUpsell,
    isLoading,
    error,
  } = usePublishingFeeStatus({
    universeId,
    isGroupOwned,
    isCreator,
    creatorId: gameDetails?.creator?.id,
    isBelowThreshold,
    audienceReach,
    activeAllowlists,
  });

  // Non-owners cannot use their own funds to pay the publishing fee
  const forceGroupFunds = canPay && !isCreator;

  const [feeStatusText, feeDescriptionText, ctaButton] = useMemo(() => {
    if (isLoading) {
      return [
        <Skeleton
          key='label'
          variant='Text'
          height={16}
          width='12em'
          data-testid='payment-loading-skeleton'
        />,
        <Skeleton key='description' variant='Text' height={14} width='28em' />,
        null,
      ];
    }
    if (error) {
      return [
        <span key='label' className='flex items-center gap-small'>
          <Icon name='icon-regular-triangle-exclamation' className='content-action-alert' />
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.FailedToLoadPayment')}
        </span>,
        translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.FailedToLoadPaymentStatus',
        ),
        null,
      ];
    }
    // Variant 1: The user does not have permission to view the publishing fee status
    if (!canView) {
      return [
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.NotAvailable'),
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Description.DepositOwnerOnly'),
        null,
      ];
    }
    // Variant 2: The game has already had a deposit paid. No action is needed.
    if (hasPublishingFeeDeposit) {
      return [
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Paid'),
        translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.PublishingFeeReturnV2',
        ),
        null,
      ];
    }
    if (isExempt) {
      // Variant 3: The user has an active subscription that exempts them from the deposit, they have
      // already paid the expedited review fee, or the universe is on a fee-bypass allowlist. No
      // action is needed.
      return [
        translateWithNamespace(TranslationNamespace.AudienceReach, 'Label.Exempt'),
        hasExpeditedDeposit
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
        isDisabled={hasPublishingFeeDeposit || !canPay}
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
    ];
  }, [
    isLoading,
    error,
    canPay,
    canView,
    hasPublishingFeeDeposit,
    isExempt,
    translateWithNamespace,
    hasExpeditedDeposit,
  ]);

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
          isAccountAllAgesTier={isAccountAllAgesTier}
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
              {
                number: PublishingFee.toString(),
              },
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
