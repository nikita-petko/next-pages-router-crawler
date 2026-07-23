import type { FunctionComponent } from 'react';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import {
  RevShareConfirmationStatus,
  RevShareRecipientType,
  type ManagerProposal,
  type ResolvedRevShareParty,
  type RevShareAllocationChange,
  type RevShareRecipient,
  type RevShareRecipientAllocationChange,
} from '../../interface/RevShareViewModel';
import {
  asNumberTypedId,
  formatPreviousSplitDisplay,
  getRevShareRecipientKey,
} from '../../utils/revShareUtils';
import RevShareStatusBadge from '../RevShareStatusBadge';
import RevShareThumbnailWithNames, {
  type RevShareThumbnailWithNamesProps,
} from '../RevShareThumbnailWithNames';
import { RevShareManagingGroupIcon } from './RevShareManagingGroupIcon';
import type { SplitEditorRow } from './RevShareSplitEditorTable';

const REV_SHARE_DIFF_TABLE_COLUMN_COUNT = 8;
const PARTY_COLUMN_CLASS =
  '[width:calc(var(--size-3000)*2)] [min-width:calc(var(--size-3000)*2)] [max-width:calc(var(--size-3000)*2)]';
// RevShareThumbnailWithNames truncation hack for the fixed party column.
const PARTY_IDENTITY_CLASS =
  'min-width-0 max-width-full clip [&_*]:min-width-0 [&_*]:max-width-full';
const MANAGING_GROUP_COLUMN_CLASS = 'width-600 min-width-600 max-width-600';
const FLEX_SPACER_COLUMN_CLASS = 'min-width-400';
const SPLIT_VALUE_COLUMN_CLASS = 'width-2200 min-width-2200 max-width-2200';
const SPLIT_GAP_COLUMN_CLASS = 'width-200 min-width-200 max-width-200';
const STATUS_COLUMN_CLASS = 'width-2800 min-width-2800 max-width-2800';
const DECORATIVE_CELL_CLASS = 'padding-none';

export type RevShareDiffRowData = RevShareRecipient & {
  key: string;
  name: string;
  subtitle?: string;
  thumbnailColorOverride?: string;
  identity?: {
    target: RevShareThumbnailWithNamesProps['target'];
    targetType: CreatorType;
  };
  previousBasisPoints: number | null;
  newBasisPoints: number;
  isManagingGroup?: boolean;
  status?: RevShareConfirmationStatus;
};

type ManagerProposalReviewManagingGroup = {
  key: string;
  id: string;
  name: string;
  subtitle?: string;
  identity?: RevShareDiffRowData['identity'];
  previousBasisPoints: number;
};

type ManagerProposalReviewEditorRow = {
  name: string;
  subtitle?: string;
  identity?: RevShareDiffRowData['identity'];
  previousBasisPoints: number | null;
};

type BuildRevShareDiffRowsFromManagerProposalInput = {
  proposal: Pick<ManagerProposal, 'changes' | 'confirmations'>;
  managingGroup: ManagerProposalReviewManagingGroup;
  resolveRecipientParty: (recipient: RevShareRecipient) => ResolvedRevShareParty;
  editorRowByKey?: ReadonlyMap<string, ManagerProposalReviewEditorRow>;
};

