import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Badge, Icon, TableCell, VisuallyHidden } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TransactionRecord } from '@modules/clients/transactionRecords';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate, formatTime, parseDateOrNull } from '@modules/miscellaneous/utils/dateUtils';
import {
  getTransactionStatus,
  isCanceledHold,
  VirtualColumnType,
  VirtualTransactionStatus,
} from '../constants/VirtualTableInfo';
import VirtualSourceCell from './VirtualSourceCell';
import VirtualTypeCell from './VirtualTypeCell';

export type VirtualTransactionCellProps = {
  columnType: VirtualColumnType;
  record: TransactionRecord;
  // Pre-resolved counterparty display name (batched by the table), used by the Source column.
  counterPartyName?: string;
};

const VirtualTransactionCell: FunctionComponent<
  React.PropsWithChildren<VirtualTransactionCellProps>
> = ({ columnType, record, counterPartyName }) => {
  const { locale } = useLocalization();
  const { translate } = useTranslationWrapper(useTranslation());

  const content: React.JSX.Element | string | null = useMemo(() => {
    // Locale.SimplifiedChineseJV ('zh-CJV') is a Roblox-internal tag that Intl rejects with a
    // RangeError; fold it into standard Simplified Chinese before any Intl-backed formatting.
    const resolvedLocale =
      locale === Locale.SimplifiedChineseJV ? Locale.SimplifiedChinese : (locale ?? Locale.English);
    switch (columnType) {
      case VirtualColumnType.Date: {
        // A malformed createdTime would reach the formatter as an Invalid Date and throw; treat
        // anything unparseable the same as a missing date.
        const parsedDate = record.createdTime ? parseDateOrNull(record.createdTime) : null;
        if (!parsedDate) {
          return translate(translationKey('Label.UnknownDate', TranslationNamespace.Transactions));
        }
        return (
          <span className='flex flex-col gap-xxsmall'>
            <span className='text-body-medium content-default'>
              {formatDate(parsedDate, resolvedLocale)}
            </span>
            <span className='text-body-medium content-default'>
              {formatTime(parsedDate, resolvedLocale)}
            </span>
          </span>
        );
      }

      case VirtualColumnType.TransactionType:
        return <VirtualTypeCell record={record} />;

      case VirtualColumnType.Source:
        return <VirtualSourceCell counterParty={record.counterParty} name={counterPartyName} />;

      case VirtualColumnType.Status: {
        // Pending / Paid / Refunded, matching the exported V2 sales report (see getTransactionStatus).
        const status = getTransactionStatus(record.holdStatus, record.amount);
        if (status === VirtualTransactionStatus.Refunded) {
          return (
            <Badge
              variant='Alert'
              label={translate(translationKey('Label.Refund', TranslationNamespace.Transactions))}
            />
          );
        }
        if (status === VirtualTransactionStatus.Paid) {
          return (
            <Badge
              variant='Neutral'
              label={translate(translationKey('Label.Paid', TranslationNamespace.Transactions))}
            />
          );
        }
        return (
          <Badge
            variant='Contrast'
            label={translate(translationKey('Label.Pending', TranslationNamespace.Transactions))}
          />
        );
      }

      case VirtualColumnType.Amount: {
        // A cancelled hold never paid out, so there's no amount to show.
        if (isCanceledHold(record.holdStatus)) {
          return '—';
        }
        const raw = record.amount ?? '';
        const amount = Number(raw);
        if (raw === '' || Number.isNaN(amount)) {
          return raw;
        }
        // A zero payout shouldn't occur here (a real sale/refund is always non-zero); guard
        // defensively so bad data renders as "—" rather than a misleading "+0".
        if (amount === 0) {
          return '—';
        }
        // Positive amounts are inflows (revenue), negative are outflows (spend).
        const sign = amount < 0 ? '−' : '+';
        // Foundation Icon renders as presentational, so an aria-label on it is not reliably exposed.
        // Convey the currency with visually-hidden translated text after the value instead, so the
        // amount is announced as e.g. "+100 Robux" rather than a bare number.
        return (
          <span className='flex items-center justify-end gap-xxsmall text-no-wrap'>
            {sign}
            <Icon name='icon-filled-robux' size='Small' aria-hidden />
            {Math.abs(amount).toLocaleString(resolvedLocale)}
            <VisuallyHidden>
              {translate(translationKey('Label.Robux', TranslationNamespace.Transactions))}
            </VisuallyHidden>
          </span>
        );
      }

      default:
        return null;
    }
  }, [columnType, record, counterPartyName, locale, translate]);

  return (
    <TableCell
      align={columnType === VirtualColumnType.Amount ? 'end' : undefined}
      className='padding-y-large'>
      {content}
    </TableCell>
  );
};

export default VirtualTransactionCell;
