// Provides the shared agreement detail layout with target header, optional banner, and split table and pie chart.
import type { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RevShareRecipient, RevShareSplit } from '../interface/RevShareViewModel';
import type { ResolvedRevShareParty } from '../queries/revShareQueries';
import RevShareBackNav from './nav/RevShareBackNav';
import RevShareBanner from './RevShareBanner';
import RevShareSplitPanel from './RevShareSplitPanel';
import RevShareThumbnailWithNames, {
  type RevShareThumbnailWithNamesProps,
} from './RevShareThumbnailWithNames';
import type { RevShareSplitRowData } from './tables/RevShareSplitTable';

type RevShareDetailViewProps = {
  target: RevShareThumbnailWithNamesProps['target'];
  targetType: RevShareThumbnailWithNamesProps['targetType'];
  targetName: string;
  targetSubtitle?: string;
  split?: RevShareSplit;
  splitRows?: readonly RevShareSplitRowData[];
  managingGroupParty?: ResolvedRevShareParty;
  managingGroupSubtitle?: string;
  unallocatedName?: string;
  resolveRecipientParty?: (recipient: RevShareRecipient) => ResolvedRevShareParty;
  centerLabel?: string;
  centerSubLabel?: string;
  backLabel?: string;
  chartAccessibleLabel?: string;
  tableAccessibleLabel?: string;
  emptyMessage?: string;
  banner?: ReactNode;
  headerAction?: ReactNode;
  onBack?: () => void;
};

const RevShareDetailView: FunctionComponent<RevShareDetailViewProps> = ({
  target,
  targetType,
  targetName,
  targetSubtitle,
  split,
  splitRows,
  managingGroupParty,
  managingGroupSubtitle,
  unallocatedName,
  resolveRecipientParty,
  centerLabel,
  centerSubLabel,
  backLabel,
  chartAccessibleLabel,
  tableAccessibleLabel,
  emptyMessage,
  banner,
  headerAction,
  onBack,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const defaultBanner = (
    <RevShareBanner
      tone='emphasis'
      message={tPendingTranslation(
        'Active split is paid out daily.',
        'Informational message explaining the payout schedule for an active revenue-share split.',
        translationKey('Message.ActiveSplitPaidDaily', TranslationNamespace.RevenueShareAgreements),
      )}
    />
  );

  return (
    <div className='flex flex-col gap-xlarge width-full'>
      {onBack && (
        <div className='flex'>
          <RevShareBackNav label={backLabel} onBack={onBack} focusOnMount />
        </div>
      )}

      <div className='flex items-start justify-between'>
        <RevShareThumbnailWithNames
          target={target}
          targetType={targetType}
          displayNameOverride={targetName}
          label={targetSubtitle}
          variant='large'
          disableLink
        />
        {headerAction}
      </div>

      {banner ?? defaultBanner}

      <RevShareSplitPanel
        split={split}
        rows={splitRows}
        managingGroupParty={managingGroupParty}
        managingGroupSubtitle={managingGroupSubtitle}
        unallocatedName={unallocatedName}
        resolveRecipientParty={resolveRecipientParty}
        centerLabel={centerLabel}
        centerSubLabel={centerSubLabel}
        chartAccessibleLabel={chartAccessibleLabel}
        tableAccessibleLabel={tableAccessibleLabel}
        emptyMessage={emptyMessage}
      />
    </div>
  );
};

export default RevShareDetailView;
