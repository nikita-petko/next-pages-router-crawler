import { useState, type FC } from 'react';
import type { UniverseTransactionStatusResponse } from '@rbx/client-core-content-transaction-api/v1';
import { TransactionVariantEnum } from '@rbx/client-core-content-transaction-api/v1';
import { Button, FeedbackBanner } from '@rbx/foundation-ui';
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
}

const AudienceReachExpediteUpsellBanner: FC<AudienceReachExpediteUpsellBannerProps> = ({
  universeId,
  isRated,
  expeditedTransactionStatus,
  isAccountAllAgesTier,
  openSuccessSnackbar,
}) => {
  const { locale } = useLocalization();
  const { translateWithNamespace } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const numberFormatter = new Intl.NumberFormat(locale ?? 'en-us');

  // Transaction status isn't done loading, so don't show a banner.
  if (!expeditedTransactionStatus) {
    return null;
  }

  const buttonContainer = (
    // The size prop on button has priority over padding-x-small, which is why I
    // have the inner divs.  Pay in particular looks off without it since it's
    // so short
    <div className='flex flex-row gap-small'>
      <Button size='Small' variant='Standard' onClick={() => setIsDialogOpen(true)}>
        <div className='padding-x-small'>
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.Pay')}
        </div>
      </Button>
      <Button as='a' href={SelectReviewDocsLink} size='Small' variant='Utility'>
        <div className='padding-x-small'>
          {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.ViewDetails')}
        </div>
      </Button>
    </div>
  );

  const refundEligibleTime = expeditedTransactionStatus.createdTime
    ? new Date(Number(expeditedTransactionStatus.createdTime.seconds) * 1000 + RefundPeriodMs)
    : null;
  const refundIsAvailable = refundEligibleTime && refundEligibleTime < new Date();

  const requestRefundButton = (
    <Button
      size='Small'
      variant='Standard'
      onClick={() => setIsDialogOpen(true)}
      isDisabled={!refundIsAvailable}>
      {translateWithNamespace(TranslationNamespace.AudienceReach, 'Action.RequestRefund')}
    </Button>
  );

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
      <FeedbackBanner
        title={
          expeditedTransactionStatus.hasDeposit
            ? translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Heading.EnrolledForExpeditedReview',
              )
            : translateWithNamespace(
                TranslationNamespace.AudienceReach,
                'Heading.ExpeditedReviewBanner',
              )
        }
        description={bannerDescription}
        layout='Inline'
        variant='Emphasis'
        severity='Info'
        actions={expeditedTransactionStatus.hasDeposit ? requestRefundButton : buttonContainer}
      />
      {ctaDialog}
    </>
  );
};

export default AudienceReachExpediteUpsellBanner;
