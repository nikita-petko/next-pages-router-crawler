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
  replacesOpenProposal = false,
  footer,
  stepFocusRef,
  stepFocusFallbackLabel,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const pendingCount = rows.filter(
    (row) => row.status === RevShareConfirmationStatus.Pending,
  ).length;
  const defaultBannerMessage =
    pendingCount === 1
      ? tPendingTranslation(
          '{count} recipient will need to accept before this agreement takes effect.',
          'Review banner; {count} is the one recipient who must accept a proposed revenue split.',
          translationKey(
            'Label.OneRecipientMustAccept',
            TranslationNamespace.RevenueShareAgreements,
          ),
          { count: String(pendingCount) },
        )
      : tPendingTranslation(
          'All {count} recipients will need to accept before this agreement takes effect.',
          'Review banner; {count} is the number of recipients who must accept a proposed revenue split.',
          translationKey('Label.RecipientsMustAccept', TranslationNamespace.RevenueShareAgreements),
          { count: String(pendingCount) },
        );
  const replaceBannerTitle = tPendingTranslation(
    'Submitting cancels the open proposal.',
    'Review-step banner title shown when submitting a new revenue share proposal will cancel an existing open proposal.',
    translationKey(
      'Message.SubmittingCancelsOpenProposal',
      TranslationNamespace.RevenueShareAgreements,
    ),
  );
  const replaceBannerFact =
    pendingCount === 0
      ? tPendingTranslation(
          'Agreement will automatically take effect.',
          'Review banner bullet when a proposed revenue share needs no recipient acceptance.',
          translationKey(
            'Message.AgreementTakesEffectAutomatically',
            TranslationNamespace.RevenueShareAgreements,
          ),
        )
      : pendingCount === 1
        ? tPendingTranslation(
            '{count} recipient will need to accept before this agreement takes effect.',
            'Review banner; {count} is the one recipient who must accept a proposed revenue split.',
            translationKey(
              'Label.OneRecipientMustAccept',
              TranslationNamespace.RevenueShareAgreements,
            ),
            { count: String(pendingCount) },
          )
        : tPendingTranslation(
            'All {count} recipients will need to accept before this agreement takes effect.',
            'Review banner; {count} is the number of recipients who must accept a proposed revenue split.',
            translationKey(
              'Label.RecipientsMustAccept',
              TranslationNamespace.RevenueShareAgreements,
            ),
            { count: String(pendingCount) },
          );
  const resolvedBanner =
    banner ??
    (replacesOpenProposal ? (
      <RevShareBanner
        tone='warning'
        layout='Stacked'
        message={replaceBannerTitle}
        description={replaceBannerFact}
      />
    ) : pendingCount > 0 ? (
      <RevShareBanner message={defaultBannerMessage} />
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
