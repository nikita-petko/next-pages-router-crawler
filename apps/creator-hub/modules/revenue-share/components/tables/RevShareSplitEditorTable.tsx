// Displays editable revenue share recipient rows and owns pure editor-row derivation helpers.
import { useCallback, useId, type FunctionComponent } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import ThumbnailWithNames, {
  type ThumbnailWithNamesProps,
} from '@modules/miscellaneous/components/ThumbnailWithNames';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import {
  REV_SHARE_TOTAL_BASIS_POINTS,
  RevShareRecipientType,
  type RevShareRecipientAllocation,
} from '../../interface/RevShareViewModel';
import { asNumberTypedId, formatBasisPoints } from '../../utils/revShareUtils';
import RevSharePercentInput from '../RevSharePercentInput';

type SplitEditorAllocation = Pick<RevShareRecipientAllocation, 'splitBasisPoints'> & {
  isOwner?: boolean;
};

export const isSplitEditorAllocationInvalid = ({
  splitBasisPoints,
  isOwner,
}: SplitEditorAllocation): boolean =>
  !Number.isSafeInteger(splitBasisPoints) ||
  splitBasisPoints < 0 ||
  splitBasisPoints > REV_SHARE_TOTAL_BASIS_POINTS ||
  (!isOwner && splitBasisPoints === 0);

const MAX_REV_SHARE_RECIPIENTS = 100;

type SplitEditorValidationReason =
  | 'empty'
  | 'invalid-basis-points'
  | 'recipient-zero'
  | 'recipient-limit'
  | 'total';

export const validateSplitEditorAllocations = (allocations: readonly SplitEditorAllocation[]) => {
  const totalBasisPoints = allocations.reduce(
    (total, allocation) => total + allocation.splitBasisPoints,
    0,
  );

  let reason: SplitEditorValidationReason | null = null;
  if (allocations.length === 0) {
    reason = 'empty';
  } else if (
    allocations.some(
      ({ splitBasisPoints }) =>
        !Number.isSafeInteger(splitBasisPoints) ||
        splitBasisPoints < 0 ||
        splitBasisPoints > REV_SHARE_TOTAL_BASIS_POINTS,
    )
  ) {
    reason = 'invalid-basis-points';
  } else if (
    allocations.some(({ splitBasisPoints, isOwner }) => !isOwner && splitBasisPoints === 0)
  ) {
    reason = 'recipient-zero';
  } else {
    const recipientCount = allocations.filter(
      ({ splitBasisPoints, isOwner }) => !isOwner && splitBasisPoints > 0,
    ).length;
    if (recipientCount > MAX_REV_SHARE_RECIPIENTS) {
      reason = 'recipient-limit';
    } else if (totalBasisPoints !== REV_SHARE_TOTAL_BASIS_POINTS) {
      reason = 'total';
    }
  }

  return {
    isValid: reason === null,
    totalBasisPoints,
    reason,
  };
};

export type SplitEditorRow = {
  key: string;
  id: string;
  name: string;
  subtitle?: string;
  type: RevShareRecipientType;
  identity?: {
    target: ThumbnailWithNamesProps['target'];
    targetType: CreatorType;
  };
  previousBasisPoints: number | null;
  basisPoints: number;
  disabled?: boolean;
  isOwner?: boolean;
  isNew?: boolean;
  isRemoved?: boolean;
  fieldInvalid?: boolean;
  fieldErrorMessage?: string;
};

export const rebalanceSplitEditorOwnerBasisPoints = (
  rows: readonly SplitEditorRow[],
): SplitEditorRow[] => {
  const recipientTotal = rows
    .filter((row) => !row.isOwner && !row.isRemoved)
    .reduce((total, row) => total + row.basisPoints, 0);
  const ownerBasisPoints = REV_SHARE_TOTAL_BASIS_POINTS - recipientTotal;
  return rows.map((row) => (row.isOwner ? { ...row, basisPoints: ownerBasisPoints } : row));
};

export const splitEditorRowsToRecipientAllocations = (
  rows: readonly SplitEditorRow[],
): RevShareRecipientAllocation[] =>
  rows
    .filter((row) => !row.isOwner && !row.isRemoved)
    .map((row) => ({
      recipient: { type: row.type, id: row.id },
      splitBasisPoints: row.basisPoints,
    }));

