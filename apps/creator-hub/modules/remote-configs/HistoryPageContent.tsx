import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import { analyticsConfigsHistoryNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import ExperienceAnalyticsPageDateRangeControl from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import GenericFullAnalyticsPageLayout from '@modules/experience-analytics-shared/layout/GenericFullAnalyticsPageLayout';
import { Link } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { SortKey, SortOrder } from './api/universeConfigsClientEnums';
import type { ValidChangelogEntry, ValidSortKey, ValidSortOrder } from './api/validTypes';
import HistoryTable from './components/history-table/HistoryTable';
import type { RestoreDialogResult } from './components/history-table/RestoreDialog';
import RestoreDialog from './components/history-table/RestoreDialog';
import { SearchKeyProvider } from './components/history-table/SearchKeyContext';
import useHistoryPageBundle from './hooks/useHistoryPageBundle';

const configsDocLink: AnalyticsDocLink = '/docs/production/configs';

const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={configsDocLink} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};

const HistoryPageContent = () => {
  const {
    changelogEntries,
    conditionOrder,
    changelogsRequestState,
    sort,
    setSort,
    searchKey,
    handleSearchChange,
    refreshChangelogs,
    pagination,
  } = useHistoryPageBundle();
  const router = useRouter();
  const { id: universeId } = useUniverseResource();

  // Read configVersion from URL for deep linking from annotations
  const [queryParams] = useQueryParams([AnalyticsQueryParams.ConfigVersion]);
  const configVersionQueryParam = queryParams[AnalyticsQueryParams.ConfigVersion];
  const highlightVersion = useMemo(() => {
    if (typeof configVersionQueryParam === 'string') {
      const parsed = parseInt(configVersionQueryParam, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, [configVersionQueryParam]);
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const title = useMemo(
    () => <AnalyticsPageTitle text={translate(analyticsConfigsHistoryNavigationItem.title)} />,
    [translate],
  );
  const description = useMemo(
    () => (
      <AnalyticsPageDescription
        text={translateHTML(
          translationKey(
            'Description.Page.Configs',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: makeTakeActionLink,
            },
          ],
        )}
      />
    ),
    [translateHTML],
  );

  const searchKeyInput = useMemo(() => {
    return (
      <DebouncedTextField
        label={translate(
          translationKey(
            'Table.Label.SearchKey',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
        id='search-key-input'
        onDebouncedChange={handleSearchChange}
        debounceTime={300}
        value={searchKey}
        inputProps={{
          'data-testid': 'search-key-input',
        }}
      />
    );
  }, [searchKey, handleSearchChange, translate]);

  const controls = useMemo(() => {
    return [<ExperienceAnalyticsPageDateRangeControl key='date' />];
  }, []);

  const rightSideControls = useMemo(() => {
    return [searchKeyInput];
  }, [searchKeyInput]);

  const tableSort = useMemo(() => {
    return {
      key: sort?.key || SortKey.LastModifiedTime,
      order: sort?.order || SortOrder.Descending,
      onChange: (key: ValidSortKey, order: ValidSortOrder) => {
        setSort({ key, order });
      },
    };
  }, [sort, setSort]);

  const [pendingEntryToRestore, setPendingEntryToRestore] = useState<ValidChangelogEntry | null>(
    null,
  );
  const onRestoreDialogClose = useCallback(
    (result: RestoreDialogResult) => {
      setPendingEntryToRestore(null);
      // restore succeded
      if (result) {
        refreshChangelogs();
        void router.push(creatorHub.dashboard.getAnalyticsConfigsUrl(universeId));
      }
    },
    [refreshChangelogs, router, universeId],
  );

  return (
    <GenericFullAnalyticsPageLayout
      title={title}
      description={description}
      controls={controls}
      rightSideControls={rightSideControls}>
      <Grid item XSmall={12}>
        <SearchKeyProvider searchKey={searchKey}>
          <HistoryTable
            changelogEntries={changelogEntries}
            conditionOrder={conditionOrder}
            sort={tableSort}
            {...changelogsRequestState}
            onRestoreButtonClick={setPendingEntryToRestore}
            pagination={pagination}
            highlightVersion={highlightVersion}
          />
          <RestoreDialog
            pendingEntryToRestore={pendingEntryToRestore}
            onClose={onRestoreDialogClose}
          />
        </SearchKeyProvider>
      </Grid>
    </GenericFullAnalyticsPageLayout>
  );
};

export default withTranslation(HistoryPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Navigation,
]);
