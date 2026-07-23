// Resolves a revenue share split into consistently colored party rows and displays matching table and chart views.
import { useMemo, type FunctionComponent } from 'react';
import type { RevShareRecipient, RevShareSplit } from '../interface/RevShareViewModel';
import type { ResolvedRevShareParty } from '../queries/revShareQueries';
import {
  getRecipientColorByIndex,
  MANAGING_GROUP_COLOR,
  UNALLOCATED_COLOR,
} from '../utils/revShareSplitColors';
import RevSharePieChart from './RevSharePieChart';
import RevShareSplitTable, { type RevShareSplitRowData } from './tables/RevShareSplitTable';
const MANAGING_GROUP_ROW_KEY_PREFIX = 'managing-group';

export type RevShareSplitPanelProps = {
  split?: RevShareSplit;
  rows?: readonly RevShareSplitRowData[];
  managingGroupParty?: ResolvedRevShareParty;
  managingGroupSubtitle?: string;
  unallocatedName?: string;
  resolveRecipientParty?: (recipient: RevShareRecipient) => ResolvedRevShareParty;
  centerLabel?: string;
  centerSubLabel?: string;
  chartAccessibleLabel?: string;
  tableAccessibleLabel?: string;
  emptyMessage?: string;
};

const RevShareSplitPanel: FunctionComponent<RevShareSplitPanelProps> = ({
  split,
  rows: rowsOverride,
  managingGroupParty,
  managingGroupSubtitle,
  unallocatedName,
  resolveRecipientParty,
  centerLabel,
  centerSubLabel,
  chartAccessibleLabel,
  tableAccessibleLabel,
  emptyMessage,
}) => {
  const rows = useMemo<RevShareSplitRowData[]>(() => {
    if (rowsOverride != null) {
      return [...rowsOverride];
    }
    if (
      split == null ||
      managingGroupParty == null ||
      managingGroupSubtitle == null ||
      unallocatedName == null ||
      resolveRecipientParty == null
    ) {
      return [];
    }
    const splitRows: RevShareSplitRowData[] = [
      {
        id: `${MANAGING_GROUP_ROW_KEY_PREFIX}:${managingGroupParty.target.id}`,
        name: managingGroupParty.name,
        subtitle: managingGroupSubtitle,
        identity: managingGroupParty,
        basisPoints: split.ownerBasisPoints,
        color: MANAGING_GROUP_COLOR,
      },
      ...split.recipients.map(({ recipient, splitBasisPoints }, index) => {
        const resolvedParty = resolveRecipientParty(recipient);
        return {
          id: `${recipient.type}:${recipient.id}`,
          name: resolvedParty.name,
          identity: resolvedParty,
          basisPoints: splitBasisPoints,
          color: getRecipientColorByIndex(index),
        };
      }),
    ];

    if (split.unallocatedBasisPoints > 0) {
      splitRows.push({
        id: 'unallocated',
        name: unallocatedName,
        basisPoints: split.unallocatedBasisPoints,
        color: UNALLOCATED_COLOR,
      });
    }

    return splitRows;
  }, [
    managingGroupParty,
    managingGroupSubtitle,
    resolveRecipientParty,
    rowsOverride,
    split,
    unallocatedName,
  ]);
  const slices = useMemo(
    () =>
      rows
        .filter((row) => row.basisPoints > 0)
        .map((row) => ({
          id: row.id,
          name: row.name,
          value: row.basisPoints,
          color: row.color,
        })),
    [rows],
  );

  return (
    <div className='flex flex-col medium:flex-row gap-xlarge medium:gap-xxlarge width-full items-center medium:items-start'>
      <div className='width-full medium:grow-1 medium:basis-0 min-width-0 self-center'>
        <RevShareSplitTable
          rows={rows}
          accessibleLabel={tableAccessibleLabel}
          emptyMessage={emptyMessage}
        />
      </div>
      {slices.length > 0 && (
        <div className='width-full medium:grow-1 medium:basis-0 min-width-0 clip'>
          <RevSharePieChart
            slices={slices}
            centerLabel={centerLabel}
            centerSubLabel={centerSubLabel}
            accessibleLabel={chartAccessibleLabel}
          />
        </div>
      )}
    </div>
  );
};

export default RevShareSplitPanel;
