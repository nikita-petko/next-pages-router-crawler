import React, { useCallback, useMemo, useState } from 'react';
import {
  TranslationKey,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import {
  AnalyticsDocLink,
  AnalyticsPageDescription,
  AnalyticsPageTitle,
  analyticsExperimentsNavigationItem,
  DebouncedTextField,
} from '@modules/charts-generic';
import {
  ExperienceAnalyticsPageControl,
  GenericFullAnalyticsPageLayout,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Container, Grid, Link, makeStyles, Tab, Tabs } from '@rbx/ui';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { ExperimentState, SortKey, SortOrder } from '../../api/universeExperimentationClientEnums';
import useExperimentsList from '../hooks/useExperimentsList';
import EmptyExperimentsCard from '../components/EmptyExperimentsCard';
import ExperimentsSummaryTable from '../components/ExperimentsSummaryTable';
import ToExperimentCreateOrEditPageButton from '../components/ToExperimentCreateOrEditPageButton';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';

const experimentsDocLink: AnalyticsDocLink = '/docs/production/experiments';
const pageControls: Array<ExperienceAnalyticsPageControl> = [];

const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={experimentsDocLink} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};

enum ExperimentsTableTab {
  All = 'all',
  Active = 'active',
  Drafts = 'drafts',
  Completed = 'completed',
}

const orderedTabs = [
  ExperimentsTableTab.All,
  ExperimentsTableTab.Active,
  ExperimentsTableTab.Drafts,
  ExperimentsTableTab.Completed,
] as const;

const TabInfo: Record<
  ExperimentsTableTab,
  { labelKey: TranslationKey; stateFilters?: Array<ExperimentState> }
> = {
  [ExperimentsTableTab.All]: {
    labelKey: translationKey(
      'Table.Title.AllExperiments',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  },
  [ExperimentsTableTab.Active]: {
    labelKey: translationKey(
      'Table.Title.ActiveExperiments',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    stateFilters: [ExperimentState.Scheduled, ExperimentState.Running],
  },
  [ExperimentsTableTab.Drafts]: {
    labelKey: translationKey(
      'Table.Title.Drafts',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    stateFilters: [ExperimentState.Draft],
  },
  [ExperimentsTableTab.Completed]: {
    labelKey: translationKey(
      'Table.Title.Completed',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    stateFilters: [ExperimentState.Completed],
  },
};

const useStyles = makeStyles()((theme) => ({
  tabsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0px',
    marginLeft: 0,
    borderBottom: `1px solid ${theme.palette.components.divider}`,
  },
  tableSpan: {
    width: '100%',
  },
}));

const ExperimentsPageContent = () => {
  const {
    classes: { tabsContainer, tableSpan },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { completeExperiment, discardExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const [selectedTab, setSelectedTab] = useState(ExperimentsTableTab.All);
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: ExperimentsTableTab) => {
      setSelectedTab(newValue);
    },
    [],
  );

  const [searchKey, setSearchKey] = useState<string | undefined>();
  const [sort, setSort] = useState<{ key: SortKey; order: SortOrder }>({
    key: SortKey.Relevance,
    order: SortOrder.Descending,
  });
  const tableSort = useMemo(() => {
    return {
      key: sort.key,
      order: sort.order,
      onChange: (key: SortKey, order: SortOrder) => {
        setSort({ key, order });
      },
    };
  }, [sort, setSort]);

  // fetch experiments without type filter to determine if there's any experiments at all
  const {
    experimentsRequestState: allExperimentsRequestState,
    pagination: allExperimentsPagination,
  } = useExperimentsList();
  const hasNoExperiments = allExperimentsPagination.tablePagination.total === 0;

  const title = useMemo(
    () => <AnalyticsPageTitle text={translate(analyticsExperimentsNavigationItem.title)} />,
    [translate],
  );
  const description = useMemo(
    () => (
      <AnalyticsPageDescription
        text={translateHTML(
          translationKey(
            'Description.Page.Experiments',
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

  const controls = useMemo(() => {
    if (hasNoExperiments) {
      return null;
    }

    return (
      <Grid container justifyContent='space-between' direction='row' alignItems='center'>
        <Grid item>
          <Grid container direction='row'>
            <ToExperimentCreateOrEditPageButton
              label={translate(
                translationKey(
                  'Label.CreateExperiment',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              size='large'
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }, [hasNoExperiments, translate]);

  const tabs = useMemo(() => {
    if (hasNoExperiments) {
      return null;
    }

    return (
      <Container disableGutters maxWidth={false} classes={{ root: tabsContainer }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons={false}>
          {orderedTabs.map((tab) => (
            <Tab key={tab} label={translate(TabInfo[tab].labelKey)} value={tab} />
          ))}
        </Tabs>
        <DebouncedTextField
          id='table-key-search'
          label={translate(
            translationKey(
              'Table.Label.SearchKey',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
          value={searchKey}
          onDebouncedChange={setSearchKey}
          size='small'
          variant='outlined'
        />
      </Container>
    );
  }, [handleTabChange, hasNoExperiments, searchKey, selectedTab, tabsContainer, translate]);

  const experimentsBodyContent = useMemo(() => {
    if (hasNoExperiments) {
      return <EmptyExperimentsCard />;
    }

    return (
      <span className={tableSpan}>
        <ExperimentsSummaryTable
          searchKey={searchKey}
          stateFilters={TabInfo[selectedTab].stateFilters}
          sort={tableSort}
          completeExperiment={completeExperiment}
          discardExperiment={discardExperiment}
          getExperimentOperationStatus={getExperimentOperationStatus}
        />
      </span>
    );
  }, [
    completeExperiment,
    discardExperiment,
    getExperimentOperationStatus,
    hasNoExperiments,
    searchKey,
    selectedTab,
    tableSort,
    tableSpan,
  ]);

  if (allExperimentsRequestState.isUserForbidden) {
    return <AccessDeniedPage />;
  }

  return (
    <GenericFullAnalyticsPageLayout
      isLoading={allExperimentsRequestState.isDataLoading}
      controls={pageControls}
      description={description}
      title={title}>
      <Grid container item display='flex' flexDirection='column'>
        {controls}
        {tabs}
        {experimentsBodyContent}
      </Grid>
    </GenericFullAnalyticsPageLayout>
  );
};

export default withTranslation(ExperimentsPageContent, [
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Navigation,
]);
