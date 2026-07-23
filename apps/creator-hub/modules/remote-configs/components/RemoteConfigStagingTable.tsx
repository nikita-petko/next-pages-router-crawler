import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useFlag } from '@rbx/flags';
import { Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Typography, EditOutlinedIcon, Grid } from '@rbx/ui';
import { isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ActionCellAction } from '@modules/charts-generic/tables/types/GenericTableType';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type {
  ValidConditionRule,
  ValidConfigEntryStaged,
  ValidRuleOrdering,
} from '../api/validTypes';
import { useUpdateConditionMutation } from '../hooks/useConditionsActionMutations';
import type { ActionInvokers } from '../hooks/useConfigEntriesActions';
import {
  RemoteConfigAction,
  RemoteConfigActionInfo,
  useConfigEntriesActions,
} from '../hooks/useConfigEntriesActions';
import type { ConfigActionError } from '../hooks/useConfigsMutation';
import { buildRuleDiffRows, ruleDraftRowKeyPrefix } from '../utils/buildRuleDiffRows';
import { isRuleOrderingDifferent } from '../utils/isConditionOrderDifferent';
import ConfigDiffTable from './ConfigDiffTable';
import EditConditionDialog from './EditConditionDialog';

const floatingSnackbarContainerStyle: CSSProperties = {
  position: 'fixed',
  bottom: 'max(var(--padding-xxlarge, 32px), env(safe-area-inset-bottom))',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1400,
  pointerEvents: 'none',
};

const floatingSnackbarStyle: CSSProperties = {
  position: 'relative',
  pointerEvents: 'auto',
};

const createSyntheticActionPayload = (key: string): ValidConfigEntryStaged => ({
  isDeleted: false,
  isPublishing: false,
  currentValue: null,
  overrideEntry: {
    entry: {
      key,
      entryValue: {
        valueType: ValidConfigEntryValueType.String,
        stringValue: '',
      },
    },
  },
});

export type RemoteConfigStagingTableProps = GenericChartState & {
  drafts: ValidConfigEntryStaged[];
  rules?: Map<string, ValidConditionRule>;
  draftRules?: Map<string, ValidConditionRule>;
  isPublishing: boolean;
  currentRuleOrdering?: ValidRuleOrdering;
  stagedRuleOrdering?: ValidRuleOrdering;
  lockedConfigKeys?: ReadonlySet<string>;
  lockedConditionKeys?: ReadonlySet<string>;
  onEditRuleOrdering?: () => void;
  onConditionMutationSuccess?: () => void;
} & ActionInvokers;

const EMPTY_LOCKED_KEYS: ReadonlySet<string> = new Set();

