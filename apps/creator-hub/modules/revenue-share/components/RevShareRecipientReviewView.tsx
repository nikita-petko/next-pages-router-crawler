// Presents recipient pending-proposal review with the shared diff table and Back and Accept actions before terms.
import { useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';
import { translateRevShareRecipientSettledStatusBanner } from '../utils/revShareRecipientProposalStatusPresentation';
import RevShareBanner from './RevShareBanner';
import RevShareReviewShell from './RevShareReviewShell';
import type { RevShareDiffRowData } from './tables/RevShareDiffTable';

export type RevShareRecipientReviewViewProps = {
  rows: readonly RevShareDiffRowData[];
  confirmation: RevShareConfirmationStatus;
  canRespond: boolean;
  isSubmitting?: boolean;
  hasError?: boolean;
  onBack: () => void;
  onAccept: () => void;
};

const RevShareRecipientReviewView: FunctionComponent<RevShareRecipientReviewViewProps> = ({
  rows,
  confirmation,
  canRespond,
  isSubmitting = false,
  hasError = false,
  onBack,
  onAccept,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const isPending = confirmation === RevShareConfirmationStatus.Pending;
  useEffect(() => {
    if (hasError) {
      errorBannerRef.current?.focus();
    }
  }, [hasError]);
  const backLabel = tPendingTranslation(
    'Back',
    'Label on a button that returns to the previous step in a multi-step wizard.',
    translationKey('Action.Back', TranslationNamespace.Controls),
  );
  const acceptLabel = tPendingTranslation(
    'Accept',
    'Button label for continuing to accept a recipient revenue-share proposal.',
    translationKey('Action.Accept', TranslationNamespace.RevenueShareAgreements),
  );
  const footer = useMemo(() => {
    if (isPending && canRespond) {
      return (
        <div className='flex justify-end gap-medium'>
          <Button
            type='button'
            variant='Standard'
            size='Medium'
            isDisabled={isSubmitting}
            onClick={onBack}>
            {backLabel}
          </Button>
          <Button
            type='button'
            variant='Emphasis'
            size='Medium'
            isDisabled={isSubmitting}
            onClick={onAccept}>
            {acceptLabel}
          </Button>
        </div>
      );
    }
    return (
      <div className='flex justify-end'>
        <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    );
  }, [acceptLabel, backLabel, canRespond, isPending, isSubmitting, onAccept, onBack]);
  const banner = useMemo(() => {
    if (hasError) {
      return (
        <RevShareBanner
          ref={errorBannerRef}
          tabIndex={-1}
          tone='alert'
          message={tPendingTranslation(
            'We could not update this proposal. Refresh and try again.',
            'Generic error shown when accepting a recipient revenue-share proposal fails.',
            translationKey(
              'Message.RecipientResponseFailed',
              TranslationNamespace.RevenueShareAgreements,
            ),
          )}
        />
      );
    }
    const settledBanner = translateRevShareRecipientSettledStatusBanner(
      confirmation,
      tPendingTranslation,
    );
    if (settledBanner !== null) {
      return <RevShareBanner tone={settledBanner.tone} message={settledBanner.message} />;
    }
    return (
      <RevShareBanner
        tone={canRespond ? 'warning' : 'emphasis'}
        message={
          canRespond
            ? tPendingTranslation(
                'Review the proposed split, then accept it or go back for now.',
                'Instructions for a recipient reviewing a revenue-share proposal.',
                translationKey(
                  'Message.ReviewRecipientProposal',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )
            : tPendingTranslation(
                'You can view this proposal, but you do not have permission to accept it.',
                'Read-only notice for a recipient without permission to respond.',
                translationKey(
                  'Message.RecipientProposalReadOnly',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )
        }
      />
    );
  }, [canRespond, confirmation, hasError, tPendingTranslation]);

  return <RevShareReviewShell banner={banner} rows={rows} footer={footer} />;
};

export default RevShareRecipientReviewView;
