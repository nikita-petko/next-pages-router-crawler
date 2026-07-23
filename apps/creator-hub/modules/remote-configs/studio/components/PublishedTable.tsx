import React, { useMemo } from 'react';
import { Action } from '@modules/charts-generic';
import {
  RemoteConfigAction,
  ActionsForConfigEntry,
  useConfigEntriesActions,
  ActionInvokers,
} from '../../hooks/useConfigEntriesActions';
import { configEntryToBestEntryValue, configEntryToKey } from '../../utils/configEntryAccessors';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { ValidConfigEntryDetail } from '../../api/validTypes';

import { configEntryToStringTypeValue } from './tableUtils';
import TableHeader from './TableHeader';
import useStudioConfigStyles, { foundationClasses } from './useStudioConfigStyles';
import MoreOptionActionButton from './MoreOptionActionButton';
import configEntryToStringValue from '../../utils/configEntryToStringValue';
import strictly, { unstrict } from '../foundation-utils/strictly';

const orderedActionsAsMenuOptions = [
  RemoteConfigAction.CopyConfigSnippet,
  RemoteConfigAction.DeleteConfig,
  RemoteConfigAction.EditConfig,
] as const;

const PublishedTableRow = ({
  config,
  widgetRef,
  generateConfigEntriesActions,
}: {
  config: ValidConfigEntryDetail;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  generateConfigEntriesActions: (
    configEntry: ValidConfigEntryDetail,
  ) => Record<ActionsForConfigEntry, Action<ActionsForConfigEntry, ValidConfigEntryDetail>>;
}) => {
  const {
    classes: { monoFont, ...classes },
  } = useStudioConfigStyles();
  const { columns, tableRow, tableRowNonHeader } = foundationClasses;
  const { keyColumn, typeColumn, valueColumn, actionsColumn } = columns(classes);

  const { entryValue, key } = useMemo(() => {
    return {
      entryValue: configEntryToBestEntryValue(config),
      key: configEntryToKey(config),
    };
  }, [config]);

  const actions = useMemo(() => {
    const configEntriesActions = generateConfigEntriesActions(config);
    return orderedActionsAsMenuOptions.map((actionType) => configEntriesActions[actionType]);
  }, [config, generateConfigEntriesActions]);

  if (!entryValue) {
    return null;
  }

  const displayValue =
    entryValue.valueType === ValidConfigEntryValueType.Json
      ? entryValue.jsonValue
      : configEntryToStringValue(entryValue);
  const useMonoFont = entryValue.valueType !== ValidConfigEntryValueType.String;
  const valueTypeStr = configEntryToStringTypeValue(entryValue);
  return (
    <div className={strictly(tableRow, tableRowNonHeader)}>
      <div className={strictly(keyColumn, 'select-all')}>{key}</div>
      <div className={strictly(typeColumn, 'select-all')}>{valueTypeStr}</div>
      <div
        className={strictly(valueColumn, 'select-all', {
          [unstrict(monoFont)]: useMonoFont,
        })}>
        {displayValue}
      </div>
      <div className={actionsColumn}>
        <MoreOptionActionButton widgetRef={widgetRef} actions={actions} />
      </div>
    </div>
  );
};

const PublishedTable = ({
  configs,
  widgetRef,
  ...actionInvokers
}: {
  configs: Array<ValidConfigEntryDetail>;
  widgetRef: React.RefObject<HTMLDivElement | null>;
} & ActionInvokers) => {
  const { generateConfigEntriesActions } = useConfigEntriesActions(actionInvokers);
  const { tableContainer } = foundationClasses;

  return (
    <div data-testid='published-table' className={tableContainer}>
      <TableHeader />
      {configs.map((config) => {
        return (
          <PublishedTableRow
            key={configEntryToKey(config)}
            config={config}
            widgetRef={widgetRef}
            generateConfigEntriesActions={generateConfigEntriesActions}
          />
        );
      })}
    </div>
  );
};
export default PublishedTable;