export const buildRevShareDiffRowsFromManagerProposal = ({
  proposal,
  managingGroup,
  resolveRecipientParty,
  editorRowByKey,
}: BuildRevShareDiffRowsFromManagerProposalInput): RevShareDiffRowData[] => {
  const confirmationStatusByRecipientKey = new Map(
    proposal.confirmations.map((confirmation) => [
      getRevShareRecipientKey(confirmation.recipient),
      confirmation.status,
    ]),
  );
  const managingGroupNewBasisPoints = proposal.changes.managingGroup.toBasisPoints;
  const managingGroupRow: RevShareDiffRowData = {
    key: managingGroup.key,
    id: managingGroup.id,
    name: managingGroup.name,
    subtitle: managingGroup.subtitle,
    type: RevShareRecipientType.Group,
    identity: managingGroup.identity,
    previousBasisPoints: managingGroup.previousBasisPoints,
    newBasisPoints: managingGroupNewBasisPoints,
    status: RevShareConfirmationStatus.AutoAccepted,
    isManagingGroup: true,
  };

  const recipientRows = proposal.changes.recipientChangesInStableDisplayOrder.map((change) => {
    const key = getRevShareRecipientKey(change.recipient);
    const editorRow = editorRowByKey?.get(key);
    const party = resolveRecipientParty(change.recipient);
    const previousBasisPoints =
      editorRow?.previousBasisPoints ?? (change.isAddition ? null : change.fromBasisPoints);

    return {
      key,
      id: change.recipient.id,
      name: editorRow?.name ?? party.name,
      subtitle: editorRow?.subtitle,
      type: change.recipient.type,
      identity:
        editorRow?.identity ??
        ({
          target: party.target,
          targetType:
            change.recipient.type === RevShareRecipientType.User
              ? CreatorType.User
              : CreatorType.Group,
        } satisfies RevShareDiffRowData['identity']),
      previousBasisPoints,
      newBasisPoints: change.toBasisPoints,
      status: confirmationStatusByRecipientKey.get(key),
    };
  });

  return [managingGroupRow, ...recipientRows];
};

export const buildRevShareDiffRowsFromSplitEditor = (
  rows: readonly SplitEditorRow[],
  proposal: Pick<ManagerProposal, 'changes' | 'confirmations'>,
): RevShareDiffRowData[] => {
  const confirmationStatusByRecipientKey = new Map<string, RevShareConfirmationStatus>();
  for (const confirmation of proposal.confirmations) {
    confirmationStatusByRecipientKey.set(
      getRevShareRecipientKey(confirmation.recipient),
      confirmation.status,
    );
  }

  const managingGroupRow = rows.find((row) => row.isManagingGroup);
  const rowByRecipientKey = new Map<string, SplitEditorRow>();
  for (const row of rows) {
    if (!row.isManagingGroup) {
      rowByRecipientKey.set(row.key, row);
    }
  }

  const matchedKeys = new Set<string>();
  const recipientReviewRows = proposal.changes.recipientChangesInStableDisplayOrder.map(
    (change) => {
      const key = getRevShareRecipientKey(change.recipient);
      matchedKeys.add(key);
      const row = rowByRecipientKey.get(key);
      const newBasisPoints = change.toBasisPoints;
      const previousBasisPoints =
        row !== undefined
          ? row.previousBasisPoints
          : change.isAddition
            ? null
            : change.fromBasisPoints;
      return {
        key,
        id: row?.id ?? change.recipient.id,
        name: row?.name ?? change.recipient.id,
        subtitle: row?.subtitle,
        type: change.recipient.type,
        identity: row?.identity,
        previousBasisPoints,
        newBasisPoints,
        status: confirmationStatusByRecipientKey.get(key),
      };
    },
  );

  const unmatchedRows = rows.filter((row) => !row.isManagingGroup && !matchedKeys.has(row.key));
  for (const row of unmatchedRows) {
    recipientReviewRows.push({
      key: row.key,
      id: row.id,
      name: row.name,
      subtitle: row.subtitle,
      type: row.type,
      identity: row.identity,
      previousBasisPoints: row.previousBasisPoints,
      newBasisPoints: row.isRemoved ? 0 : row.basisPoints,
      status: confirmationStatusByRecipientKey.get(row.key),
    });
  }

  if (managingGroupRow === undefined) {
    return recipientReviewRows;
  }

  return [
    {
      key: managingGroupRow.key,
      id: managingGroupRow.id,
      name: managingGroupRow.name,
      subtitle: managingGroupRow.subtitle,
      type: managingGroupRow.type,
      identity: managingGroupRow.identity,
      previousBasisPoints: managingGroupRow.previousBasisPoints,
      newBasisPoints: managingGroupRow.basisPoints,
      isManagingGroup: true,
      status: RevShareConfirmationStatus.AutoAccepted,
    },
    ...recipientReviewRows,
  ];
};

type RevShareDiffTableProps = {
  rows: readonly RevShareDiffRowData[];
  accessibleLabel?: string;
  emptyMessage?: string;
};

type AllocationChange = RevShareAllocationChange &
  Partial<Pick<RevShareRecipientAllocationChange, 'isAddition' | 'isRemoval'>>;

