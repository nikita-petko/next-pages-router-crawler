import React, { Fragment, useCallback, useMemo } from 'react';
import { Action } from '@modules/charts-generic';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import {
  RemoteConfigAction,
  ActionsForConfigEntryDraft,
  ActionInvokers,
  useConfigEntriesActions,
} from '../../hooks/useConfigEntriesActions';
import {
  ValidConfigEntry,
  ValidConfigEntryDetail,
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
} from '../../api/validTypes';
import useStudioConfigStyles, { foundationClasses } from './useStudioConfigStyles';
import MoreOptionActionButton from './MoreOptionActionButton';
import TableHeader from './TableHeader';
import { configEntryToStringTypeValue } from './tableUtils';
import StagedTableValueCell from './StagedTableInputCell';
import strictly from '../foundation-utils/strictly';
import { JsonConfigEntry } from '../types/JsonConfigEntryValue';

const orderedDraftActionsAsMenuOptions = [
  RemoteConfigAction.CopyConfigSnippet,
  RemoteConfigAction.DiscardDraft,
] as const;

const StagedTableRow = ({
  change,
  generateConfigEntriesDraftActions,
  updateDraft,
  startJsonEdit,
  widgetRef,
  isEditing,
}: {
  change: ValidConfigEntryStaged;
  generateConfigEntriesDraftActions: (
    configEntry: ValidConfigEntryStaged,
  ) => Record<
    ActionsForConfigEntryDraft,
    Action<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
  >;
  updateDraft: ActionInvokers['updateDraft'];
  startJsonEdit: (entry: JsonConfigEntry) => void;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
}) => {
  const { entry } = change.overrideEntry;
  const { entryValue, key: entryKey } = entry;
  const { isDeleted } = change;
  const { classes } = useStudioConfigStyles();
  const { columns, tableRow, tableRowNonHeader } = foundationClasses;
  const { translate } = useTranslationWrapper(useTranslation());
  const { keyColumn, typeColumn, valueColumn, actionsColumn } = columns(classes);

  const handleValueChange = useCallback(
    (newValue: ValidConfigEntryValue) => {
      return updateDraft({ key: entryKey, value: newValue });
    },
    [entryKey, updateDraft],
  );

  const actions = useMemo(() => {
    const draftActions = generateConfigEntriesDraftActions(change);
    return orderedDraftActionsAsMenuOptions.map((actionType) => draftActions[actionType]);
  }, [change, generateConfigEntriesDraftActions]);

  const valueCell = useMemo(() => {
    if (isDeleted || !entryValue) {
      return (
        <div className={valueColumn}>
          {translate(
            translationKey(
              'Status.Label.ExperimentDeleted',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </div>
      );
    }

    return (
      <StagedTableValueCell
        entryKey={entryKey}
        entryValue={entryValue}
        onChange={handleValueChange}
        startJsonEdit={startJsonEdit}
        isEditing={isEditing}
      />
    );
  }, [
    isDeleted,
    entryValue,
    entryKey,
    handleValueChange,
    startJsonEdit,
    isEditing,
    valueColumn,
    translate,
  ]);

  const valueTypeStr = entryValue ? configEntryToStringTypeValue(entryValue) : null;
  return (
    <div className={strictly(tableRow, tableRowNonHeader)}>
      <div className={strictly(keyColumn, 'select-all')}>{entryKey}</div>
      <div className={strictly(typeColumn, 'select-all')}>{valueTypeStr}</div>
      <div className={valueColumn}>{valueCell}</div>
      <div className={actionsColumn}>
        <MoreOptionActionButton widgetRef={widgetRef} actions={actions} />
      </div>
    </div>
  );
};

const StagedTable = ({
  changes,
  startJsonEdit,
  widgetRef,
  editingEntry,
  updateDraft,
  ...actionInvokers
}: {
  changes: Array<ValidConfigEntryStaged>;
  editingEntry: ValidConfigEntryDetail | null;
  startJsonEdit: (value: JsonConfigEntry) => void;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  updateDraft: ActionInvokers['updateDraft'];
} & ActionInvokers) => {
  const { generateConfigEntriesDraftActions } = useConfigEntriesActions({
    ...actionInvokers,
    updateDraft,
  });
  const { tableContainer } = foundationClasses;

  const incomingEditIfNotAlreadyInChanges = useMemo(() => {
    if (!editingEntry) return null;
    const editingKey = editingEntry.overrideEntry.entry.key;

    // If an entry is already in the change set and not deleted, we will do the edit inline
    const isKeyInExistingChangesAndNotDeleted = changes.some(
      (change) => change.overrideEntry.entry.key === editingKey && !change.isDeleted,
    );
    if (isKeyInExistingChangesAndNotDeleted) return null;

    // We shouldn't be editing an entry if it is deleted
    const { entryValue } = editingEntry.overrideEntry.entry;
    if (!entryValue) return null;

    const newEntry: ValidConfigEntry = {
      key: editingKey,
      entryValue,
    };
    const newChange: ValidConfigEntryStaged = {
      isDeleted: false,
      isPublishing: false,
      currentValue: entryValue, // not technically correct but we don't use it
      overrideEntry: { entry: newEntry },
    };
    return (
      <StagedTableRow
        key={editingKey}
        isEditing
        change={newChange}
        generateConfigEntriesDraftActions={generateConfigEntriesDraftActions}
        updateDraft={updateDraft}
        startJsonEdit={startJsonEdit}
        widgetRef={widgetRef}
      />
    );
  }, [
    editingEntry,
    changes,
    generateConfigEntriesDraftActions,
    updateDraft,
    startJsonEdit,
    widgetRef,
  ]);

  const body = (
    <Fragment>
      {incomingEditIfNotAlreadyInChanges}
      {changes.map((change) => {
        const isEditingCurrentKey =
          editingEntry?.overrideEntry.entry.key === change.overrideEntry.entry.key;
        // If we're editing the currrent key which is deleted, we would like to show the incoming edit
        if (change.isDeleted && isEditingCurrentKey) return incomingEditIfNotAlreadyInChanges;
        return (
          <StagedTableRow
            key={change.overrideEntry.entry.key}
            isEditing={isEditingCurrentKey}
            change={change}
            generateConfigEntriesDraftActions={generateConfigEntriesDraftActions}
            updateDraft={updateDraft}
            startJsonEdit={startJsonEdit}
            widgetRef={widgetRef}
          />
        );
      })}
    </Fragment>
  );

  return (
    <div data-testid='staged-table' className={tableContainer}>
      <TableHeader />
      {body}
    </div>
  );
};
export default StagedTable;
