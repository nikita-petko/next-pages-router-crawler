// Presents passive recipient agreement detail with a status banner and the shared target and current-split detail layout.
import { useMemo, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  RecipientAgreement,
  ResolvedRevShareParty,
  RevShareRecipient,
  RevShareRecipientSplit,
} from '../interface/RevShareViewModel';
import { RevShareConfirmationStatus, RevShareTargetType } from '../interface/RevShareViewModel';
import { translateRevShareRecipientSettledStatusBanner } from '../utils/revShareRecipientProposalStatusPresentation';
import {
  AGGREGATE_REMAINING_COLOR,
  MANAGING_GROUP_COLOR,
  UNALLOCATED_COLOR,
} from '../utils/revShareSplitColors';
import {
  asNumberTypedId,
  formatBasisPoints,
  isRevShareCurrentUserRecipient,
} from '../utils/revShareUtils';
import RevShareBanner from './RevShareBanner';
import RevShareDetailView from './RevShareDetailView';
import type { RevShareSplitRowData } from './tables/RevShareSplitTable';

type RevShareRecipientRowLabels = {
  recipientName: string;
  remainingName: string;
  unallocatedName: string;
};

const buildRecipientSplitRows = (
  split: RevShareRecipientSplit,
  recipient: RevShareRecipient,
  recipientParty: ResolvedRevShareParty,
  labels: RevShareRecipientRowLabels,
  currentUserId: string | number | null | undefined,
): RevShareSplitRowData[] => {
  const rows: RevShareSplitRowData[] = [
    {
      id: `${recipientParty.targetType}:${String(recipientParty.target.id)}`,
      name: labels.recipientName,
      identity: recipientParty,
      basisPoints: split.recipientBasisPoints,
      color: MANAGING_GROUP_COLOR,
      isCurrentUser: isRevShareCurrentUserRecipient(recipient, currentUserId),
    },
    {
      id: 'remaining',
      name: labels.remainingName,
      basisPoints: split.remainingBasisPoints,
      color: AGGREGATE_REMAINING_COLOR,
    },
  ];

  if (split.unallocatedBasisPoints > 0) {
    rows.push({
      id: 'unallocated',
      name: labels.unallocatedName,
      basisPoints: split.unallocatedBasisPoints,
      color: UNALLOCATED_COLOR,
    });
  }

  return rows;
};

export type RevShareRecipientDetailProps = {
  agreement: RecipientAgreement;
  recipient: RevShareRecipient;
  recipientParty: ResolvedRevShareParty;
  canRespond?: boolean;
  onBack: () => void;
  onReview: () => void;
};

