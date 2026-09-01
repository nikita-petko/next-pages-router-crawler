import type { FC } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, Grid, makeStyles, Tooltip, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import DebouncedTextField from '@modules/charts-generic/charts/DebouncedTextField';
import {
  analyticsConfigsHistoryNavigationItem,
  analyticsConfigsNavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import ExperimentsNUXBanner, {
  useShouldShowExperimentsNUXBanner,
} from '@modules/experience-analytics-shared/components/Banners/ExperimentsNUXBanner';
import GenericFullAnalyticsPageLayout from '@modules/experience-analytics-shared/layout/GenericFullAnalyticsPageLayout';
import { Link } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SortKey, SortOrder } from './api/universeConfigsClientEnums';
import type { ValidConfigEntryValue, ValidSortKey, ValidSortOrder } from './api/validTypes';
import RemoteConfigDialog from './components/RemoteConfigDialog';
import RemoteConfigMainTable from './components/RemoteConfigMainTable';
import RemoteConfigNotificationArea from './components/RemoteConfigNotificationArea';
import RemoteConfigStagingTable from './components/RemoteConfigStagingTable';
import RemoteConfigToast, { RemoteConfigToastState } from './components/RemoteConfigToast';
import useCanConfigureOrPublish from './hooks/useCanConfigureOrPublish';
import useRemoteConfigsDialogState from './hooks/useRemoteConfigsDialogState';
import useRemoteConfigsPageBundle from './hooks/useRemoteConfigsPageBundle';
import generateSnippet from './utils/generateSnippet';
import { isConditionOrderDifferent } from './utils/isConditionOrderDifferent';

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
    rules,
    ruleOrdering,
    configEntries,
    configRequestState,
    draftRequestState,
    drafts,
    draftRules,
    draftRuleOrdering,
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
    publishAs,
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
    void navigator.clipboard.writeText(snippet);
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

  const hasRuleOrderingDraftChanges = useMemo(() => {
    return isConditionOrderDifferent(
      ruleOrdering?.conditionOrder,
      draftRuleOrdering?.conditionOrder,
    );
  }, [draftRuleOrdering?.conditionOrder, ruleOrdering?.conditionOrder]);

  const hasTargetingDraftChanges = useMemo(() => {
    return hasRuleOrderingDraftChanges || (draftRules?.size ?? 0) > 0;
  }, [draftRules?.size, hasRuleOrderingDraftChanges]);

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

  const conditionOrder = useMemo(
    () =>
      draftRuleOrdering?.conditionOrder?.length
        ? draftRuleOrdering.conditionOrder
        : ruleOrdering?.conditionOrder,
    [draftRuleOrdering, ruleOrdering],
  );

  const mainTableWrapper = useMemo(() => {
    if (isEmptyActiveConfigs) {
      return null;
    }
    return (
      <>
        {mainTableControls}
        <RemoteConfigMainTable
          isPublishing={isPublishing}
          configEntries={configEntries}
          conditionOrder={conditionOrder}
          cancelPublish={cancelPublish}
          discardDraft={discardDraft}
          forcePublish={forcePublish}
          deleteConfigEntry={deleteConfigEntry}
          discardStagedChanges={discardStagedChanges}
          publish={publish}
          publishAs={publishAs}
          updateDraft={updateDraft}
          editConfigEntry={onEdit}
          viewSnippet={onViewSnippet}
          copySnippet={onCopySnippet}
          sort={mainTableSort}
          pagination={pagination.tablePagination}
          {...configRequestState}
        />
      </>
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
    publishAs,
    conditionOrder,
  ]);

  const pageContent = useMemo(() => {
    return (
      <>
        {controls}
        <RemoteConfigNotificationArea
          publishing={publishingMetadata}
          draftCount={drafts.length}
          hasRuleOrderingDraftChanges={hasTargetingDraftChanges}
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
          rules={rules}
          draftRules={draftRules}
          currentRuleOrdering={ruleOrdering}
          stagedRuleOrdering={draftRuleOrdering}
          onConditionMutationSuccess={refresh}
          cancelPublish={cancelPublish}
          discardDraft={discardDraft}
          forcePublish={forcePublish}
          deleteConfigEntry={deleteConfigEntry}
          discardStagedChanges={discardStagedChanges}
          publish={publish}
          publishAs={publishAs}
          updateDraft={updateDraft}
          editConfigEntry={onEdit}
          viewSnippet={onViewSnippet}
          copySnippet={onCopySnippet}
          {...draftRequestState}
        />
        {mainTableWrapper}
      </>
    );
  }, [
    cancelPublish,
    controls,
    deleteConfigEntry,
    discardDraft,
    discardStagedChanges,
    draftRequestState,
    drafts,
    draftRules,
    draftRuleOrdering,
    forcePublish,
    hasTargetingDraftChanges,
    isDraftHashRequiredButMissing,
    isPublishing,
    mainTableWrapper,
    onCopySnippet,
    onEdit,
    onOpenPublishDialog,
    onViewSnippet,
    publish,
    publishAs,
    publishingMetadata,
    refresh,
    rules,
    ruleOrdering,
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
