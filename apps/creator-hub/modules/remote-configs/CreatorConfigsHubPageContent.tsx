import React, { FC, useCallback, useMemo, useState } from 'react';
import { Button, Grid, makeStyles, Tooltip, Typography } from '@rbx/ui';
import {
  AnalyticsDocLink,
  AnalyticsPageDescription,
  AnalyticsPageTitle,
  analyticsConfigsHistoryNavigationItem,
  analyticsConfigsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  DebouncedTextField,
} from '@modules/charts-generic';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { Link } from '@modules/miscellaneous/common';
import {
  GenericFullAnalyticsPageLayout,
  ExperimentsNUXBanner,
  useShouldShowExperimentsNUXBanner,
} from '@modules/experience-analytics-shared';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { ValidConfigEntryValue, ValidSortKey, ValidSortOrder } from './api/validTypes';
import RemoteConfigMainTable from './components/RemoteConfigMainTable';
import RemoteConfigStagingTable from './components/RemoteConfigStagingTable';
import RemoteConfigDialog from './components/RemoteConfigDialog';
import RemoteConfigNotificationArea from './components/RemoteConfigNotificationArea';
import generateSnippet from './utils/generateSnippet';
import useRemoteConfigsPageBundle from './hooks/useRemoteConfigsPageBundle';
import { SortKey, SortOrder } from './api/universeConfigsClientEnums';
import useRemoteConfigsDialogState from './hooks/useRemoteConfigsDialogState';
import RemoteConfigToast, { RemoteConfigToastState } from './components/RemoteConfigToast';
import useCanConfigureOrPublish from './hooks/useCanConfigureOrPublish';

const configsDocLink: AnalyticsDocLink = '/docs/production/configs';

const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={configsDocLink} target='_blank' underline='none'>
      {chunks}
    </Link>
  );
};
const makeTakeActionLinkUnderlined = (chunks: React.ReactNode) => {
  return (
    <Link href={configsDocLink} target='_blank' underline='always' color='inherit'>
      {chunks}
    </Link>
  );
};

const useStyles = makeStyles<void, 'tab'>()((theme, _params, classes) => ({
  mainTableControlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  tabs: {
    [`& .${classes.tab}`]: {
      textTransform: 'none', // MUI Tab auto capitalizes text, so we need to override it
    },
  },
  tab: {},
  sidePadding: {
    [theme.breakpoints.down('Medium')]: {
      padding: theme.spacing(0, 2, 2),
    },
  },
  button: {
    margin: '12px 12px 12px 0',
  },
}));

type CreatorConfigsHubPageContentProps = {
  withDraftHashValidation?: boolean;
};

