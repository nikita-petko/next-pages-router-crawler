// Renders revenue-share agreement rows with stable ordering, party counts, and target identity cells.
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FunctionComponent,
  type KeyboardEvent,
} from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import {
  RevShareConfirmationStatus,
  RevShareTargetType,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareTarget,
} from '../../interface/RevShareViewModel';
import { formatBasisPoints } from '../../utils/revShareUtils';
import { asNumberTypedId } from '../../utils/revShareUtils';
import RevShareStatusBadge from '../RevShareStatusBadge';

type RevShareLandingTableCommonProps = {
  showHeader?: boolean;
  emptyMessage?: string;
  focusTarget?: RevShareTarget | null;
};

export type RevShareLandingTableProps = RevShareLandingTableCommonProps &
  (
    | {
        mode: 'manager';
        rows: ManagerAgreement[];
        onRowClick?: (row: ManagerAgreement) => void;
      }
    | {
        mode: 'recipient';
        rows: RecipientAgreement[];
        onRowClick?: (row: RecipientAgreement) => void;
      }
  );

type RevShareLandingTableRowProps =
  | {
      mode: 'manager';
      agreement: ManagerAgreement;
      onRowClick?: (row: ManagerAgreement) => void;
      restoreFocus?: boolean;
    }
  | {
      mode: 'recipient';
      agreement: RecipientAgreement;
      onRowClick?: (row: RecipientAgreement) => void;
      restoreFocus?: boolean;
    };

const alignContentClass = (align?: 'center' | 'right') => {
  if (align === 'center') {
    return 'justify-center';
  }
  if (align === 'right') {
    return 'justify-end';
  }
  return '';
};

const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, onActivate: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
};

const partitionPendingFirst = <T,>(rows: readonly T[], isPending: (row: T) => boolean) => {
  const pendingRows: T[] = [];
  const nonPendingRows: T[] = [];

  rows.forEach((row) => {
    (isPending(row) ? pendingRows : nonPendingRows).push(row);
  });

  return [...pendingRows, ...nonPendingRows];
};

const RevShareLandingTableRow: FunctionComponent<RevShareLandingTableRowProps> = (props) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const target = useMemo(
    () => ({ id: asNumberTypedId(props.agreement.target.id) }),
    [props.agreement.target.id],
  );

  // `onRowClick`/`agreement` are only type-correlated while `props` is still narrowed by
  // `mode`, so each branch must read them into its own locals here (not destructured or
  // hoisted above the narrowing check) to stay type-safe without an `as`/`any` cast.
  const onActivate = useMemo(() => {
    if (props.mode === 'manager') {
      const managerOnRowClick = props.onRowClick;
      const managerAgreement = props.agreement;
      return managerOnRowClick ? () => managerOnRowClick(managerAgreement) : undefined;
    }
    const recipientOnRowClick = props.onRowClick;
    const recipientAgreement = props.agreement;
    return recipientOnRowClick ? () => recipientOnRowClick(recipientAgreement) : undefined;
  }, [props.mode, props.onRowClick, props.agreement]);

  const onRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (onActivate) {
        handleRowKeyDown(event, onActivate);
      }
    },
    [onActivate],
  );

  useEffect(() => {
    if (props.restoreFocus) {
      rowRef.current?.focus();
    }
  }, [props.restoreFocus]);

  return (
    <TableRow
      ref={rowRef}
      hover={onActivate != null}
      role={onActivate ? 'button' : undefined}
      tabIndex={onActivate ? 0 : undefined}
      className={onActivate ? 'cursor-pointer' : ''}
      onClick={onActivate}
      onKeyDown={onActivate ? onRowKeyDown : undefined}>
      <TableCell className='padding-x-large padding-y-medium min-width-2400'>
        <ThumbnailWithNames
          target={target}
          targetType={
            props.agreement.target.type === RevShareTargetType.Experience ? 'Experience' : 'Ugc'
          }
          displayNameOverride={props.agreement.targetName}
          variant='compact'
          disableLink
        />
      </TableCell>
      {props.mode === 'manager' && (
        <TableCell
          align='center'
          className='padding-x-large padding-y-medium width-2500 min-width-2500'>
          <div className={`flex items-center width-full ${alignContentClass('center')}`}>
            <span className='text-body-medium content-default'>
              {props.agreement.active.recipients.length > 0
                ? String(props.agreement.active.recipients.length)
                : '-'}
            </span>
          </div>
        </TableCell>
      )}
      <TableCell
        align='center'
        className='padding-x-large padding-y-medium width-2500 min-width-2500'>
        <div className={`flex items-center width-full ${alignContentClass('center')}`}>
          <span className='text-body-medium content-emphasis [font-weight:600]'>
            {`${formatBasisPoints(
              props.mode === 'manager'
                ? props.agreement.active.ownerBasisPoints
                : props.agreement.active.recipientBasisPoints,
            )}%`}
          </span>
        </div>
      </TableCell>
      <TableCell
        align='right'
        className='padding-x-large padding-y-medium [width:190px] [min-width:190px]'>
        <div className={`flex items-center width-full ${alignContentClass('right')}`}>
          <RevShareStatusBadge
            status={
              props.mode === 'manager'
                ? props.agreement.proposed
                  ? RevShareConfirmationStatus.Pending
                  : undefined
                : props.agreement.proposed?.confirmation
            }
          />
        </div>
      </TableCell>
      <TableCell
        align='center'
        className='padding-x-large padding-y-medium width-800 min-width-800'>
        <div className={`flex items-center width-full ${alignContentClass('center')}`}>
          <Icon name='icon-regular-chevron-small-right' size='Medium' aria-hidden />
        </div>
      </TableCell>
    </TableRow>
  );
};

