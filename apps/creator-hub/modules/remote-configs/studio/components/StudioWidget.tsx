import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { PublishingMetadata } from '@modules/clients/analytics/universeConfigs';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import type {
  ValidConfigEntryDetail,
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
} from '../../api/validTypes';
import type { ActionInvokers } from '../../hooks/useConfigEntriesActions';
import strictly from '../foundation-utils/strictly';
import ConfigsStudioTab from '../types/ConfigsStudioTab';
import type { JsonConfigEntry } from '../types/JsonConfigEntryValue';
import JsonTakeoverEditor from './JsonTakeoverEditor';
import PublishedTable from './PublishedTable';
import StagedTable from './StagedTable';
import StudioHeader from './StudioHeader';

type StudioWidgetProps = {
  filteredStagedChanges: Array<ValidConfigEntryStaged>;
  stagedCount: number;
  publishedCount: number;
  publishedOverrides: Array<ValidConfigEntryDetail>;
  isEmptyDrafts: boolean;
  isEmptyActiveConfigs: boolean;
  searchKey: string;
  handleSearchChange: (key: string) => void;
  refresh: () => void;
  onHistory: () => void;
  publishingMetadata?: PublishingMetadata;
} & ActionInvokers;

const StudioWidget = ({
  filteredStagedChanges,
  stagedCount,
  publishedCount,
  isEmptyDrafts,
  isEmptyActiveConfigs,
  searchKey,
  handleSearchChange,
  publishedOverrides,
  onHistory,
  editConfigEntry: doEditConfigEntry,
  refresh,
  publishingMetadata,
  ...actionInvokers
}: StudioWidgetProps) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(ConfigsStudioTab.Staged);
  const [pendingEditEntry, setPendingEditEntry] = useState<ValidConfigEntryDetail | null>(null);
  const { translate } = useTranslationWrapper(useTranslation());

  // Whether we're editing a JSON entry is derived from the pendingEditEntry
  const editingJsonEntry: JsonConfigEntry | null = useMemo(() => {
    if (!pendingEditEntry) {
      return null;
    }
    const { entry } = pendingEditEntry.overrideEntry;
    const { entryValue } = entry;
    if (!entryValue) {
      return null;
    }
    if (entryValue.valueType === ValidConfigEntryValueType.Json) {
      return { ...entry, entryValue };
    }
    return null;
  }, [pendingEditEntry]);

  useEffect(() => {
    if (isEmptyDrafts) {
      setTab(ConfigsStudioTab.Published);
    }
  }, [isEmptyDrafts]);

  const changeTab = useCallback((newTab: ConfigsStudioTab) => {
    // TODO: do we need to submit the changes if we're currently editing? Or will this be handled by the blur handler?
    setPendingEditEntry(null);
    setTab(newTab);
  }, []);

  const startEditConfigEntry = useCallback((entry: ValidConfigEntryDetail) => {
    setPendingEditEntry(entry);
    setTab(ConfigsStudioTab.Staged);
  }, []);

  const onCreateSuccess = useCallback(() => {
    changeTab(ConfigsStudioTab.Staged);
  }, [changeTab]);

  const onSaveJson = useCallback(
    (entry: JsonConfigEntry) => {
      actionInvokers.updateDraft({ key: entry.key, value: entry.entryValue });
    },
    [actionInvokers],
  );

  const startJsonEdit = useCallback(
    (entry: JsonConfigEntry) => {
      setPendingEditEntry({ isOverride: true, overrideEntry: { entry } });
    },
    [setPendingEditEntry],
  );

  const jsonTakeoverEditor = useMemo(() => {
    if (!editingJsonEntry) {
      return null;
    }
    return (
      <JsonTakeoverEditor
        entry={editingJsonEntry}
        onSave={onSaveJson}
        onClose={() => setPendingEditEntry(null)}
        isOpen={!!editingJsonEntry}
      />
    );
  }, [editingJsonEntry, onSaveJson]);

  const showMainView = !jsonTakeoverEditor;

  const header = useMemo(
    () =>
      showMainView ? (
        <StudioHeader
          tab={tab}
          setTab={changeTab}
          stagedCount={stagedCount}
          publishedCount={publishedCount}
          isEmptyDrafts={isEmptyDrafts}
          searchKey={searchKey}
          handleSearchChange={handleSearchChange}
          publish={actionInvokers.publish}
          publishAs={actionInvokers.publishAs}
          discardStagedChanges={actionInvokers.discardStagedChanges}
          onCreateSuccess={onCreateSuccess}
          onCreateClose={refresh}
          publishingMetadata={publishingMetadata}
          cancelPublish={actionInvokers.cancelPublish}
          refresh={refresh}
        />
      ) : null,
    [
      showMainView,
      tab,
      changeTab,
      stagedCount,
      publishedCount,
      isEmptyDrafts,
      searchKey,
      handleSearchChange,
      actionInvokers.publish,
      actionInvokers.publishAs,
      actionInvokers.discardStagedChanges,
      onCreateSuccess,
      refresh,
      publishingMetadata,
      actionInvokers.cancelPublish,
    ],
  );

  const discardDraft = useCallback(
    (key: string) => {
      actionInvokers.discardDraft(key);
      if (pendingEditEntry?.overrideEntry.entry.key === key) {
        setPendingEditEntry(null);
      }
    },
    [actionInvokers, pendingEditEntry],
  );

  const deleteConfigEntry = useCallback(
    (key: string) => {
      actionInvokers.deleteConfigEntry(key);
      setTab(ConfigsStudioTab.Staged);
    },
    [actionInvokers],
  );

  const updateDraft = useCallback(
    ({ key, value }: { key: string; value: ValidConfigEntryValue }) => {
      actionInvokers.updateDraft({ key, value });
      setPendingEditEntry(null);
    },
    [actionInvokers],
  );

  const table = useMemo(() => {
    if (!showMainView) {
      return null;
    }
    return tab === ConfigsStudioTab.Staged ? (
      <StagedTable
        changes={filteredStagedChanges}
        startJsonEdit={startJsonEdit}
        widgetRef={widgetRef}
        {...actionInvokers}
        editConfigEntry={startEditConfigEntry}
        editingEntry={pendingEditEntry}
        discardDraft={discardDraft}
        updateDraft={updateDraft}
      />
    ) : (
      <PublishedTable
        configs={publishedOverrides}
        widgetRef={widgetRef}
        {...actionInvokers}
        editConfigEntry={startEditConfigEntry}
        deleteConfigEntry={deleteConfigEntry}
      />
    );
  }, [
    showMainView,
    tab,
    filteredStagedChanges,
    startJsonEdit,
    startEditConfigEntry,
    pendingEditEntry,
    actionInvokers,
    discardDraft,
    updateDraft,
    publishedOverrides,
    deleteConfigEntry,
  ]);

  const isAnyPublishedConfigStaged = useMemo(() => {
    return publishedOverrides.find((config) => config.isStaged);
  }, [publishedOverrides]);

  return (
    <div className={strictly('size-full', 'relative', 'flex', 'flex-col')} ref={widgetRef}>
      {header}
      <div className={strictly('grow', 'scroll-y')}>{table}</div>
      {jsonTakeoverEditor}
      {tab === ConfigsStudioTab.Published && isAnyPublishedConfigStaged && (
        <div>
          {translate(
            translationKey(
              'Hint.PublishedTableWithStagedChange',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default withNamespaceSwitchedTranslation(StudioWidget, [
  TranslationNamespace.UniverseConfigAndExperimentation,
]);