const RemoteConfigStagingTable = ({
  drafts,
  rules,
  draftRules,
  isPublishing,
  currentRuleOrdering,
  stagedRuleOrdering,
  lockedConfigKeys = EMPTY_LOCKED_KEYS,
  lockedConditionKeys = EMPTY_LOCKED_KEYS,
  onEditRuleOrdering,
  onConditionMutationSuccess,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  ...props
}: RemoteConfigStagingTableProps) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { generateConfigEntriesDraftActions } = useConfigEntriesActions(props);

  const configLockedByExperimentTooltip = String(
    tPendingTranslation(
      'Config used by scheduled or running experiment',
      'Tooltip shown when editing a remote config is blocked because it is used by an experiment.',
      translationKey(
        'Tooltip.ConfigLockedByExperiment',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  );

  const conditionLockedByExperimentTooltip = String(
    tPendingTranslation(
      'Condition used by scheduled or running experiment',
      'Tooltip shown when editing a condition is blocked because it is used by an experiment.',
      translationKey(
        'Tooltip.ConditionLockedByExperiment',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    ),
  );

  const [editingConditionDraft, setEditingConditionDraft] = useState<{
    conditionKey: string;
    rule: ValidConditionRule;
  } | null>(null);
  const [conditionActionErrorMessage, setConditionActionErrorMessage] = useState<string | null>(
    null,
  );
  const { updateCondition, isUpdating, clearUpdateError } = useUpdateConditionMutation();

  const handleConditionActionError = useCallback(
    (error: ConfigActionError) => {
      setConditionActionErrorMessage(error.getTranslatedErrorMessage(tPendingTranslation));
    },
    [tPendingTranslation],
  );

  const openEditConditionDraftDialog = useCallback(
    (conditionKey: string, rule: ValidConditionRule) => {
      setConditionActionErrorMessage(null);
      clearUpdateError();
      setEditingConditionDraft({ conditionKey, rule });
    },
    [clearUpdateError],
  );

  const closeEditConditionDraftDialog = useCallback(() => {
    setEditingConditionDraft(null);
    setConditionActionErrorMessage(null);
    clearUpdateError();
  }, [clearUpdateError]);

  const getRowActions = useCallback(
    (draft: ValidConfigEntryStaged): ActionCellAction<string, ValidConfigEntryStaged>[] => {
      const actions = generateConfigEntriesDraftActions(draft);
      const configKey = draft.overrideEntry.entry.key;
      const isLockedByExperiment = lockedConfigKeys.has(configKey);

      const orderedMenuActions = [
        RemoteConfigAction.ViewConfigSnippet,
        RemoteConfigAction.DiscardDraft,
      ] as const;

      const actionOptions: ActionCellAction<string, ValidConfigEntryStaged>[] = [
        {
          ...actions[RemoteConfigAction.EditConfig],
          renderedAsInNonCompactTable: 'dedicated-button',
          displayLabel: translate(RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey),
          Icon: EditOutlinedIcon,
          disabled: isLockedByExperiment,
          tooltipLabel: isLockedByExperiment ? configLockedByExperimentTooltip : undefined,
        },
      ];

      orderedMenuActions.forEach((actionType) => {
        actionOptions.push({
          ...actions[actionType],
          renderedAsInNonCompactTable: 'menu-item',
          color: RemoteConfigActionInfo[actionType].variant === 'alert' ? 'error' : undefined,
          displayLabel: translate(RemoteConfigActionInfo[actionType].labelKey),
        });
      });

      return actionOptions;
    },
    [
      configLockedByExperimentTooltip,
      generateConfigEntriesDraftActions,
      lockedConfigKeys,
      translate,
    ],
  );

  const getOrderingActions = useCallback(
    (): ActionCellAction<string, ValidConfigEntryStaged>[] => [
      {
        actionType: RemoteConfigAction.EditConfig,
        actionOn: createSyntheticActionPayload('rule-ordering-changes'),
        onActionInvoked: () => {
          onEditRuleOrdering?.();
        },
        disabled: !onEditRuleOrdering,
        renderedAsInNonCompactTable: 'dedicated-button',
        displayLabel: translate(RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey),
        Icon: EditOutlinedIcon,
      },
    ],
    [onEditRuleOrdering, translate],
  );

  const deletedConditionKeys = useMemo((): string[] => {
    if (!rules?.size) {
      return [];
    }
    return drafts
      .filter((draft) => draft.isDeleted && rules.has(draft.overrideEntry.entry.key))
      .map((draft) => draft.overrideEntry.entry.key);
  }, [drafts, rules]);

  const filteredDrafts = useMemo((): ValidConfigEntryStaged[] => {
    if (!deletedConditionKeys.length) {
      return drafts;
    }
    const deletedKeys = new Set(deletedConditionKeys);
    return drafts.filter(
      (draft) => !(draft.isDeleted && deletedKeys.has(draft.overrideEntry.entry.key)),
    );
  }, [deletedConditionKeys, drafts]);

  const allExtraRows = useMemo(
    () =>
      buildRuleDiffRows({
        currentRules: rules,
        stagedRules: draftRules,
        deletedConditionKeys,
        getStagedRuleActions: (conditionKey, stagedRule) => {
          const ruleDraftActionPayload = createSyntheticActionPayload(
            `${ruleDraftRowKeyPrefix}${conditionKey}`,
          );
          const isConditionLockedByExperiment = lockedConditionKeys.has(conditionKey);
          return [
            {
              actionType: RemoteConfigAction.EditConfig,
              actionOn: ruleDraftActionPayload,
              onActionInvoked: () => {
                openEditConditionDraftDialog(conditionKey, stagedRule);
              },
              disabled: isConditionLockedByExperiment,
              tooltipLabel: isConditionLockedByExperiment
                ? conditionLockedByExperimentTooltip
                : undefined,
              renderedAsInNonCompactTable: 'dedicated-button',
              displayLabel: translate(
                RemoteConfigActionInfo[RemoteConfigAction.EditConfig].labelKey,
              ),
              Icon: EditOutlinedIcon,
            },
          ];
        },
        getDeletedRuleActions: (conditionKey) => {
          const deletedDraft = drafts.find(
            (draft) => draft.isDeleted && draft.overrideEntry.entry.key === conditionKey,
          );
          return deletedDraft ? getRowActions(deletedDraft) : [];
        },
      }),
    [
      conditionLockedByExperimentTooltip,
      draftRules,
      deletedConditionKeys,
      drafts,
      getRowActions,
      lockedConditionKeys,
      openEditConditionDraftDialog,
      rules,
      translate,
    ],
  );

  const title = useMemo(() => {
    if (isPublishing) {
      return translate(
        translationKey(
          'Table.Title.Publishing',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return translate(
      translationKey('Table.Title.Staged', TranslationNamespace.UniverseConfigAndExperimentation),
    );
  }, [isPublishing, translate]);

  const { id: universeId } = useUniverseResource();
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    {
      universeId,
    },
  );
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;

  const hasContent =
    filteredDrafts.length > 0 ||
    allExtraRows.length > 0 ||
    isRuleOrderingDifferent(currentRuleOrdering, stagedRuleOrdering);

  if (!hasContent) {
    return null;
  }

  return (
    <>
      <Grid
        container
        gap={2}
        marginTop='12px'
        marginBottom='12px'
        data-testid='remote-config-staging-table'>
        <Grid item>
          <Typography variant='h2' color='primary'>
            {title}
          </Typography>
        </Grid>
        <Grid item>
          <ConfigDiffTable
            drafts={filteredDrafts}
            currentRuleOrdering={currentRuleOrdering}
            stagedRuleOrdering={stagedRuleOrdering}
            getRowActions={getRowActions}
            getOrderingActions={getOrderingActions}
            extraRows={allExtraRows}
            hover
            tableBorder={isTargetingConfigsEnabled}
            isDataLoading={isDataLoading}
            isResponseFailed={isResponseFailed}
            isUserForbidden={isUserForbidden}
          />
        </Grid>
      </Grid>

      <EditConditionDialog
        open={!!editingConditionDraft}
        onClose={closeEditConditionDraftDialog}
        existingConditionName={editingConditionDraft?.conditionKey}
        existingRule={editingConditionDraft?.rule}
        isSaving={isUpdating}
        errorMessage={editingConditionDraft ? conditionActionErrorMessage : null}
        onErrorMessageClose={() => setConditionActionErrorMessage(null)}
        onSave={(_name, updatedRule) => {
          if (!editingConditionDraft) {
            return;
          }
          setConditionActionErrorMessage(null);
          void updateCondition(editingConditionDraft.conditionKey, undefined, updatedRule, {
            onSuccess: () => {
              closeEditConditionDraftDialog();
              onConditionMutationSuccess?.();
            },
            onError: (error) => {
              handleConditionActionError(error);
            },
          });
        }}
      />
      {!editingConditionDraft && conditionActionErrorMessage ? (
        <div style={floatingSnackbarContainerStyle}>
          <Snackbar
            title={conditionActionErrorMessage}
            icon='icon-regular-triangle-exclamation'
            shouldAutoDismiss={false}
            onClose={() => setConditionActionErrorMessage(null)}
            style={floatingSnackbarStyle}
          />
        </div>
      ) : null}
    </>
  );
};
export default RemoteConfigStagingTable;