const renderRows = (props: RevShareLandingTableProps) => {
  if (props.mode === 'manager') {
    return partitionPendingFirst(props.rows, (agreement) => agreement.proposed !== null).map(
      (agreement) => (
        <RevShareLandingTableRow
          key={`${agreement.target.type}:${agreement.target.id}`}
          mode='manager'
          agreement={agreement}
          onRowClick={props.onRowClick}
          restoreFocus={
            props.focusTarget?.type === agreement.target.type &&
            props.focusTarget.id === agreement.target.id
          }
        />
      ),
    );
  }

  return partitionPendingFirst(
    props.rows,
    (agreement) => agreement.proposed?.confirmation === RevShareConfirmationStatus.Pending,
  ).map((agreement) => (
    <RevShareLandingTableRow
      key={`${agreement.target.type}:${agreement.target.id}`}
      mode='recipient'
      agreement={agreement}
      onRowClick={props.onRowClick}
    />
  ));
};

const RevShareLandingTable: FunctionComponent<RevShareLandingTableProps> = (props) => {
  const { showHeader = true } = props;
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const emptyMessage =
    props.emptyMessage ??
    tPendingTranslation(
      'No revenue share agreements',
      'Fallback message shown when the revenue share landing table has no rows.',
      translationKey('Message.NoAgreements', TranslationNamespace.RevenueShareAgreements),
    );
  const isManagerMode = props.mode === 'manager';
  const columnCount = isManagerMode ? 5 : 4;

  return (
    <TableBase borderless className='bg-surface-200 radius-medium'>
      {showHeader && (
        <TableHead>
          <TableRow>
            <TableCell className='text-label-small content-muted padding-x-large padding-y-medium min-width-2400'>
              {tPendingTranslation(
                'Resource',
                'Column header for the resource/target name column in the revenue share landing table.',
                translationKey('Label.Resource', TranslationNamespace.RevenueShareAgreements),
              )}
            </TableCell>
            {isManagerMode && (
              <TableCell
                align='center'
                className='text-label-small content-muted padding-x-large padding-y-medium width-2500 min-width-2500'>
                <div className='flex items-center width-full justify-center'>
                  {tPendingTranslation(
                    'Parties',
                    'Column header for the party count column in the revenue share landing table (manager mode).',
                    translationKey('Label.Parties', TranslationNamespace.RevenueShareAgreements),
                  )}
                </div>
              </TableCell>
            )}
            <TableCell
              align='center'
              className='text-label-small content-muted padding-x-large padding-y-medium width-2500 min-width-2500'>
              <div className='flex items-center width-full justify-center'>
                {tPendingTranslation(
                  'Your cut',
                  'Column header for the revenue share percentage column in the revenue share landing table.',
                  translationKey('Label.YourCut', TranslationNamespace.RevenueShareAgreements),
                )}
              </div>
            </TableCell>
            <TableCell
              align='right'
              className='text-label-small content-muted padding-x-large padding-y-medium [width:190px] [min-width:190px]'>
              <div className='flex items-center width-full justify-end'>
                {tPendingTranslation(
                  'Status',
                  'Column header for the agreement status column in the revenue share landing table.',
                  translationKey('Label.Status', TranslationNamespace.RevenueShareAgreements),
                )}
              </div>
            </TableCell>
            <TableCell className='padding-x-large padding-y-medium width-800 min-width-800' />
          </TableRow>
        </TableHead>
      )}

      <TableBody>
        {props.rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className='padding-x-large padding-y-xlarge text-align-x-center'>
              <span className='text-body-medium content-muted'>{emptyMessage}</span>
            </TableCell>
          </TableRow>
        )}
        {renderRows(props)}
      </TableBody>
    </TableBase>
  );
};

export default RevShareLandingTable;
