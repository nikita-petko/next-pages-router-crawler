// Displays editable revenue share recipient rows and owns pure editor-row derivation helpers.
import { useCallback, type FunctionComponent } from 'react';
import { IconButton, VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import {
  REV_SHARE_TOTAL_BASIS_POINTS,
  RevShareRecipientType,
  type RevShareRecipientAllocation,
} from '../../interface/RevShareViewModel';
import { UNALLOCATED_COLOR } from '../../utils/revShareSplitColors';
import {
  asNumberTypedId,
  asSafeBasisPoints,
  formatPreviousSplitDisplay,
} from '../../utils/revShareUtils';
import { isRevShareSplitEditorAllocationInvalid } from '../../utils/revShareValidation';
import RevSharePercentInput from '../RevSharePercentInput';
import RevShareThumbnailWithNames, {
  type RevShareThumbnailWithNamesProps,
} from '../RevShareThumbnailWithNames';
import { RevShareManagingGroupIcon } from './RevShareManagingGroupIcon';

export type SplitEditorRow = {
  key: string;
  id: string;
  name: string;
  subtitle?: string;
  type: RevShareRecipientType;
  identity?: {
    target: RevShareThumbnailWithNamesProps['target'];
    targetType: CreatorType;
  };
  thumbnailColorOverride?: string;
  previousBasisPoints: number | null;
  basisPoints: number;
  disabled?: boolean;
  isManagingGroup?: boolean;
  isNew?: boolean;
  isRemoved?: boolean;
  fieldInvalid?: boolean;
  fieldErrorMessage?: string;
};

export const rebalanceSplitEditorManagingGroupBasisPoints = (
  rows: readonly SplitEditorRow[],
): SplitEditorRow[] => {
  const recipientTotal = rows
    .filter((row) => !row.isManagingGroup && !row.isRemoved)
    .reduce((total, row) => total + asSafeBasisPoints(row.basisPoints), 0);
  const managingGroupBasisPoints = REV_SHARE_TOTAL_BASIS_POINTS - recipientTotal;
  return rows.map((row) =>
    row.isManagingGroup
      ? { ...row, basisPoints: managingGroupBasisPoints }
      : { ...row, basisPoints: asSafeBasisPoints(row.basisPoints) },
  );
};

export const splitEditorRowsToRecipientAllocations = (
  rows: readonly SplitEditorRow[],
): RevShareRecipientAllocation[] =>
  rows
    .filter((row) => !row.isManagingGroup && !row.isRemoved)
    .map((row) => ({
      recipient: { type: row.type, id: row.id },
      splitBasisPoints: row.basisPoints,
    }));

export const orderSplitEditorDisplayRows = (rows: readonly SplitEditorRow[]): SplitEditorRow[] => {
  const managingGroupRows: SplitEditorRow[] = [];
  const newRows: SplitEditorRow[] = [];
  const existingRows: SplitEditorRow[] = [];

  for (const row of rows) {
    if (row.isRemoved) {
      continue;
    }
    if (row.isManagingGroup) {
      managingGroupRows.push(row);
    } else if (row.isNew) {
      newRows.push(row);
    } else {
      existingRows.push(row);
    }
  }

  newRows.sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    return nameCompare !== 0 ? nameCompare : a.key.localeCompare(b.key);
  });

  return [...managingGroupRows, ...newRows, ...existingRows];
};

export const decorateSplitEditorFieldErrors = (
  orderedRows: readonly SplitEditorRow[],
  invalidRecipientShareMessage: string,
): SplitEditorRow[] =>
  orderedRows.map((row) => {
    const fieldInvalid = isRevShareSplitEditorAllocationInvalid({
      splitBasisPoints: row.basisPoints,
      isManagingGroup: row.isManagingGroup,
    });
    return {
      ...row,
      fieldInvalid,
      fieldErrorMessage: fieldInvalid ? invalidRecipientShareMessage : undefined,
    };
  });

type RevShareSplitEditorTableProps = {
  rows: readonly SplitEditorRow[];
  onSplitChange?: (key: string, newBasisPoints: number) => void;
  onSplitValidityChange?: (key: string, isValid: boolean) => void;
  onRemove?: (key: string) => void;
};

type SplitPercentCellProps = {
  row: SplitEditorRow;
  onSplitChange?: (key: string, newBasisPoints: number) => void;
  onSplitValidityChange?: (key: string, isValid: boolean) => void;
};

const SplitPercentCell: FunctionComponent<SplitPercentCellProps> = ({
  row,
  onSplitChange,
  onSplitValidityChange,
}) => {
  const handleChange = useCallback(
    (basisPoints: number) => {
      onSplitChange?.(row.key, basisPoints);
    },
    [onSplitChange, row.key],
  );
  const handleValidityChange = useCallback(
    (isValid: boolean) => {
      onSplitValidityChange?.(row.key, isValid);
    },
    [onSplitValidityChange, row.key],
  );

  if (row.isManagingGroup) {
    return <RevSharePercentInput basisPoints={row.basisPoints} isCalculatedDisplay />;
  }

  return (
    <RevSharePercentInput
      basisPoints={row.basisPoints}
      onChange={row.disabled ? undefined : handleChange}
      disabled={row.disabled}
      recipientName={row.name}
      onValidityChange={handleValidityChange}
      fieldInvalid={row.fieldInvalid}
      fieldErrorMessage={row.fieldErrorMessage}
    />
  );
};

