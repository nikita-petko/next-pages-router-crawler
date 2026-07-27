import type { FunctionComponent } from 'react';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import { asNumberTypedId, asSafeBasisPoints, formatBasisPoints } from '../../utils/revShareUtils';
import RevShareThumbnailWithNames, {
  type RevShareThumbnailWithNamesProps,
} from '../RevShareThumbnailWithNames';
import { RevShareManagingGroupIcon } from './RevShareManagingGroupIcon';
import { RevShareMeIcon } from './RevShareMeIcon';

// Renders the current revenue share allocation as a table.
const REV_SHARE_SPLIT_TABLE_COLUMN_COUNT = 4;
const PARTY_COLUMN_CLASS =
  '[width:calc(var(--size-3000)*2)] [min-width:calc(var(--size-3000)*2)] [max-width:calc(var(--size-3000)*2)]';
// RevShareThumbnailWithNames truncation hack for the fixed party column.
const PARTY_IDENTITY_CLASS =
  'min-width-0 max-width-full clip [&_*]:min-width-0 [&_*]:max-width-full';
const MANAGING_GROUP_COLUMN_CLASS = 'width-600 min-width-600 max-width-600';
const FLEX_SPACER_COLUMN_CLASS = 'min-width-400';
const SPLIT_VALUE_COLUMN_CLASS = 'width-2200 min-width-2200 max-width-2200';
const DECORATIVE_CELL_CLASS = 'padding-none';

type RevShareSplitIdentity = {
  target: RevShareThumbnailWithNamesProps['target'];
  targetType: RevShareThumbnailWithNamesProps['targetType'];
};

export type RevShareSplitRowData = {
  id: string;
  name: string;
  subtitle?: string;
  identity?: RevShareSplitIdentity;
  basisPoints: number;
  color: string;
  isManagingGroup?: boolean;
  isCurrentUser?: boolean;
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
  const currentUserHeading = tPendingTranslation(
    'You',
    'Label for the current recipient in a revenue-share split.',
    translationKey('Label.You', TranslationNamespace.RevenueShareAgreements),
  );
  const splitHeading = tPendingTranslation(
    'Active split',
    'Column heading for a party percentage in the active revenue share.',
    translationKey('Label.ActiveSplit', TranslationNamespace.RevenueShareAgreements),
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
            className={`text-label-small content-muted text-align-x-right padding-bottom-small padding-left-xsmall padding-right-medium ${SPLIT_VALUE_COLUMN_CLASS}`}>
            <div className='flex items-center justify-end width-full text-no-wrap'>
              {splitHeading}
            </div>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={REV_SHARE_SPLIT_TABLE_COLUMN_COUNT}
              className='text-body-medium content-muted padding-y-medium'>
              {resolvedEmptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className={`padding-y-small ${PARTY_COLUMN_CLASS}`}>
                <div className='flex items-center gap-large min-width-0'>
                  <div
                    className='width-100 shrink-0 height-800 radius-small'
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  />
                  <div className={PARTY_IDENTITY_CLASS}>
                    {row.identity ? (
                      <RevShareThumbnailWithNames
                        target={row.identity.target}
                        targetType={row.identity.targetType}
                        label={row.isManagingGroup ? undefined : row.subtitle}
                        variant='compact'
                        disableLink
                      />
                    ) : (
                      <RevShareThumbnailWithNames
                        target={{ id: asNumberTypedId(row.id) }}
                        targetType={CreatorType.Group}
                        displayNameOverride={row.name}
                        thumbnailColorOverride={row.color}
                        variant='compact'
                        disableLink
                        hideSecondaryLabel
                      />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell
                align='center'
                className={`padding-y-small padding-x-xsmall ${MANAGING_GROUP_COLUMN_CLASS}`}>
                <div className='flex items-center justify-center width-full'>
                  {row.isManagingGroup ? (
                    <RevShareManagingGroupIcon ariaLabel={managingGroupHeading} />
                  ) : row.isCurrentUser ? (
                    <RevShareMeIcon ariaLabel={currentUserHeading} />
                  ) : null}
                </div>
              </TableCell>
              <TableCell aria-hidden className={DECORATIVE_CELL_CLASS} />
              <TableCell
                align='right'
                className={`padding-y-small padding-left-xsmall padding-right-medium text-align-x-right ${SPLIT_VALUE_COLUMN_CLASS}`}>
                <div className='flex items-center justify-end width-full'>
                  <span className='text-body-medium content-emphasis [font-weight:600] text-no-wrap'>
                    {`${formatBasisPoints(asSafeBasisPoints(row.basisPoints))}%`}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableBase>
  );
};

export default RevShareSplitTable;
