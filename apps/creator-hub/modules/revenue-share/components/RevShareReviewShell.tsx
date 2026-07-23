// Renders shared review layout with optional chrome, pending-acceptance banner, split diff table, and footer actions.
import type { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';
import RevShareBanner from './RevShareBanner';
import RevShareDiffTable, { type RevShareDiffRowData } from './tables/RevShareDiffTable';

type RevShareReviewShellProps = {
  chrome?: ReactNode;
  heading: string;
  description?: string;
  rows: readonly RevShareDiffRowData[];
  banner?: ReactNode;
  footer: ReactNode;
};

const RevShareReviewShell: FunctionComponent<RevShareReviewShellProps> = ({
  chrome,
  heading,
  description,
  rows,
  banner,
  footer,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const pendingCount = rows.filter(
    (row) => row.status === RevShareConfirmationStatus.Pending,
  ).length;
  const bannerMessage =
    pendingCount === 1
      ? tPendingTranslation(
          '{count} recipient will need to accept before this agreement takes effect',
          'Review banner; {count} is the one recipient who must accept a proposed revenue split.',
          translationKey(
            'Label.OneRecipientMustAccept',
            TranslationNamespace.RevenueShareAgreements,
          ),
          { count: String(pendingCount) },
        )
      : tPendingTranslation(
          'All {count} recipients will need to accept before this agreement takes effect',
          'Review banner; {count} is the number of recipients who must accept a proposed revenue split.',
          translationKey('Label.RecipientsMustAccept', TranslationNamespace.RevenueShareAgreements),
          { count: String(pendingCount) },
        );
  const resolvedBanner =
    banner ?? (pendingCount > 0 ? <RevShareBanner message={bannerMessage} /> : null);

  return (
    <div className='flex flex-col gap-large width-full max-width-full min-width-0'>
      {chrome}
      <div className='flex flex-col gap-xsmall'>
        <h2 className='text-heading-medium content-emphasis margin-none'>{heading}</h2>
        {description != null && (
          <span className='text-body-medium content-muted'>{description}</span>
        )}
      </div>
      {resolvedBanner}
      <RevShareDiffTable rows={rows} />
      {footer}
    </div>
  );
};

export default RevShareReviewShell;