export const orderSplitEditorDisplayRows = (rows: readonly SplitEditorRow[]): SplitEditorRow[] => {
  const ownerRows: SplitEditorRow[] = [];
  const newRows: SplitEditorRow[] = [];
  const existingRows: SplitEditorRow[] = [];

  for (const row of rows) {
    if (row.isRemoved) {
      continue;
    }
    if (row.isOwner) {
      ownerRows.push(row);
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

  return [...ownerRows, ...newRows, ...existingRows];
};

export const decorateSplitEditorFieldErrors = (
  orderedRows: readonly SplitEditorRow[],
  invalidRecipientShareMessage: string,
): SplitEditorRow[] =>
  orderedRows.map((row) => {
    const fieldInvalid = isSplitEditorAllocationInvalid({
      splitBasisPoints: row.basisPoints,
      isOwner: row.isOwner,
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
  removeAriaLabel: string;
  onSplitChange?: (key: string, newBasisPoints: number) => void;
  onSplitValidityChange?: (key: string, isValid: boolean) => void;
  onRemove?: (key: string) => void;
};

const SPLIT_VALUE_COLUMN_CLASS = 'width-3000 min-width-3000';
const TABLE_COLUMN_COUNT = 4;

const SplitEditorTableRow: FunctionComponent<SplitEditorTableRowProps> = ({
  row,
  removeAriaLabel,
  onSplitChange,
  onSplitValidityChange,
  onRemove,
}) => {
  const previousSplitId = useId();

  return (
    <TableRow>
      <TableCell className='padding-y-small'>
        <div className='flex items-center gap-large'>
          {row.identity ? (
            <ThumbnailWithNames
              target={row.identity.target}
              targetType={row.identity.targetType}
              label={row.subtitle}
              variant='compact'
              disableLink
            />
          ) : (
            <ThumbnailWithNames
              target={{ id: asNumberTypedId(row.id) }}
              targetType={
                row.type === RevShareRecipientType.User ? CreatorType.User : CreatorType.Group
              }
              displayNameOverride={row.name}
              label={row.subtitle}
              variant='compact'
              disableLink
            />
          )}
        </div>
      </TableCell>
      <TableCell
        align='center'
        aria-labelledby={previousSplitId}
        className={`padding-y-small ${SPLIT_VALUE_COLUMN_CLASS}`}>
        <div className='flex items-center justify-center width-full'>
          <div className='flex items-center justify-center [width:80px]'>
            <span id={previousSplitId} className='text-body-medium content-muted'>
              {row.previousBasisPoints !== null
                ? `${formatBasisPoints(row.previousBasisPoints)}%`
                : '—'}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell align='center' className={`padding-y-small ${SPLIT_VALUE_COLUMN_CLASS}`}>
        <div className='flex items-center justify-center width-full'>
          <div className='flex items-center justify-center [width:80px]'>
            <SplitPercentCell
              row={row}
              onSplitChange={onSplitChange}
              onSplitValidityChange={onSplitValidityChange}
            />
          </div>
        </div>
      </TableCell>
      <TableCell align='center' className='padding-y-small padding-right-none'>
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
      <caption className='[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,0,0,0)] text-no-wrap [border:0]'>
        {tableLabel}
      </caption>
      <TableHead>
        <TableRow>
          <TableCell className='text-label-small content-muted text-align-x-left padding-bottom-small'>
            {partyHeading}
          </TableCell>
          <TableCell
            align='center'
            className={`text-label-small content-muted text-align-x-center padding-bottom-small ${SPLIT_VALUE_COLUMN_CLASS}`}>
            <div className='flex items-center justify-center width-full'>{previousHeading}</div>
          </TableCell>
          <TableCell
            align='center'
            className={`text-label-small content-muted text-align-x-center padding-bottom-small ${SPLIT_VALUE_COLUMN_CLASS}`}>
            <div className='flex items-center justify-center width-full'>{splitHeading}</div>
          </TableCell>
          <TableCell aria-hidden className='padding-bottom-small padding-right-none' />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMN_COUNT}
              className='text-body-medium content-muted padding-y-medium'>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <SplitEditorTableRow
              key={row.key}
              row={row}
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
