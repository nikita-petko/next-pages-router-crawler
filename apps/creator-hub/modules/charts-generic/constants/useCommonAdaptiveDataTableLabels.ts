import { useMemo } from 'react';
import type { AdaptiveDataTableLabels } from '@rbx/analytics-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type CommonAdaptiveDataTableLabelOverrides = {
  /** Shown when the table fails to load. Copy differs per table, so there is no shared default. */
  readonly error: FormattedText;
  /** Shown when the table has no rows. Copy differs per table, so there is no shared default. */
  readonly emptyState: FormattedText;
};

/**
 * Supplies shared table chrome labels while callers provide table-specific state copy.
 * Consumers must include `TranslationNamespace.Table` in their translation namespaces.
 */
const useCommonAdaptiveDataTableLabels = ({
  error,
  emptyState,
}: CommonAdaptiveDataTableLabelOverrides): AdaptiveDataTableLabels => {
  const { locale } = useLocalization();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale ?? Locale.English), [locale]);

  return useMemo(
    () => ({
      loading: tPendingTranslation(
        'Loading',
        'Accessible loading label shared across AdaptiveDataTable tables.',
        translationKey('Label.Loading', TranslationNamespace.Table),
      ),
      error,
      emptyState,
      retry: tPendingTranslation(
        'Retry',
        'Accessible action shared across AdaptiveDataTable tables to retry a failed load.',
        translationKey('Action.Retry', TranslationNamespace.Table),
      ),
      previousPage: tPendingTranslation(
        'Previous page',
        'Accessible label shared across AdaptiveDataTable tables for the previous-page button.',
        translationKey('Action.PreviousPage', TranslationNamespace.Table),
      ),
      nextPage: tPendingTranslation(
        'Next page',
        'Accessible label shared across AdaptiveDataTable tables for the next-page button.',
        translationKey('Action.NextPage', TranslationNamespace.Table),
      ),
      page: (pageIndex: number, pageSize: number, totalRowCount = 0) => {
        const start = totalRowCount === 0 ? 0 : pageIndex * pageSize + 1;
        const end = Math.min((pageIndex + 1) * pageSize, totalRowCount);
        return translate(translationKey('Label.PageRange', TranslationNamespace.Table), {
          pageRange: `${numberFormatter.format(start)}-${numberFormatter.format(end)}`,
          totalPageCount: numberFormatter.format(totalRowCount),
        });
      },
      rowsPerPage: translate(translationKey('Label.RowsPerPage', TranslationNamespace.Table)),
    }),
    [emptyState, error, numberFormatter, tPendingTranslation, translate],
  );
};

export default useCommonAdaptiveDataTableLabels;
