import { useState, type FC } from 'react';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { Alert } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SelectReviewDocsLink } from '../constants/audienceReachConstants';
import { useContentRatingDetails } from '../hooks/useContentRatingDetails';
import { useCoreContentTransactionMetadata } from '../hooks/useCoreContentTransactionMetadata';
import { useCoreContentTransactionStatus } from '../hooks/useCoreContentTransactionStatus';
import ExpeditedIneligibleDialog from './ExpeditedIneligibleDialog';
import TransactionDepositDialog from './TransactionDepositDialog';
import TransactionRefundDialog from './TransactionRefundDialog';

const MillisPerDay = 24 * 60 * 60 * 1000;

interface AudienceReachExpediteUpsellBannerProps {
  universeId: number;
  isAccountAllAgesTier: boolean;
  openSuccessSnackbar?: (message: string) => void;
  groupId?: number;
  forceGroupFunds?: boolean;
}

const AudienceReachExpediteUpsellBanner: FC<AudienceReachExpediteUpsellBannerProps> = ({
  universeId,
  isAccountAllAgesTier,
  openSuccessSnackbar,
  groupId,
  forceGroupFunds = false,
}) => {
  const { locale } = useLocalization();
  const { translateWithNamespace } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');
  const { data: contentRating } = useContentRatingDetails(universeId);
  const { data: metadata, isLoading: isMetadataLoading } = useCoreContentTransactionMetadata();
  const { data: expeditedTransactionStatus } = useCoreContentTransactionStatus(
    universeId,
    TransactionVariantEnum.Expedited,
  );
  const isRated = !contentRating?.isUnrated;

  // Transaction status isn't done loading, so don't show a banner.
  if (!expeditedTransactionStatus || !metadata || isMetadataLoading) {
    return null;
  }

  const { expeditedReviewFee, expeditedReviewFeeRefundPeriodDays } = metadata;

  const refundEligibleTime = expeditedTransactionStatus.createdTime
    ? new Date(
        Number(expeditedTransactionStatus.createdTime.seconds) * 1000 +
          expeditedReviewFeeRefundPeriodDays * MillisPerDay,
      )
    : null;
  const refundIsAvailable = Boolean(refundEligibleTime && refundEligibleTime < new Date());

  let bannerDescription;
  if (expeditedTransactionStatus.hasDeposit && refundEligibleTime) {
    if (!refundIsAvailable) {
      bannerDescription = translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Description.RefundAvailableOnDate',
        {
          date: refundEligibleTime.toLocaleString(locale ?? 'en-us', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          }),
        },
      );
    } else {
      bannerDescription = translateWithNamespace(
        TranslationNamespace.AudienceReach,
        'Description.RefundAvailable',
      );
    }
  } else {
    bannerDescription = translateWithNamespace(
      TranslationNamespace.AudienceReach,
      'Description.ExpeditedReviewBanner',
      { number: numberFormatter.format(expeditedReviewFee) },
    );
  }

  const expeditedDialogBody = (
    <>
      <p className='text-body-medium margin-none'>
        {translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ExpeditedReviewModal1',
          { number: expeditedReviewFeeRefundPeriodDays.toString() },
        )}
      </p>
      <p className='text-body-medium margin-none'>
        {translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ExpeditedReviewModal2',
          { number: expeditedReviewFeeRefundPeriodDays.toString() },
        )}
      </p>
    </>
  );

  let ctaDialog;
  if (expeditedTransactionStatus.hasDeposit) {
    ctaDialog = (
      <TransactionRefundDialog
        universeId={universeId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        openSuccessSnackbar={openSuccessSnackbar}
      />
    );
  } else if (isRated && isAccountAllAgesTier) {
    ctaDialog = (
      <TransactionDepositDialog
        universeId={universeId}
        variant={TransactionVariantEnum.Expedited}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        openSuccessSnackbar={openSuccessSnackbar}
        modalHeading={translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Heading.ExpeditedReviewModal',
        )}
        modalBody={expeditedDialogBody}
        fee={expeditedReviewFee}
        groupId={groupId}
        forceGroupFunds={forceGroupFunds}
      />
    );
  } else {
    ctaDialog = (
      <ExpeditedIneligibleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        universeId={universeId}
        isRated={isRated}
        isAccountAllAgesTier={isAccountAllAgesTier}
      />
    );
  }

  return (
    <>
      <Alert
        variant='Feedback'
        severity='Info'
        hasCloseAffordance={false}
        primaryActionLabel={
          expeditedTransactionStatus.hasDeposit
            ? refundIsAvailable
              ? translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.RequestRefund')
              : undefined
            : translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Pay')
        }
        onPrimaryAction={
          expeditedTransactionStatus.hasDeposit
            ? refundIsAvailable
              ? () => setIsDialogOpen(true)
              : undefined
            : () => setIsDialogOpen(true)
        }
        secondaryActionLabel={
          expeditedTransactionStatus.hasDeposit
            ? undefined
            : translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.ViewDetails')
        }
        secondaryActionHref={
          expeditedTransactionStatus.hasDeposit ? undefined : SelectReviewDocsLink
        }>
        <div className='flex min-width-0 items-center gap-xsmall'>
          <span className='text-label-medium'>
            {expeditedTransactionStatus.hasDeposit
              ? translateWithNamespace(
                  TranslationNamespace.AudienceReach,
                  'Heading.EnrolledForExpeditedReview',
                )
              : translateWithNamespace(
                  TranslationNamespace.AudienceReach,
                  'Heading.ExpeditedReviewBanner',
                )}
          </span>
          <span>{bannerDescription}</span>
        </div>
      </Alert>
      {ctaDialog}
    </>
  );
};

export default AudienceReachExpediteUpsellBanner;