const RevShareRecipientDetail: FunctionComponent<RevShareRecipientDetailProps> = ({
  agreement,
  recipient,
  recipientParty,
  canRespond = true,
  onBack,
  onReview,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { user } = useAuthentication();
  const currentUserId = user?.id;
  const labels = useMemo<RevShareRecipientRowLabels>(
    () => ({
      recipientName: tPendingTranslation(
        'You',
        'Label for the current recipient in a revenue-share split.',
        translationKey('Label.You', TranslationNamespace.RevenueShareAgreements),
      ),
      remainingName: tPendingTranslation(
        'All other parties',
        'Label for the aggregate of other parties in a recipient revenue-share projection.',
        translationKey('Label.AllOtherParties', TranslationNamespace.RevenueShareAgreements),
      ),
      unallocatedName: tPendingTranslation(
        'Unallocated',
        'Label for the unallocated portion of a revenue-share split.',
        translationKey('Label.Unallocated', TranslationNamespace.RevenueShareAgreements),
      ),
    }),
    [tPendingTranslation],
  );
  const splitRows = useMemo(
    () =>
      buildRecipientSplitRows(agreement.active, recipient, recipientParty, labels, currentUserId),
    [agreement.active, currentUserId, labels, recipient, recipientParty],
  );
  const proposalStatus = agreement.proposed?.confirmation;
  const isPending = proposalStatus === RevShareConfirmationStatus.Pending;
  const viewDetailsLabel = tPendingTranslation(
    'View details',
    'Button label to review or cancel a pending revenue share proposal.',
    translationKey('Action.ViewProposalDetails', TranslationNamespace.RevenueShareAgreements),
  );
  const reviewSplitLabel = tPendingTranslation(
    'Review split',
    'Button label for reviewing a recipient revenue-share proposal.',
    translationKey('Action.ReviewSplit', TranslationNamespace.RevenueShareAgreements),
  );
  const statusBanner = useMemo(() => {
    if (agreement.proposed === null) {
      return null;
    }
    if (isPending) {
      return (
        <RevShareBanner
          tone={canRespond ? 'warning' : 'emphasis'}
          message={
            canRespond
              ? tPendingTranslation(
                  'Pending change request: Review the proposed split, then accept it or go back for now.',
                  'Banner title when a recipient can respond to a pending revenue-share change request.',
                  translationKey(
                    'Message.RecipientPendingChangeRequestActionable',
                    TranslationNamespace.RevenueShareAgreements,
                  ),
                )
              : tPendingTranslation(
                  'Pending change request: You can view this proposal, but you do not have permission to accept it.',
                  'Banner title when a recipient can view but not accept a pending revenue-share change request.',
                  translationKey(
                    'Message.RecipientPendingChangeRequestReadOnly',
                    TranslationNamespace.RevenueShareAgreements,
                  ),
                )
          }
          actionLabel={reviewSplitLabel}
          onAction={onReview}
        />
      );
    }
    const settledBanner = translateRevShareRecipientSettledStatusBanner(
      proposalStatus,
      tPendingTranslation,
    );
    if (settledBanner !== null) {
      return (
        <RevShareBanner
          tone={settledBanner.tone}
          message={settledBanner.message}
          actionLabel={viewDetailsLabel}
          onAction={onReview}
        />
      );
    }
    return null;
  }, [
    agreement.proposed,
    canRespond,
    isPending,
    onReview,
    proposalStatus,
    reviewSplitLabel,
    tPendingTranslation,
    viewDetailsLabel,
  ]);
  const targetSubtitle =
    agreement.target.type === RevShareTargetType.Experience
      ? tPendingTranslation(
          'Experience',
          'Target type label for an experience with a revenue share agreement.',
          translationKey('Label.Experience', TranslationNamespace.RevenueShareAgreements),
        )
      : tPendingTranslation(
          'UGC item',
          'Target type label for a UGC item with a revenue share agreement.',
          translationKey('Label.UgcItem', TranslationNamespace.RevenueShareAgreements),
        );
  const targetName =
    agreement.targetName.trim() ||
    tPendingTranslation(
      'Target {id}',
      'Fallback revenue share agreement target name shown when no resolved name is available.',
      translationKey('Label.TargetWithId', TranslationNamespace.RevenueShareAgreements),
      { id: agreement.target.id },
    );

  return (
    <RevShareDetailView
      target={{ id: asNumberTypedId(agreement.target.id) }}
      targetType={agreement.target.type === RevShareTargetType.Experience ? 'Experience' : 'Ugc'}
      targetName={targetName}
      targetSubtitle={targetSubtitle}
      splitRows={splitRows}
      banner={statusBanner}
      onBack={onBack}
      centerLabel={`${formatBasisPoints(agreement.active.recipientBasisPoints)}%`}
      centerSubLabel={tPendingTranslation(
        'Your share',
        'Label below the recipient percentage in revenue-share detail.',
        translationKey('Label.YourShare', TranslationNamespace.RevenueShareAgreements),
      )}
      chartAccessibleLabel={tPendingTranslation(
        'Your current revenue share split chart',
        'Accessible label for a recipient current revenue share pie chart.',
        translationKey(
          'Label.RecipientCurrentSplitChart',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      tableAccessibleLabel={tPendingTranslation(
        'Your current revenue share split',
        'Accessible label for a recipient current revenue share table.',
        translationKey(
          'Label.RecipientCurrentSplitTable',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
    />
  );
};

export default RevShareRecipientDetail;