export enum RevShareAllocationChangeKind {
  Addition = 'addition',
  Removal = 'removal',
  Increase = 'increase',
  Decrease = 'decrease',
  Neutral = 'neutral',
}

export const getRevShareAllocationChangeKind = ({
  fromBasisPoints,
  toBasisPoints,
  isAddition,
  isRemoval,
}: AllocationChange): RevShareAllocationChangeKind => {
  if (isAddition) {
    return RevShareAllocationChangeKind.Addition;
  }
  if (isRemoval || toBasisPoints === 0) {
    return RevShareAllocationChangeKind.Removal;
  }
  if (toBasisPoints > fromBasisPoints) {
    return RevShareAllocationChangeKind.Increase;
  }
  if (toBasisPoints < fromBasisPoints) {
    return RevShareAllocationChangeKind.Decrease;
  }
  return RevShareAllocationChangeKind.Neutral;
};

const CHANGE_TEXT_COLOR: Record<RevShareAllocationChangeKind, string> = {
  addition: 'content-link',
  increase: 'content-system-success',
  decrease: 'content-system-alert',
  removal: 'content-system-alert',
  neutral: 'content-emphasis',
};

type RevShareDiffTableRowProps = {
  row: RevShareDiffRowData;
  managingGroupAriaLabel: string;
};

const RevShareDiffTableRow: FunctionComponent<RevShareDiffTableRowProps> = ({
  row,
  managingGroupAriaLabel,
}) => {
  const changeKind = getRevShareAllocationChangeKind({
    fromBasisPoints: row.previousBasisPoints ?? 0,
    toBasisPoints: row.newBasisPoints,
    isAddition: row.previousBasisPoints === null,
    isRemoval: row.newBasisPoints === 0 && row.previousBasisPoints !== null,
  });
  const newColorClass = CHANGE_TEXT_COLOR[changeKind];
  const partyLabel = row.isManagingGroup ? undefined : row.subtitle;

  return (
    <TableRow>
      <TableCell className={`padding-y-small ${PARTY_COLUMN_CLASS}`}>
        <div className={PARTY_IDENTITY_CLASS}>
          {row.identity ? (
            <RevShareThumbnailWithNames
              target={row.identity.target}
              targetType={row.identity.targetType}
              label={partyLabel}
              variant='compact'
              disableLink
            />
          ) : (
            <RevShareThumbnailWithNames
              target={{ id: asNumberTypedId(row.id) }}
              targetType={
                row.type === RevShareRecipientType.User ? CreatorType.User : CreatorType.Group
              }
              displayNameOverride={row.name}
              thumbnailColorOverride={row.thumbnailColorOverride}
              label={partyLabel}
              variant='compact'
              disableLink
              hideSecondaryLabel={row.thumbnailColorOverride !== undefined}
            />
          )}
        </div>
      </TableCell>
      <TableCell
        align='center'
        className={`padding-y-small padding-x-xsmall ${MANAGING_GROUP_COLUMN_CLASS}`}>
        <div className='flex items-center justify-center width-full'>
          {row.isManagingGroup ? (
            <RevShareManagingGroupIcon ariaLabel={managingGroupAriaLabel} />
          ) : null}
        </div>
      </TableCell>
      <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
      <TableCell
        align='right'
        className={`padding-y-small padding-x-xsmall text-align-x-right ${SPLIT_VALUE_COLUMN_CLASS}`}>
        <div className='flex items-center justify-end width-full'>
          <span className='text-body-medium content-muted'>
            {formatPreviousSplitDisplay(row.previousBasisPoints)}
          </span>
        </div>
      </TableCell>
      <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
      <TableCell
        align='right'
        className={`padding-y-small padding-x-xsmall text-align-x-right ${SPLIT_VALUE_COLUMN_CLASS}`}>
        <div className='flex items-center justify-end width-full'>
          <span className={`text-body-medium ${newColorClass} [font-weight:600]`}>
            {formatPreviousSplitDisplay(row.newBasisPoints)}
          </span>
        </div>
      </TableCell>
      <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
      <TableCell
        align='center'
        className={`padding-y-small padding-x-xsmall ${STATUS_COLUMN_CLASS}`}>
        <div className='flex items-center justify-center width-full'>
          <RevShareStatusBadge status={row.status} />
        </div>
      </TableCell>
    </TableRow>
  );
};