const CreatorConfigsHubPageContent: FC<CreatorConfigsHubPageContentProps> = ({
  withDraftHashValidation = false,
}) => {
  const {
    classes: { sidePadding, button, mainTableControlsContainer },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { canConfigure, configureErrorMessage } = useCanConfigureOrPublish();
  const {
    configEntries,
    configRequestState,
    draftRequestState,
    drafts,
    handleSearchChange,
    isDraftHashRequiredButMissing,
    isPublishing,
    isFirstLoad,
    isEmptyActiveConfigs,
    isEmptyState,
    cancelPublish,
    discardDraft,
    discardStagedChanges,
    forcePublish,
    deleteConfigEntry,
    publish,
    updateDraft,
    pagination,
    publishingMetadata,
    refresh,
    searchKey,
    setSort,
    sort,
    universeId,
  } = useRemoteConfigsPageBundle({ withDraftHashValidation, initialPageSize: 10 });

  const mainTableControls = useMemo(() => {
    return (
      <div className={mainTableControlsContainer}>
        <Typography variant='h2' color='primary'>
          {translate(
            translationKey(
              'Table.Title.Active',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
        <DebouncedTextField
          id='table-key-search'
          label={translate(
            translationKey(
              'Table.Label.SearchKey',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
          value={searchKey}
          onDebouncedChange={handleSearchChange}
          size='small'
          variant='outlined'
        />
      </div>
    );
  }, [mainTableControlsContainer, searchKey, handleSearchChange, translate]);

  const { dialogState, setDialogState, onStartCreateConfig, onOpenPublishDialog, onEdit } =
    useRemoteConfigsDialogState(drafts.length);

  const [toastState, setToastState] = useState<RemoteConfigToastState | null>(null);
  const clearToast = useCallback(() => setToastState(null), []);

  const createConfigButton = useMemo(() => {
    const disabled = isPublishing || !canConfigure;
    let tooltipTitle: string | undefined;
    if (isPublishing) {
      tooltipTitle = translate(
        translationKey(
          'Label.WaitForPublishToComplete',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    } else if (!canConfigure) {
      tooltipTitle = configureErrorMessage;
    }

    return (
      <Grid item>
        <Tooltip title={tooltipTitle} arrow placement='right'>
          <span>
            <Button
              onClick={onStartCreateConfig}
              variant='contained'
              color='primaryBrand'
              size='large'
              fullWidth={false}
              className={button}
              data-testid='create-button'
              disabled={disabled}>
              {translate(
                translationKey(
                  'Action.Button.CreateConfig',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </span>
        </Tooltip>
      </Grid>
    );
  }, [isPublishing, canConfigure, onStartCreateConfig, button, translate, configureErrorMessage]);

  const historyPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsConfigsHistoryNavigationItem,
      {},
      universeId,
    );
  }, [universeId]);

  const historyButton = useMemo(() => {
    return (
      <Grid item>
        <Link href={historyPageUrl}>
          <Button variant='text' color='secondary' fullWidth={false} className={button}>
            {translate(
              translationKey(
                'Action.Button.History',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Button>
        </Link>
      </Grid>
    );
  }, [button, historyPageUrl, translate]);

  const onCopySnippet = useCallback((key: string) => {
    const snippet = generateSnippet(key);
    navigator.clipboard.writeText(snippet);
    setToastState(RemoteConfigToastState.ClipboardCopySuccess);
    return snippet;
  }, []);

  const onViewSnippet = useCallback(
    (key: string, value: ValidConfigEntryValue) => {
      setDialogState({ type: 'snippet', configKey: key, value });
    },
    [setDialogState],
  );

  const mainTableSort = useMemo(() => {
    return {
      key: sort?.key || SortKey.LastModifiedTime,
      order: sort?.order || SortOrder.Descending,
      onChange: (key: ValidSortKey, order: ValidSortOrder) => {
        setSort({ key, order });
      },
    };
  }, [sort, setSort]);

  const pageControls = useMemo(() => [], []);

  const title = useMemo(
    () => <AnalyticsPageTitle text={translate(analyticsConfigsNavigationItem.title)} />,
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

  const controls = useMemo(
    () => (
      <Grid container justifyContent='space-between' direction='row' alignItems='center'>
        <Grid item>
          <Grid container direction='row'>
            {createConfigButton}
          </Grid>
        </Grid>
        {historyButton}
      </Grid>
    ),
    [createConfigButton, historyButton],
  );

  const emptyState = useMemo(() => {
    return (
      <EmptyState
        title={translate(
          translationKey('EmptyState.Title', TranslationNamespace.UniverseConfigAndExperimentation),
        )}
        description={translateHTML(
          translationKey(
            'EmptyState.Description',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: makeTakeActionLinkUnderlined,
            },
          ],
        )}
        size='large'
        illustration='apiKeys'>
        {createConfigButton}
      </EmptyState>
    );
  }, [createConfigButton, translate, translateHTML]);

  const mainTableWrapper = useMemo(() => {
    if (isEmptyActiveConfigs) {
      return undefined;
    }
    return (
      <React.Fragment>
        {mainTableControls}
        <RemoteConfigMainTable
          isPublishing={isPublishing}
          configEntries={configEntries}
          cancelPublish={cancelPublish}
          discardDraft={discardDraft}
          forcePublish={forcePublish}
          deleteConfigEntry={deleteConfigEntry}
          discardStagedChanges={discardStagedChanges}
          publish={publish}
          updateDraft={updateDraft}
          editConfigEntry={onEdit}
          viewSnippet={onViewSnippet}
          copySnippet={onCopySnippet}
          sort={mainTableSort}
          pagination={pagination.tablePagination}
          {...configRequestState}
        />
      </React.Fragment>
    );
  }, [
    isEmptyActiveConfigs,
    mainTableControls,
    isPublishing,
    configEntries,
    cancelPublish,
    discardDraft,
    forcePublish,
    deleteConfigEntry,
    discardStagedChanges,
    publish,
    updateDraft,
    onEdit,
    onViewSnippet,
    onCopySnippet,
    mainTableSort,
    pagination.tablePagination,
    configRequestState,
  ]);

  const pageContent = useMemo(() => {
    return (
      <React.Fragment>
        {controls}
        <RemoteConfigNotificationArea
          publishing={publishingMetadata}
          draftCount={drafts.length}
          isDisabledDueToMissingDraftHash={isDraftHashRequiredButMissing}
          onDiscard={discardStagedChanges}
          onPublishComplete={refresh}
          onCancelPublish={cancelPublish}
          onPublish={onOpenPublishDialog}
          onForcePublish={forcePublish}
        />
        <RemoteConfigStagingTable
          isPublishing={isPublishing}
          drafts={drafts}
          cancelPublish={cancelPublish}
          discardDraft={discardDraft}
          forcePublish={forcePublish}
          deleteConfigEntry={deleteConfigEntry}
          discardStagedChanges={discardStagedChanges}
          publish={publish}
          updateDraft={updateDraft}
          editConfigEntry={onEdit}
          viewSnippet={onViewSnippet}
          copySnippet={onCopySnippet}
          {...draftRequestState}
        />
        {mainTableWrapper}
      </React.Fragment>
    );
  }, [
    cancelPublish,
    controls,
    deleteConfigEntry,
    discardDraft,
    discardStagedChanges,
    draftRequestState,
    drafts,
    forcePublish,
    isDraftHashRequiredButMissing,
    isPublishing,
    mainTableWrapper,
    onCopySnippet,
    onEdit,
    onOpenPublishDialog,
    onViewSnippet,
    publish,
    publishingMetadata,
    refresh,
    updateDraft,
  ]);

  const pageContentWrapper = useMemo(() => {
    if (isEmptyState) {
      return emptyState;
    }
    return pageContent;
  }, [emptyState, isEmptyState, pageContent]);

  const shouldShowExperimentsNUXBanner = useShouldShowExperimentsNUXBanner(true);

  return (
    <GenericFullAnalyticsPageLayout
      isLoading={isFirstLoad}
      controls={pageControls}
      description={description}
      heroElement={
        shouldShowExperimentsNUXBanner ? (
          <ExperimentsNUXBanner
            titleKey={translationKey(
              'Title.ExperimentsNUXBanner.Configs',
              TranslationNamespace.Analytics,
            )}
            descriptionKey={translationKey(
              'Description.ExperimentsNUXBanner.Configs',
              TranslationNamespace.Analytics,
            )}
            checkForInGameExperiment
          />
        ) : undefined
      }
      addHeroDivider={false}
      title={title}>
      <Grid
        container
        item
        display='flex'
        flexDirection='column'
        classes={{ root: sidePadding }}
        gap={2}>
        <RemoteConfigToast toastState={toastState} onClose={clearToast} />
        <RemoteConfigDialog
          state={dialogState}
          setState={setDialogState}
          onCreateOrEditSucceeded={refresh} // When drafts change we need to remove them from the main table, so need to refresh both
          onPublish={publish}
          onCopySnippet={onCopySnippet}
        />
        {pageContentWrapper}
      </Grid>
    </GenericFullAnalyticsPageLayout>
  );
};

export default withNamespaceSwitchedTranslation(CreatorConfigsHubPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
