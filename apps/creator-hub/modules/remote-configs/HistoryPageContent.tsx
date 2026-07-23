import {
  ExperienceAnalyticsPageDateRangeControl,
  useRAQIV2TranslationDependencies,
  GenericFullAnalyticsPageLayout,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import React, { useCallback, useMemo, useState } from 'react';
import {
  AnalyticsPageDescription,
  AnalyticsDocLink,
  AnalyticsPageTitle,
  analyticsConfigsHistoryNavigationItem,
  AnalyticsQueryParams,
  DebouncedTextField,
} from '@modules/charts-generic';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link, urls } from '@modules/miscellaneous/common';
import { Grid } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import useHistoryPageBundle from './hooks/useHistoryPageBundle';
import { SearchKeyProvider } from './components/history-table/SearchKeyContext';
import { SortKey, SortOrder } from './api/universeConfigsClientEnums';
import { ValidChangelogEntry, ValidSortKey, ValidSortOrder } from './api/validTypes';
import RestoreDialog, { RestoreDialogResult } from './components/history-table/RestoreDialog';
import HistoryTable from './components/history-table/HistoryTable';

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
        label='Search Key'
        id='search-key-input'
        onDebouncedChange={handleSearchChange}
        debounceTime={300}
        value={searchKey}
        inputProps={{
          'data-testid': 'search-key-input',
        }}
      />
    );
  }, [searchKey, handleSearchChange]);

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
        router.push(urls.creatorHub.dashboard.getAnalyticsConfigsUrl(universeId));
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
