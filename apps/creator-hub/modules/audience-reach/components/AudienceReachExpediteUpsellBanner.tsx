import { useState, type FC } from 'react';
import type { UniverseTransactionStatusResponse } from '@rbx/client-core-content-transaction-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { Alert } from '@rbx/foundation-ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ExpeditedReviewFee,
  RefundPeriodDays,
  RefundPeriodMs,
  SelectReviewDocsLink,
} from '../constants/audienceReachConstants';
import ExpeditedIneligibleDialog from './ExpeditedIneligibleDialog';
import TransactionDepositDialog from './TransactionDepositDialog';
import TransactionRefundDialog from './TransactionRefundDialog';

interface AudienceReachExpediteUpsellBannerProps {
  universeId: number;
  isRated: boolean;
  isAccountAllAgesTier: boolean;
  expeditedTransactionStatus: UniverseTransactionStatusResponse | null;
  openSuccessSnackbar?: (message: string) => void;
  groupId?: number;
}

const AudienceReachExpediteUpsellBanner: FC<AudienceReachExpediteUpsellBannerProps> = ({
  universeId,
  isRated,
  expeditedTransactionStatus,
  isAccountAllAgesTier,
  openSuccessSnackbar,
  groupId,
}) => {
  const { locale } = useLocalization();
  const { translateWithNamespace } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');

  // Transaction status isn't done loading, so don't show a banner.
  if (!expeditedTransactionStatus) {
    return null;
  }

  const refundEligibleTime = expeditedTransactionStatus.createdTime
    ? new Date(Number(expeditedTransactionStatus.createdTime.seconds) * 1000 + RefundPeriodMs)
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
      { number: numberFormatter.format(ExpeditedReviewFee) },
    );
  }

  const expeditedDialogBody = (
    <>
      <p className='text-body-medium margin-none'>
        {translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ExpeditedReviewModal1',
          { number: RefundPeriodDays.toString() },
        )}
      </p>
      <p className='text-body-medium margin-none'>
        {translateWithNamespace(
          TranslationNamespace.AudienceReach,
          'Description.ExpeditedReviewModal2',
          { number: RefundPeriodDays.toString() },
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
        fee={ExpeditedReviewFee}
        groupId={groupId}
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