type RemoveRecipientButtonProps = {
  row: SplitEditorRow;
  ariaLabel: string;
  onRemove?: (key: string) => void;
};

const RemoveRecipientButton: FunctionComponent<RemoveRecipientButtonProps> = ({
  row,
  ariaLabel,
  onRemove,
}) => {
  const handleRemove = useCallback(() => {
    onRemove?.(row.key);
  }, [onRemove, row.key]);

  return (
    <IconButton
      type='button'
      icon='icon-regular-trash-can'
      size='Small'
      variant='Utility'
      ariaLabel={ariaLabel}
      onClick={handleRemove}
    />
  );
};

type SplitEditorTableRowProps = {
  row: SplitEditorRow;
  managingGroupAriaLabel: string;
  removeAriaLabel: string;
  onSplitChange?: (key: string, newBasisPoints: number) => void;
  onSplitValidityChange?: (key: string, isValid: boolean) => void;
  onRemove?: (key: string) => void;
};

const REV_SHARE_SPLIT_EDITOR_TABLE_COLUMN_COUNT = 8;
const PARTY_COLUMN_CLASS =
  '[width:calc(var(--size-3000)*2)] [min-width:calc(var(--size-3000)*2)] [max-width:calc(var(--size-3000)*2)]';
// RevShareThumbnailWithNames truncation hack for the fixed party column.
const PARTY_IDENTITY_CLASS =
  'min-width-0 max-width-full clip [&_*]:min-width-0 [&_*]:max-width-full';
const MANAGING_GROUP_COLUMN_CLASS = 'width-600 min-width-600 max-width-600';
const FLEX_SPACER_COLUMN_CLASS = 'min-width-400';
const SPLIT_VALUE_COLUMN_CLASS = 'width-2200 min-width-2200 max-width-2200';
const SPLIT_GAP_COLUMN_CLASS = 'width-200 min-width-200 max-width-200';
const ACTION_COLUMN_CLASS = 'width-1400 min-width-1400 max-width-1400';
const DECORATIVE_CELL_CLASS = 'padding-none';

const SplitEditorTableRow: FunctionComponent<SplitEditorTableRowProps> = ({
  row,
  managingGroupAriaLabel,
  removeAriaLabel,
  onSplitChange,
  onSplitValidityChange,
  onRemove,
}) => {
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
              thumbnailColorOverride={row.thumbnailColorOverride ?? UNALLOCATED_COLOR}
              label={partyLabel}
              variant='compact'
              disableLink
              hideSecondaryLabel
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
          <SplitPercentCell
            row={row}
            onSplitChange={onSplitChange}
            onSplitValidityChange={onSplitValidityChange}
          />
        </div>
      </TableCell>
      <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
      <TableCell
        align='center'
        className={`padding-y-small padding-left-xsmall padding-right-medium ${ACTION_COLUMN_CLASS}`}>
        {!row.disabled && (
          <RemoveRecipientButton row={row} ariaLabel={removeAriaLabel} onRemove={onRemove} />
        )}
      </TableCell>
    </TableRow>
  );
};

const RevShareSplitEditorTable: FunctionComponent<RevShareSplitEditorTableProps> = ({
  rows,
  onSplitChange,
  onSplitValidityChange,
  onRemove,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const tableLabel = tPendingTranslation(
    'Edit recipients',
    'Heading and accessible table label for editing revenue share recipients.',
    translationKey('Heading.EditRecipients', TranslationNamespace.RevenueShareAgreements),
  );
  const partyHeading = tPendingTranslation(
    'Party',
    'Column heading for a party receiving a revenue share.',
    translationKey('Label.Party', TranslationNamespace.RevenueShareAgreements),
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
  const splitHeading = tPendingTranslation(
    'New split',
    'Column heading for the edited revenue share percentage.',
    translationKey('Label.NewSplit', TranslationNamespace.RevenueShareAgreements),
  );
  const emptyMessage = tPendingTranslation(
    'No recipients yet',
    'Empty message for the revenue share split editor table.',
    translationKey('Label.NoRecipientsYet', TranslationNamespace.RevenueShareAgreements),
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
        <col className={ACTION_COLUMN_CLASS} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableCell
            className={`text-label-small content-muted text-align-x-left padding-bottom-small ${PARTY_COLUMN_CLASS}`}>
            {partyHeading}
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
            <div className='flex items-center justify-end width-full text-no-wrap padding-right-small'>
              {splitHeading}
            </div>
          </TableCell>
          <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
          <TableCell
            aria-hidden
            className={`padding-bottom-small padding-left-xsmall padding-right-medium ${ACTION_COLUMN_CLASS}`}
          />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={REV_SHARE_SPLIT_EDITOR_TABLE_COLUMN_COUNT}
              className='text-body-medium content-muted padding-y-medium'>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <SplitEditorTableRow
              key={row.key}
              row={row}
              managingGroupAriaLabel={managingGroupHeading}
              removeAriaLabel={tPendingTranslation(
                'Remove {name}',
                'Accessible label for removing a recipient; {name} is the recipient name.',
                translationKey(
                  'Action.RemoveRecipient',
                  TranslationNamespace.RevenueShareAgreements,
                ),
                { name: row.name },
              )}
              onSplitChange={onSplitChange}
              onSplitValidityChange={onSplitValidityChange}
              onRemove={onRemove}
            />
          ))
        )}
      </TableBody>
    </TableBase>
  );
};

export default RevShareSplitEditorTable;
