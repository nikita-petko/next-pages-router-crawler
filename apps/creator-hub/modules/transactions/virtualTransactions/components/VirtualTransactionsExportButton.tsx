import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { IconButton, Tooltip, TooltipTrigger, VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { CurrencyHolderType } from '@modules/clients/transactionRecords';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getLocalDateString } from '@modules/miscellaneous/utils/dateUtils';
import { useSnackbar } from '@modules/monetization-shared/snackbar/actions';
import { usePublishSalesReportDownload } from '@modules/react-query/transactionRecords/transactionRecordsQueries';

// Mirrors transaction-records' SalesReportDownloadV2MaxDateRange: the export endpoint rejects
// ranges longer than this many days, so block the request client-side and explain why.
const MAX_EXPORT_RANGE_DAYS = 365;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole calendar days between two timestamps. Comparing the UTC midnights of each timestamp's local
// Y/M/D — rather than dividing raw elapsed milliseconds — keeps the count exact across DST
// transitions (a spring-forward day is only 23h of elapsed time but is still one calendar day), and
// matches how the server compares the day-granular start/end dates it receives.
export const calendarDaysBetween = (startMillis: number, endMillis: number): number => {
  const start = new Date(startMillis);
  const end = new Date(endMillis);
  const startMidnightUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnightUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endMidnightUtc - startMidnightUtc) / MILLIS_PER_DAY);
};

export type VirtualTransactionsExportButtonProps = {
  // Exactly one of userId / groupId identifies the virtual. groupId takes precedence.
  userId?: number;
  groupId?: number;
  startTimeMillis: number;
  endTimeMillis: number;
};

// Queues an async virtual sales report for the current virtual + date range via the
// same endpoint the personal "my transactions" page uses.
const VirtualTransactionsExportButton: FunctionComponent<
  React.PropsWithChildren<VirtualTransactionsExportButtonProps>
> = ({ userId, groupId, startTimeMillis, endTimeMillis }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { enqueue } = useSnackbar();
  const { mutate, isPending } = usePublishSalesReportDownload();

  const targetId = groupId ?? userId;
  const targetType = groupId ? CurrencyHolderType.Group : CurrencyHolderType.User;

  const rangeDays = calendarDaysBetween(startTimeMillis, endTimeMillis);
  const exceedsMaxRange = rangeDays > MAX_EXPORT_RANGE_DAYS;

  // The Foundation snackbar is single-style (no severity); the message text conveys the outcome,
  // matching every other creator-hub caller of the shared snackbar.
  const notify = useCallback(
    (message: string) => {
      enqueue({ title: message });
    },
    [enqueue],
  );

  const onExport = useCallback(() => {
    if (targetId == null || exceedsMaxRange) {
      return;
    }
    mutate(
      {
        targetId,
        targetType,
        // Local Y/M/D so the exported window matches the calendar days the user picked
        // (getUTCDateString would roll ±1 day for non-UTC timezones).
        startDate: getLocalDateString(new Date(startTimeMillis)),
        endDate: getLocalDateString(new Date(endTimeMillis)),
      },
      {
        onSuccess: () =>
          notify(
            translate(translationKey('Message.ExportRequested', TranslationNamespace.Transactions)),
          ),
        onError: (error) => {
          const status = getResponseFromError(error)?.status;
          if (status === 403) {
            // The viewer lacks ViewGroupTransactions for this group.
            notify(
              translate(
                translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics),
              ),
            );
          } else if (status === 409) {
            // An equivalent report is already being generated — an expected state, not an error.
            notify(
              translate(
                translationKey(
                  'Message.ExportAlreadyInProgress',
                  TranslationNamespace.Transactions,
                ),
              ),
            );
          } else if (status === 429) {
            // Transient rate limiting — tell the user to wait rather than surfacing a generic error.
            notify(
              translate(translationKey('Message.RateLimited', TranslationNamespace.Transactions)),
            );
          } else {
            notify(translate(translationKey('Response.UnknownError', TranslationNamespace.Error)));
          }
        },
      },
    );
  }, [
    mutate,
    notify,
    translate,
    targetId,
    targetType,
    startTimeMillis,
    endTimeMillis,
    exceedsMaxRange,
  ]);

  const label = translate(translationKey('Action.Export', TranslationNamespace.Transactions));

  const rangeTooLongLabel = translate(
    translationKey('Message.ExportRangeTooLong', TranslationNamespace.Transactions),
    { maxDays: String(MAX_EXPORT_RANGE_DAYS) },
  );

  return (
    <>
      <Tooltip position='left-center' title={exceedsMaxRange ? rangeTooLongLabel : label}>
        {/* Span wrapper so the tooltip still shows while the button is disabled (disabled controls
            don't emit the pointer events the trigger listens for otherwise). */}
        <TooltipTrigger asChild>
          <span>
            <IconButton
              icon='icon-regular-arrow-down-to-line'
              ariaLabel={label}
              // Utility = transparent (ghost) fill, matching the design.
              variant='Utility'
              size='Medium'
              isDisabled={isPending || targetId == null || exceedsMaxRange}
              onClick={onExport}
            />
          </span>
        </TooltipTrigger>
      </Tooltip>
      {/* The disabled button can't receive focus, so the tooltip reason is unreachable by keyboard/
          screen reader. Expose the same reason as a persistent visually-hidden description. */}
      {exceedsMaxRange && <VisuallyHidden>{rangeTooLongLabel}</VisuallyHidden>}
    </>
  );
};

export default VirtualTransactionsExportButton;
