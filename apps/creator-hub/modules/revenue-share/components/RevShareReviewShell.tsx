// Renders shared review layout with optional chrome, pending-acceptance banner, split diff table, and footer actions.
import type { FunctionComponent, ReactNode } from 'react';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';
import RevShareBanner from './RevShareBanner';
import RevShareDiffTable, { type RevShareDiffRowData } from './tables/RevShareDiffTable';

type RevShareReviewShellProps = {
  chrome?: ReactNode;
  heading?: string;
  description?: string;
  rows: readonly RevShareDiffRowData[];
  banner?: ReactNode;
  /** Propose-review only: allow foreshadowed Accepted ME to prepend auto-accept copy. */
  foreshadowCurrentUserAutoAccept?: boolean;
  replacesOpenProposal?: boolean;
  footer: ReactNode;
  stepFocusRef?: (element: HTMLElement | null) => void;
  stepFocusFallbackLabel?: string;
};

const RevShareReviewShell: FunctionComponent<RevShareReviewShellProps> = ({
  chrome,
  heading,
  description,
  rows,
  banner,
  foreshadowCurrentUserAutoAccept = false,
  replacesOpenProposal = false,
  footer,
  stepFocusRef,
  stepFocusFallbackLabel,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const pendingCount = rows.filter(
    (row) => row.status === RevShareConfirmationStatus.Pending,
  ).length;
  const willCurrentUserAutoAccept =
    foreshadowCurrentUserAutoAccept &&
    rows.some(
      (row) =>
        !row.isManagingGroup &&
        row.isCurrentUser === true &&
        row.status === RevShareConfirmationStatus.Accepted,
    );
  const acceptanceBody = (() => {
    if (willCurrentUserAutoAccept && pendingCount === 1) {
      return tPendingTranslation(
        'You will auto-accept this change. {count} recipient will need to accept before this agreement takes effect.',
        'Review banner when the authenticated user will auto-accept on submit and one other recipient must still accept; {count} is that one recipient (always "1").',
        translationKey(
          'Message.YouWillAutoAcceptAndOneRecipientMustAccept',
          TranslationNamespace.RevenueShareAgreements,
        ),
        { count: String(pendingCount) },
      );
    }
    if (willCurrentUserAutoAccept && pendingCount > 1) {
      return tPendingTranslation(
        'You will auto-accept this change. All {count} recipients will need to accept before this agreement takes effect.',
        'Review banner when the authenticated user will auto-accept on submit and multiple other recipients must still accept; {count} is the number of those pending recipients.',
        translationKey(
          'Message.YouWillAutoAcceptAndRecipientsMustAccept',
          TranslationNamespace.RevenueShareAgreements,
        ),
        { count: String(pendingCount) },
      );
    }
    if (willCurrentUserAutoAccept) {
      return tPendingTranslation(
        'You will auto-accept this change.',
        'Review banner sentence when the authenticated user will auto-accept a proposed revenue share change on submit.',
        translationKey(
          'Message.YouWillAutoAcceptChange',
          TranslationNamespace.RevenueShareAgreements,
        ),
      );
    }
    if (pendingCount === 1) {
      return tPendingTranslation(
        '{count} recipient will need to accept before this agreement takes effect.',
        'Review banner; {count} is the one recipient who must accept a proposed revenue split.',
        translationKey('Label.OneRecipientMustAccept', TranslationNamespace.RevenueShareAgreements),
        { count: String(pendingCount) },
      );
    }
    if (pendingCount > 1) {
      return tPendingTranslation(
        'All {count} recipients will need to accept before this agreement takes effect.',
        'Review banner; {count} is the number of recipients who must accept a proposed revenue split.',
        translationKey('Label.RecipientsMustAccept', TranslationNamespace.RevenueShareAgreements),
        { count: String(pendingCount) },
      );
    }
    return null;
  })();
  const replaceBannerTitle = tPendingTranslation(
    'Submitting cancels the open proposal.',
    'Review-step banner title shown when submitting a new revenue share proposal will cancel an existing open proposal.',
    translationKey(
      'Message.SubmittingCancelsOpenProposal',
      TranslationNamespace.RevenueShareAgreements,
    ),
  );
  const replaceBannerDescription =
    acceptanceBody ??
    tPendingTranslation(
      'Agreement will automatically take effect.',
      'Review banner bullet when a proposed revenue share needs no recipient acceptance.',
      translationKey(
        'Message.AgreementTakesEffectAutomatically',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  const resolvedBanner =
    banner ??
    (replacesOpenProposal ? (
      <RevShareBanner
        tone='warning'
        layout='Stacked'
        message={replaceBannerTitle}
        description={replaceBannerDescription}
      />
    ) : acceptanceBody != null ? (
      <RevShareBanner message={acceptanceBody} />
    ) : null);
  return (
    <div className='flex flex-col gap-large width-full max-width-full min-width-0'>
      {chrome}
      {(heading != null || description != null || stepFocusFallbackLabel != null) && (
        <div className='flex flex-col gap-xsmall'>
          {heading != null ? (
            <h2
              ref={stepFocusRef}
              tabIndex={-1}
              className='text-heading-medium content-emphasis margin-none'>
              {heading}
            </h2>
          ) : (
            stepFocusRef != null &&
            stepFocusFallbackLabel != null && (
              <VisuallyHidden>
                <span ref={stepFocusRef} tabIndex={-1}>
                  {stepFocusFallbackLabel}
                </span>
              </VisuallyHidden>
            )
          )}
          {description != null && (
            <span className='text-body-medium content-muted'>{description}</span>
          )}
        </div>
      )}
      {resolvedBanner}
      <RevShareDiffTable rows={rows} />
      {footer}
    </div>
  );
};

export default RevShareReviewShell;
