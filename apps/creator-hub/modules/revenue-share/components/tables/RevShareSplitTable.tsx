import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ThumbnailWithNames, {
  type ThumbnailWithNamesProps,
} from '@modules/miscellaneous/components/ThumbnailWithNames';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import { formatBasisPoints } from '../../utils/revShareUtils';

// Renders the current revenue share allocation as a table.
const TABLE_COLUMN_COUNT = 2;

type RevShareSplitIdentity = {
  target: ThumbnailWithNamesProps['target'];
  targetType: ThumbnailWithNamesProps['targetType'];
};

export type RevShareSplitRowData = {
  id: string;
  name: string;
  subtitle?: string;
  identity?: RevShareSplitIdentity;
  basisPoints: number;
  color: string;
};

type RevShareSplitTableProps = {
  rows: readonly RevShareSplitRowData[];
  accessibleLabel?: string;
  emptyMessage?: string;
};

const RevShareSplitTable: FunctionComponent<RevShareSplitTableProps> = ({
  rows,
  accessibleLabel,
  emptyMessage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const tableLabel =
    accessibleLabel ??
    tPendingTranslation(
      'Revenue share split',
      'Accessible caption for the table of parties in a revenue share agreement.',
      translationKey('Label.SplitTable', TranslationNamespace.RevenueShareAgreements),
    );
  const resolvedEmptyMessage =
    emptyMessage ??
    tPendingTranslation(
      'No parties in this revenue share split.',
      'Empty state for a revenue share agreement split table with no parties.',
      translationKey('Message.NoSplitParties', TranslationNamespace.RevenueShareAgreements),
    );

  return (
    <TableBase borderless>
      <caption className='[position:absolute] [width:1px] [height:1px] [padding:0] [margin:-1px] [overflow:hidden] [clip:rect(0,0,0,0)] text-no-wrap [border:0]'>
        {tableLabel}
      </caption>
      <TableHead>
        <TableRow>
          <TableCell className='text-label-small content-muted text-align-x-left padding-bottom-small'>
            {tPendingTranslation(
              'Party',
              'Column heading for a party receiving a revenue share.',
              translationKey('Label.Party', TranslationNamespace.RevenueShareAgreements),
            )}
          </TableCell>
          <TableCell
            align='right'
            className='text-label-small content-muted text-align-x-right padding-bottom-small'>
            {tPendingTranslation(
              'Split',
              'Column heading for a party percentage in a revenue share.',
              translationKey('Label.Split', TranslationNamespace.RevenueShareAgreements),
            )}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMN_COUNT}
              className='text-body-medium content-muted padding-y-medium'>
              {resolvedEmptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className='padding-y-small'>
                <div className='flex items-center gap-large'>
                  <div
                    className='[width:4px] shrink-0 [height:32px] radius-small'
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  {row.identity ? (
                    <ThumbnailWithNames
                      target={row.identity.target}
                      targetType={row.identity.targetType}
                      label={row.subtitle}
                      variant='compact'
                      disableLink
                    />
                  ) : (
                    <div className='flex items-center gap-medium min-width-0'>
                      <div
                        className='width-1000 height-1000 radius-medium shrink-0'
                        style={{ backgroundColor: row.color }}
                        aria-hidden
                      />
                      <span className='text-body-medium content-emphasis text-no-wrap [overflow:hidden] [text-overflow:ellipsis]'>
                        {row.name}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell align='right' className='padding-y-small'>
                <span className='text-body-medium content-emphasis [font-weight:600]'>
                  {`${formatBasisPoints(row.basisPoints)}%`}
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableBase>
  );
};

export default RevShareSplitTable;
