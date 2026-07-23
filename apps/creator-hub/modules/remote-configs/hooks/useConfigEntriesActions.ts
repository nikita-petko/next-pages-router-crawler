import { useCallback } from 'react';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { Action } from '@modules/charts-generic/types/Action';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { DeploymentStrategy } from '../api/universeConfigsClientEnums';
import type {
  ValidConditionRule,
  ValidConfigEntryDetail,
  ValidConfigEntryStaged,
  ValidConfigEntryValue,
} from '../api/validTypes';
import { configEntryToBestEntryValue, configEntryToKey } from '../utils/configEntryAccessors';
import type { ConfigActionError } from './useConfigsMutation';

export enum RemoteConfigAction {
  EditConfig = 'EditConfig',
  DeleteConfig = 'DeleteConfig', // update config with entry marked with deleted
  DiscardDraft = 'DiscardDraft', // discard a draft
  CopyConfigSnippet = 'CopyConfigSnippet',
  ViewConfigSnippet = 'ViewConfigSnippet',
  UpdateDraft = 'UpdateDraft',
  DiscardStagedChanges = 'DiscardStagedChanges', // discard staged changes (all drafts)
  Publish = 'Publish',
  ForcePublish = 'ForcePublish',
  CancelPublish = 'CancelPublish',
}

const CommonActions = [
  RemoteConfigAction.EditConfig,
  RemoteConfigAction.CopyConfigSnippet,
  RemoteConfigAction.ViewConfigSnippet,
] as const;

const ActionsForConfigEntry = [
  ...CommonActions,
  RemoteConfigAction.DeleteConfig,
  RemoteConfigAction.DiscardDraft,
] as const;
export type ActionsForConfigEntry = (typeof ActionsForConfigEntry)[number];

const ActionsForConfigEntryDraft = [
  ...CommonActions,
  RemoteConfigAction.DiscardDraft,
  RemoteConfigAction.UpdateDraft,
] as const;
export type ActionsForConfigEntryDraft = (typeof ActionsForConfigEntryDraft)[number];

export const RemoteConfigActionInfo: Record<
  RemoteConfigAction,
  {
    labelKey: TranslationKey;
    variant: 'standard' | 'alert';
  }
