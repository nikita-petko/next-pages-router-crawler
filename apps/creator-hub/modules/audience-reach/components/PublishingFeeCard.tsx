import { useMemo, useState, type FC } from 'react';
import { CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { useFlag } from '@rbx/flags';
import { Alert, Button, Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Skeleton } from '@rbx/ui';
import { enableExpeditedReview } from '@generated/flags/creatorGameops';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useUniversePublishStatus from '@modules/creations-overview/hooks/useUniversePublishStatus';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useCreatorEligibility } from '@modules/publishing-permissions/hooks/useCreatorEligibility';
import { useGetOrganizationPermissionsByGroupId } from '@modules/react-query/organizations/organizationsQueries';
import {
  PublishingFee,
  PublishingPermissionsRoute,
  RefundPeriodDays,
  RequiredEngagedPlayers,
} from '../constants/audienceReachConstants';
import { useCoreContentTransactionStatus } from '../hooks/useCoreContentTransactionStatus';
import { ReachLevel } from '../types/audienceReach';
import AudienceReachExpediteUpsellBanner from './AudienceReachExpediteUpsellBanner';
import TransactionDepositDialog from './TransactionDepositDialog';

interface PublishingFeeCardProps {
  isCreator: boolean;
  isBelowThreshold: boolean;
  creatorEligibilityOverrideUserId?: number;
  isEligibilityContextReady?: boolean;
  audienceReach: ReachLevel;
  isRated: boolean;
  is16Plus: boolean;
  isAccountAllAgesTier: boolean;
}

const PublishingFeeCard: FC<PublishingFeeCardProps> = ({
  isCreator,
  isBelowThreshold,
  creatorEligibilityOverrideUserId,
  audienceReach,
  isEligibilityContextReady = true,
  isRated,
  is16Plus,
  isAccountAllAgesTier,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { translate } = useTranslationWrapper(useTranslation());
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
  } = useCoreContentTransactionStatus(universeId, TransactionVariantEnum.PublishFee);
  const { data: expeditedTransactionStatus, isLoading: isExpeditedTransactionStatusLoading } =
    useCoreContentTransactionStatus(universeId, TransactionVariantEnum.Expedited);
  const canSubmitPublishingFee = !publishingFeeTransactionStatus?.hasDeposit;
  const { data: creatorEligibilityResponse, isLoading: isCreatorEligibilityLoading } =
    useCreatorEligibility({
      overrideUserId: creatorEligibilityOverrideUserId,
      isReady: isEligibilityContextReady,
    });
  const { data: groupPermissions, isLoading: isGroupPermissionsLoading } =
    useGetOrganizationPermissionsByGroupId(groupId);
  const { value: isExpeditedReviewEnabled } = useFlag(enableExpeditedReview);

  const canConfigureGroupRevenue =
    Boolean(groupId) &&
    (groupPermissions?.isOwner === true || groupPermissions?.canConfigureRevenueDetails === true);
  // Non-owner group revenue managers may pay, but only from group funds.
  const canPay = isCreator || canConfigureGroupRevenue;
  const forceGroupFunds = !isCreator && canConfigureGroupRevenue;

  const exemptDueToActiveSubscription =
    !creatorEligibilityResponse?.everyoneTierWithoutSubscription &&
    creatorEligibilityResponse?.creatorTier === CreatorTierEnum.Everyone;

  const shouldShowExpediteUpsell =
    isExpeditedReviewEnabled &&
    // Eligible to pay expedited fee:
    ((isBelowThreshold && // Creators above threshold can just pay the normal fee
      canPay &&
      audienceReach !== ReachLevel.AllAges &&
      !(isRated && is16Plus)) ||
      // Or already paid fee
      expeditedTransactionStatus?.hasDeposit);

  const [feeStatusText, feeDescriptionText, ctaButton, shouldShowPublishingFeeUpsell] =
    useMemo(() => {
      // Variant 1: The user cannot pay (not creator and no group-revenue
      // permission). They have no visibility and cannot take action
      if (!canPay) {
        return [
          translate(translationKey('Label.NotAvailable', TranslationNamespace.AudienceReach)),
          translate(
            translationKey('Description.DepositOwnerOnly', TranslationNamespace.AudienceReach),
          ),
          null,
          false,
        ];
      }
      // Variant 2: The game has already had a deposit paid. No action is needed.
      if (publishingFeeTransactionStatus?.hasDeposit) {
        return [
          translate(translationKey('Label.Paid', TranslationNamespace.AudienceReach)),
          translate(
            translationKey('Description.PublishingFeeReturnV2', TranslationNamespace.AudienceReach),
            {
              days: RefundPeriodDays.toString(),
              players: RequiredEngagedPlayers.toString(),
            },
          ),
          null,
          false,
        ];
      }
      if (exemptDueToActiveSubscription || expeditedTransactionStatus?.hasDeposit) {
        // Variant 3: The user has an active subscription that exempts them from the deposit, or they have
        // already paid the expedited review fee. No action is needed.
        return [
          translate(translationKey('Label.Exempt', TranslationNamespace.AudienceReach)),
          expeditedTransactionStatus?.hasDeposit
            ? translate(
                translationKey(
                  'Description.NoPaymentWithExpedited',
                  TranslationNamespace.AudienceReach,
                ),
              )
            : translate(
                translationKey(
                  'Description.PublishingFeeNotApplicable',
                  TranslationNamespace.AudienceReach,
                ),
              ),
          <Button
            as='a'
            key='cta'
            href={PublishingPermissionsRoute}
            variant='Standard'
            size='Small'
            className='width-2100'>
            {translate(translationKey('Action.ViewDetails', TranslationNamespace.AudienceReach))}
          </Button>,
          false,
        ];
      }
      // Variant 4: There is no deposit for this game and the user has the permission level to
      // pay for it.
      // If the game is Public and above the engagement threshold, we add greater emphasis with
      // the button styling and the addition of a banner
      return [
        translate(translationKey('Label.NotSubmitted', TranslationNamespace.AudienceReach)),
        translate(translationKey('Description.PublishingFee', TranslationNamespace.AudienceReach)),
        <Button
          key='cta'
          variant={!isBelowThreshold && isPublished ? 'Emphasis' : 'Standard'}
          size='Small'
          onClick={() => setIsDialogOpen(true)}
          isDisabled={!canSubmitPublishingFee}
          className='width-2100'>
          {translate(translationKey('Action.Pay', TranslationNamespace.PublicPublish))}
        </Button>,
        !isBelowThreshold && isPublished,
      ];
    }, [
      canPay,
      publishingFeeTransactionStatus,
      exemptDueToActiveSubscription,
      translate,
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
      {translate(
        translationKey('Description.PublishingFeeDialogV2', TranslationNamespace.AudienceReach),
        {
          days: RefundPeriodDays.toString(),
          players: RequiredEngagedPlayers.toString(),
        },
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
              {translate(
                translationKey('Heading.ExpandYourReach', TranslationNamespace.PublicPublish),
              )}
            </span>
            {translate(
              translationKey('Description.ExpandYourReach', TranslationNamespace.PublicPublish),
              { number: PublishingFee.toString() },
            )}
          </div>
        </Alert>
      )}
      <div>
        <div className='flex items-center'>
          <div className='flex flex-col gap-xsmall grow-1 shrink-1'>
            <span className='text-body-medium content-system-neutral'>
              {translate(
                translationKey('Label.RefundablePublishingFee', TranslationNamespace.AudienceReach),
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
