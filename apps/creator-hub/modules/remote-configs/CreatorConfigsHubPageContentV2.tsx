import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  Button,
  Divider,
  Snackbar,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
} from '@rbx/foundation-ui';
import {
  analyticsConfigsHistoryNavigationItem,
  AnalyticsDocLink,
  AnalyticsPageDescription,
  AnalyticsPageTitle,
  buildExperienceAnalyticsUrlWithParams,
  analyticsConfigsNavigationItem,
  DebouncedTextField,
} from '@modules/charts-generic';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { GenericFullAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { Link, urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { useRouter } from 'next/router';
import { EmptyState } from '@modules/miscellaneous/common/components';
import useCanConfigureOrPublish from './hooks/useCanConfigureOrPublish';
import useRemoteConfigsPageBundle from './hooks/useRemoteConfigsPageBundle';
import RemoteConfigMainTable from './components/RemoteConfigMainTable';
import ConditionsTabContent from './components/ConditionsTabContent';
import SnippetDialogV2 from './components/SnippetDialogV2';

import {
  DeploymentStrategy,
  SortKey,
  SortOrder,
  ValidConfigEntryValueType,
} from './api/universeConfigsClientEnums';
import type { ValidConfigEntryDetail, ValidSortKey, ValidSortOrder } from './api/validTypes';
import generateSnippet from './utils/generateSnippet';
import { isConditionOrderDifferent } from './utils/isConditionOrderDifferent';
import RemoteConfigNotificationArea from './components/RemoteConfigNotificationArea';
import RemoteConfigStagingTable from './components/RemoteConfigStagingTable';
import { ConfigActionError } from './hooks/useConfigsMutation';
import PublishDialog from './components/PublishDialog';

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

enum ConfigTabs {
  Keys = 'keys',
  Conditions = 'conditions',
}

const orderedTabs = [ConfigTabs.Keys, ConfigTabs.Conditions] as const;

type CreatorConfigsHubPageContentProps = {
  withDraftHashValidation?: boolean;
};

const pageControls: never[] = [];

const CreatorConfigsHubPageContentV2: FC<CreatorConfigsHubPageContentProps> = ({
  withDraftHashValidation = false,
}) => {
  const router = useRouter();
  const { translate, translateHTML, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { canConfigure, configureErrorMessage } = useCanConfigureOrPublish();
  const {
    rules,
    ruleOrdering,
    configEntries,
    configRequestState,
    draftRequestState,
    drafts,
    draftRuleOrdering,
    handleSearchChange,
    isDraftHashRequiredButMissing,
    isPublishing,
    isEmptyState,
    cancelPublish,
    discardDraft,
    discardStagedChanges,
    forcePublish,
    deleteConfigEntry,
    publish,
    reorderRules,
    updateDraft,
    pagination,
    publishingMetadata,
    refresh,
    searchKey,
    setSort,
    sort,
    universeId,
  } = useRemoteConfigsPageBundle({ withDraftHashValidation, initialPageSize: 10 });

  const [selectedTab, setSelectedTab] = useState<ConfigTabs>(ConfigTabs.Keys);
  const [snippetDialogKey, setSnippetDialogKey] = useState<string | null>(null);
  const [showCopySuccessSnackbar, setShowCopySuccessSnackbar] = useState(false);
  const [publishDialogState, setPublishDialogState] = useState<{
    deploymentStrategy: DeploymentStrategy;
    draftCount: number;
    hasRuleOrderingChanges: boolean;
  } | null>(null);

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

  const historyPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(
      analyticsConfigsHistoryNavigationItem,
      {},
      universeId,
    );
  }, [universeId]);

  const onCreateButtonClick = useCallback(() => {
    router.push(urls.creatorHub.dashboard.getAnalyticsConfigsCreateUrl(universeId));
  }, [router, universeId]);

  const onEditConfigEntry = useCallback(
    (configEntry: ValidConfigEntryDetail) => {
      const { entry } = configEntry.overrideEntry;
      if (!entry || !entry.entryValue) {
        return;
      }

      const { key, entryValue, description: entryDescription } = entry;
      const query: Record<string, string> = {
        configKey: key,
        valueType: entryValue.valueType,
      };

      if (entryDescription) {
        query.description = entryDescription;
      }

      switch (entryValue.valueType) {
        case ValidConfigEntryValueType.String:
          query.stringValue = entryValue.stringValue;
          break;
        case ValidConfigEntryValueType.Boolean:
          query.boolValue = String(entryValue.boolValue);
          break;
        case ValidConfigEntryValueType.Number:
          query.numberValue = String(entryValue.numberValue);
          break;
        case ValidConfigEntryValueType.Json:
          query.jsonValue = entryValue.jsonValue;
          break;
        default:
          break;
      }

      router.push({
        pathname: urls.creatorHub.dashboard.getAnalyticsConfigsCreateUrl(universeId),
        query,
      });
    },
    [router, universeId],
  );

  const createConfigButton = useMemo(() => {
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

    const createButtonContent = (
      <Button onClick={onCreateButtonClick} color='primaryBrand' data-testid='create-button'>
        {translate(
          translationKey(
            'Action.Button.CreateConfig',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      </Button>
    );

    if (tooltipTitle !== undefined) {
      return (
        <Tooltip title={tooltipTitle} position='right-center'>
          {createButtonContent}
        </Tooltip>
      );
    }

    return createButtonContent;
  }, [isPublishing, canConfigure, onCreateButtonClick, translate, configureErrorMessage]);

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

  const tabLabels = useMemo(() => {
    return {
      [ConfigTabs.Keys]: tPendingTranslation(
        'Keys',
        'Tab label for the configuration keys list view.',
        translationKey('Tab.Keys', TranslationNamespace.UniverseConfigAndExperimentation),
      ),
      [ConfigTabs.Conditions]: tPendingTranslation(
        'Conditions',
        'Tab label for the targeting conditions list view.',
        translationKey('Tab.Conditions', TranslationNamespace.UniverseConfigAndExperimentation),
      ),
    };
  }, [tPendingTranslation]);

  const historyButtonLabel = useMemo(() => {
    return tPendingTranslation(
      'History',
      'Title of the button that shows the history of changes made to configuration keys.',
      translationKey(
        'Action.Button.History',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
  }, [tPendingTranslation]);

  const onCopySnippet = useCallback((key: string) => {
    const snippet = generateSnippet(key);
    navigator.clipboard.writeText(snippet);
    setShowCopySuccessSnackbar(true);
  }, []);

  const onViewSnippet = useCallback((key: string) => {
    setSnippetDialogKey(key);
  }, []);

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

  const onOpenPublishDialog = useCallback(
    (deploymentStrategy: DeploymentStrategy) => {
      setPublishDialogState({
        deploymentStrategy,
        draftCount: drafts.length,
        hasRuleOrderingChanges: hasRuleOrderingDraftChanges,
      });
    },
    [drafts.length, hasRuleOrderingDraftChanges],
  );

  const closePublishDialog = useCallback(() => {
    setPublishDialogState(null);
  }, []);

  const onEditRuleOrdering = useCallback(() => {
    setSelectedTab(ConfigTabs.Conditions);
  }, []);

  const onPublishWithDialogState = useCallback(
    ({
      description: publishMessage,
      onSuccess,
      onError,
    }: {
      description: string;
      onSuccess: (data: { draftHash?: string }) => void;
      onError: (error: ConfigActionError) => void;
    }) => {
      if (!publishDialogState) {
        return Promise.reject(
          new Error('Publish dialog state was not initialized before publish.'),
        );
      }
      return publish({
        message: publishMessage,
        deploymentStrategy: publishDialogState.deploymentStrategy,
        onSuccess,
        onError,
      });
    },
    [publish, publishDialogState],
  );

  const tableShell = useMemo(() => {
    if (selectedTab === ConfigTabs.Keys) {
      return (
        <React.Fragment>
          <RemoteConfigNotificationArea
            publishing={publishingMetadata}
            draftCount={drafts.length}
            hasRuleOrderingDraftChanges={hasRuleOrderingDraftChanges}
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
            currentRuleOrdering={ruleOrdering}
            stagedRuleOrdering={draftRuleOrdering}
            onEditRuleOrdering={onEditRuleOrdering}
            cancelPublish={cancelPublish}
            discardDraft={discardDraft}
            forcePublish={forcePublish}
            deleteConfigEntry={deleteConfigEntry}
            discardStagedChanges={discardStagedChanges}
            publish={publish}
            updateDraft={updateDraft}
            editConfigEntry={onEditConfigEntry}
            viewSnippet={onViewSnippet}
            copySnippet={onCopySnippet}
            {...draftRequestState}
          />
          <div className='flex items-center justify-between gap-medium'>
            <h2>
              {translate(
                translationKey(
                  'Table.Title.Active',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </h2>
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
            editConfigEntry={onEditConfigEntry}
            viewSnippet={onViewSnippet}
            copySnippet={onCopySnippet}
            sort={mainTableSort}
            pagination={pagination.tablePagination}
            {...configRequestState}
          />
        </React.Fragment>
      );
    }
    if (selectedTab === ConfigTabs.Conditions) {
      return (
        <ConditionsTabContent
          rules={rules}
          ruleOrdering={ruleOrdering}
          reorderRules={reorderRules}
        />
      );
    }
    return null;
  }, [
    cancelPublish,
    configEntries,
    configRequestState,
    deleteConfigEntry,
    draftRequestState,
    drafts,
    draftRuleOrdering,
    discardDraft,
    discardStagedChanges,
    forcePublish,
    handleSearchChange,
    hasRuleOrderingDraftChanges,
    isDraftHashRequiredButMissing,
    isPublishing,
    mainTableSort,
    onCopySnippet,
    onEditRuleOrdering,
    onEditConfigEntry,
    onOpenPublishDialog,
    onViewSnippet,
    pagination.tablePagination,
    publish,
    publishingMetadata,
    reorderRules,
    refresh,
    rules,
    ruleOrdering,
    searchKey,
    selectedTab,
    translate,
    updateDraft,
  ]);

  const pageContent = useMemo(() => {
    return (
      <div className='width-full min-width-0 flex flex-col gap-medium'>
        <div className='width-full'>
          <Tabs
            value={selectedTab}
            onValueChange={(tab) => setSelectedTab(tab as ConfigTabs)}
            fitBehavior='Fit'
            size='Medium'
            variant='Inlined'>
            <TabsList>
              {orderedTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tabLabels[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Divider />
        </div>
        <div className='width-full flex items-center justify-between'>
          {selectedTab === ConfigTabs.Keys && (
            <div className='flex gap-small wrap'>
              {createConfigButton}
              <Button variant='Standard' type='button' as='a' href={historyPageUrl}>
                {historyButtonLabel}
              </Button>
            </div>
          )}
        </div>

        {tableShell}
      </div>
    );
  }, [selectedTab, createConfigButton, historyPageUrl, historyButtonLabel, tableShell, tabLabels]);

  const pageContentWrapper = useMemo(() => {
    return isEmptyState ? emptyState : pageContent;
  }, [emptyState, isEmptyState, pageContent]);

  const copySuccessMessage = translate(
    translationKey(
      'Toast.ClipboardCopySuccess',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const closeSnippetDialog = useCallback(() => setSnippetDialogKey(null), []);

  return (
    <GenericFullAnalyticsPageLayout
      controls={pageControls}
      title={title}
      description={description}
      isLoading={false}>
      <Grid item XSmall={12}>
        {pageContentWrapper}
      </Grid>
      <SnippetDialogV2
        configKey={snippetDialogKey}
        onClose={closeSnippetDialog}
        onCopySnippet={onCopySnippet}
      />
      <PublishDialog
        open={publishDialogState !== null}
        stagedCount={publishDialogState?.draftCount ?? drafts.length}
        hasRuleOrderingChanges={publishDialogState?.hasRuleOrderingChanges ?? false}
        onCancel={closePublishDialog}
        onPublish={onPublishWithDialogState}
        onPublishSucceed={closePublishDialog}
      />
      {showCopySuccessSnackbar && (
        <Snackbar
          title={copySuccessMessage}
          icon='icon-regular-circle-check'
          shouldAutoDismiss
          onClose={() => setShowCopySuccessSnackbar(false)}
        />
      )}
    </GenericFullAnalyticsPageLayout>
  );
};

export default withNamespaceSwitchedTranslation(CreatorConfigsHubPageContentV2, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