> = {
  [RemoteConfigAction.EditConfig]: {
    labelKey: translationKey('Action.Edit', TranslationNamespace.UniverseConfigAndExperimentation),
    variant: 'standard',
  },
  [RemoteConfigAction.DeleteConfig]: {
    labelKey: translationKey(
      'Action.Delete',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'alert',
  },
  [RemoteConfigAction.DiscardDraft]: {
    labelKey: translationKey(
      'Action.DiscardChange',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'alert',
  },
  [RemoteConfigAction.CopyConfigSnippet]: {
    labelKey: translationKey(
      'Action.CopySnippet',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.UpdateDraft]: {
    labelKey: translationKey(
      'Action.Update',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.DiscardStagedChanges]: {
    labelKey: translationKey(
      'Action.Button.Discard',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.Publish]: {
    labelKey: translationKey(
      'Action.Button.PublishSlowly',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.ForcePublish]: {
    labelKey: translationKey(
      'Action.Button.ForcePublish',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.CancelPublish]: {
    labelKey: translationKey(
      'Action.Button.CancelPublish',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
  [RemoteConfigAction.ViewConfigSnippet]: {
    labelKey: translationKey(
      'Action.ViewSnippet',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
    variant: 'standard',
  },
};

export type ActionInvokers = {
  cancelPublish: () => void;
  discardDraft: (configKey: string) => void;
  discardStagedChanges: () => void;
  forcePublish: () => void;
  deleteConfigEntry: (key: string) => void;
  publish: (params: {
    message: string;
    deploymentStrategy: DeploymentStrategy;
    onSuccess?: (data: { draftHash?: string }) => void;
    onError?: (error: ConfigActionError) => void;
  }) => Promise<void>;
  publishAs: (params: {
    message: string;
    deploymentStrategy: DeploymentStrategy;
    universeId: number;
  }) => Promise<boolean>;
  updateDraft: (params: {
    key: string;
    value: ValidConfigEntryValue;
    conditionRules?: Array<ValidConditionRule>;
    conditionNamesToUpdate?: Array<string>;
    conditionNamesToDelete?: Array<string>;
  }) => void;
  editConfigEntry: (configEntry: ValidConfigEntryDetail) => void;
  viewSnippet: (key: string, value: ValidConfigEntryValue) => void;
  copySnippet: (key: string) => void;
};

export const useConfigEntriesActions = ({
  discardDraft,
  deleteConfigEntry,
  updateDraft,
  editConfigEntry,
  viewSnippet,
  copySnippet,
}: ActionInvokers) => {
  const generateConfigEntriesActions = useCallback(
    (
      configEntry: ValidConfigEntryDetail,
    ): Record<ActionsForConfigEntry, Action<ActionsForConfigEntry, ValidConfigEntryDetail>> => {
      const key = configEntryToKey(configEntry);
      const entryValue = configEntryToBestEntryValue(configEntry);

      const result: Record<
        ActionsForConfigEntry,
        Action<ActionsForConfigEntry, ValidConfigEntryDetail>
      > = {
        [RemoteConfigAction.EditConfig]: {
          actionType: RemoteConfigAction.EditConfig,
          actionOn: configEntry,
          onActionInvoked: () => {
            editConfigEntry(configEntry);
          },
        },
        [RemoteConfigAction.CopyConfigSnippet]: {
          actionType: RemoteConfigAction.CopyConfigSnippet,
          actionOn: configEntry,
          onActionInvoked: () => {
            copySnippet(key);
          },
        },
        [RemoteConfigAction.ViewConfigSnippet]: {
          actionType: RemoteConfigAction.ViewConfigSnippet,
          actionOn: configEntry,
          onActionInvoked: () => {
            if (entryValue) {
              viewSnippet(key, entryValue);
            }
          },
          disabled: !entryValue,
        },
        [RemoteConfigAction.DeleteConfig]: {
          actionType: RemoteConfigAction.DeleteConfig,
          actionOn: configEntry,
          onActionInvoked: () => {
            deleteConfigEntry(key);
          },
        },
        [RemoteConfigAction.DiscardDraft]: {
          actionType: RemoteConfigAction.DiscardDraft,
          actionOn: configEntry,
          onActionInvoked: () => {
            discardDraft(key);
          },
        },
      };

      return result;
    },
    [copySnippet, deleteConfigEntry, editConfigEntry, viewSnippet, discardDraft],
  );

  const generateConfigEntriesDraftActions = useCallback(
    (
      configEntry: ValidConfigEntryStaged,
    ): Record<
      ActionsForConfigEntryDraft,
      Action<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
    > => {
      const { key } = configEntry.overrideEntry.entry;
      const { entryValue } = configEntry.overrideEntry.entry;
      const result: Record<
        ActionsForConfigEntryDraft,
        Action<ActionsForConfigEntryDraft, ValidConfigEntryStaged>
      > = {
        [RemoteConfigAction.DiscardDraft]: {
          actionType: RemoteConfigAction.DiscardDraft,
          actionOn: configEntry,
          onActionInvoked: () => {
            discardDraft(key);
          },
        },
        [RemoteConfigAction.CopyConfigSnippet]: {
          actionType: RemoteConfigAction.CopyConfigSnippet,
          actionOn: configEntry,
          onActionInvoked: () => {
            copySnippet(key);
          },
        },
        [RemoteConfigAction.ViewConfigSnippet]: {
          actionType: RemoteConfigAction.ViewConfigSnippet,
          actionOn: configEntry,
          onActionInvoked: () => {
            if (entryValue) {
              viewSnippet(key, entryValue);
            }
          },
          disabled: !entryValue,
        },
        [RemoteConfigAction.UpdateDraft]: {
          actionType: RemoteConfigAction.UpdateDraft,
          actionOn: configEntry,
          onActionInvoked: () => {
            if (entryValue) {
              updateDraft({ key, value: entryValue });
            }
          },
          disabled: !entryValue,
        },
        [RemoteConfigAction.EditConfig]: {
          actionType: RemoteConfigAction.EditConfig,
          actionOn: configEntry,
          onActionInvoked: () => {
            editConfigEntry({
              isOverride: true,
              overrideEntry: configEntry.overrideEntry,
            });
          },
        },
      };

      return result;
    },
    [discardDraft, copySnippet, viewSnippet, updateDraft, editConfigEntry],
  );

  return {
    generateConfigEntriesActions,
    generateConfigEntriesDraftActions,
  };
};