const RevShareDiffTable: FunctionComponent<RevShareDiffTableProps> = ({
  rows,
  accessibleLabel,
  emptyMessage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const tableLabel =
    accessibleLabel ??
    tPendingTranslation(
      'Revenue share recipients',
      'Accessible caption for the table of recipients in a revenue share agreement review.',
      translationKey('Label.RecipientTable', TranslationNamespace.RevenueShareAgreements),
    );
  const resolvedEmptyMessage =
    emptyMessage ??
    tPendingTranslation(
      'No data',
      'Fallback message shown when the revenue share landing table has no rows.',
      translationKey('Label.NoData', TranslationNamespace.RevenueShareAgreements),
    );
  const managingGroupHeading = tPendingTranslation(
    'Managing group',
    'Column heading for the managing group badge in revenue share recipient tables.',
    translationKey('Label.ManagingGroup', TranslationNamespace.RevenueShareAgreements),
  );
  const previousHeading = tPendingTranslation(
    'Previous',
    'Column heading for the previous revenue share percentage.',
    translationKey('Label.Previous', TranslationNamespace.RevenueShareAgreements),
  );
  const newSplitHeading = tPendingTranslation(
    'New split',
    'Column heading for the edited revenue share percentage.',
    translationKey('Label.NewSplit', TranslationNamespace.RevenueShareAgreements),
  );

  return (
    <TableBase borderless>
      <VisuallyHidden asChild>
        <caption>{tableLabel}</caption>
      </VisuallyHidden>
      <colgroup>
        <col className={PARTY_COLUMN_CLASS} />
        <col className={MANAGING_GROUP_COLUMN_CLASS} />
        <col className={FLEX_SPACER_COLUMN_CLASS} />
        <col className={SPLIT_VALUE_COLUMN_CLASS} />
        <col className={SPLIT_GAP_COLUMN_CLASS} />
        <col className={SPLIT_VALUE_COLUMN_CLASS} />
        <col className={FLEX_SPACER_COLUMN_CLASS} />
        <col className={STATUS_COLUMN_CLASS} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell
            className={`text-label-small content-muted text-align-x-left padding-bottom-small ${PARTY_COLUMN_CLASS}`}>
            {tPendingTranslation(
              'Party',
              'Column heading for a party receiving a revenue share.',
              translationKey('Label.Party', TranslationNamespace.RevenueShareAgreements),
            )}
          </TableCell>
          <TableCell
            align='center'
            className={`padding-bottom-small padding-x-xsmall ${MANAGING_GROUP_COLUMN_CLASS}`}>
            <VisuallyHidden>{managingGroupHeading}</VisuallyHidden>
          </TableCell>
          <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
          <TableCell
            align='right'
            className={`text-label-small content-muted text-align-x-right padding-bottom-small padding-x-xsmall ${SPLIT_VALUE_COLUMN_CLASS}`}>
            <div className='flex items-center justify-end width-full'>{previousHeading}</div>
          </TableCell>
          <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
          <TableCell
            align='right'
            className={`text-label-small content-muted text-align-x-right padding-bottom-small padding-x-xsmall ${SPLIT_VALUE_COLUMN_CLASS}`}>
            <div className='flex items-center justify-end width-full text-no-wrap'>
              {newSplitHeading}
            </div>
          </TableCell>
          <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
          <TableCell
            align='center'
            className={`text-label-small content-muted padding-bottom-small padding-x-xsmall ${STATUS_COLUMN_CLASS}`}>
            <div className='flex items-center justify-center width-full'>
              {tPendingTranslation(
                'Status',
                'Column heading for revenue share recipient approval status.',
                translationKey(
                  'Label.RecipientStatus',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )}
            </div>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={REV_SHARE_DIFF_TABLE_COLUMN_COUNT}
              className='text-body-medium content-muted padding-y-medium'>
              {resolvedEmptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <RevShareDiffTableRow
              key={row.key}
              row={row}
              managingGroupAriaLabel={managingGroupHeading}
            />
          ))
        )}
      </TableBody>
    </TableBase>
  );
};

export default RevShareDiffTable;
