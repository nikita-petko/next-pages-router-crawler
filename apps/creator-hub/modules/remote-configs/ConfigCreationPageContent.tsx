import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useFormContext, useWatch } from 'react-hook-form';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Stepper } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  ValidConditionRule,
  ValidConfigEntry,
  ValidConfigEntryStaged,
} from './api/validTypes';
import ConfigCreationAddTargetingStep from './components/ConfigCreationAddTargetingStep';
import ConfigCreationAddToCodeStep from './components/ConfigCreationAddToCodeStep';
import ConfigCreationDefineKeyStep from './components/ConfigCreationDefineKeyStep';
import useConfigCreationFormContext from './context/ConfigCreationFormContext';
import ConfigCreationFormProvider from './context/ConfigCreationFormProvider';
import {
  useCreateConfigMutationV2,
  useUpdateConfigMutationV2,
} from './hooks/useConfigsActionMutations';
import useRemoteConfigsPageBundle from './hooks/useRemoteConfigsPageBundle';
import type { ConfigFormData } from './types/FormData';
import { isConditionOrderDifferent } from './utils/isConditionOrderDifferent';

enum ConfigCreationStep {
  DefineKey = 0,
  AddTargeting = 1,
  AddToCode = 2,
}

const getSingleQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const emptyConditionNames: ReadonlyArray<string> = [];

const dedupeConditionNames = (conditionNames: ReadonlyArray<string>): Array<string> =>
  Array.from(new Set(conditionNames));

const getConditionNamesToDelete = ({
  publishedConditionNames,
  stagedDeletedConditionNames,
  submittedConditionNames,
}: {
  publishedConditionNames: ReadonlyArray<string>;
  stagedDeletedConditionNames: ReadonlyArray<string>;
  submittedConditionNames: ReadonlyArray<string>;
}): Array<string> => {
  const submittedConditionNamesSet = new Set(submittedConditionNames);
  return dedupeConditionNames(
    [...publishedConditionNames, ...stagedDeletedConditionNames].filter(
      (conditionName) => !submittedConditionNamesSet.has(conditionName),
    ),
  );
};

const getStagedDeletedConditionNames = (
  matchingDraft: ValidConfigEntryStaged | undefined,
): ReadonlyArray<string> => {
  if (!matchingDraft || matchingDraft.isDeleted) {
    return emptyConditionNames;
  }

  const currentConditionNames = Array.from(matchingDraft.currentConditionValue?.keys() ?? []);
  if (currentConditionNames.length === 0) {
    return emptyConditionNames;
  }

  const stagedConditionNames = new Set(matchingDraft.overrideEntry.entry.conditionValue?.keys());
  return currentConditionNames.filter((conditionName) => !stagedConditionNames.has(conditionName));
};

const getPublishedConditionNamesForMutation = ({
  matchingDraft,
  matchingPublishedConfig,
  existingConfig,
}: {
  matchingDraft: ValidConfigEntryStaged | undefined;
  matchingPublishedConfig: ValidConfigEntry | undefined;
  existingConfig: ValidConfigEntry | undefined;
}): ReadonlyArray<string> => {
  if (matchingDraft && !matchingDraft.isDeleted) {
    return Array.from(
      (matchingDraft.currentConditionValue ?? matchingPublishedConfig?.conditionValue)?.keys() ??
        [],
    );
  }

  return Array.from(existingConfig?.conditionValue?.keys() ?? []);
};

// ---------------------------------------------------------------------------
// Inner content rendered inside the ConfigCreationFormProvider so it has
// access to both FormProvider (react-hook-form) and ConfigCreationFormContext.
// ---------------------------------------------------------------------------

const ConfigCreationSteps: FC<{
  refresh: () => void;
  publishedConditionNames?: ReadonlyArray<string>;
  stagedDeletedConditionNames?: ReadonlyArray<string>;
  // Subset of staged edits: key exists only in draft (never published).
  // Those must use create mutation, not update mutation.
  isEditingDraftOnlyConfig?: boolean;
}> = ({
  refresh,
  publishedConditionNames = emptyConditionNames,
  stagedDeletedConditionNames = emptyConditionNames,
  isEditingDraftOnlyConfig = false,
}) => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const [activeStep, setActiveStep] = useState<ConfigCreationStep>(ConfigCreationStep.DefineKey);
  // Step components portal their action buttons into this container so all
  // buttons render in a single sticky footer anchored to the page bottom.
  const [actionBarContainer, setActionBarContainer] = useState<HTMLDivElement | null>(null);

  const { isEditing, transformConfigFormDataToValidConfig } = useConfigCreationFormContext();
  // Edit mode can still route through create mutation for draft-only keys.
  const shouldUseUpdateMutation = isEditing && !isEditingDraftOnlyConfig;

  const {
    control,
    formState: { isDirty },
  } = useFormContext<ConfigFormData>();
  // RHF tracks formState keys lazily via proxy subscription. We subscribe to
  // isDirty in this always-mounted step container so edits made in step 1 are
  // still reflected when step 2 mounts and decides whether submit is a no-op.

  const configKey = useWatch({ control, name: 'configKey' });

  const { createConfig, isCreating, createError } = useCreateConfigMutationV2();
  const { updateConfig, isUpdating, updateError } = useUpdateConfigMutationV2();

  const configsPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(analyticsConfigsNavigationItem, {}, universeId);
  }, [universeId]);

  const onCancel = useCallback(() => {
    void router.push(configsPageUrl);
  }, [configsPageUrl, router]);

  const onDone = useCallback(() => {
    void router.push(configsPageUrl);
  }, [configsPageUrl, router]);

  const onNextDefineKeyStep = useCallback(() => {
    setActiveStep(ConfigCreationStep.AddTargeting);
  }, []);

  const onSubmitAddTargeting = useCallback(
    (formData: ConfigFormData) => {
      const { entry, conditionalRules, conditionNames } =
        transformConfigFormDataToValidConfig(formData);
      // Compute mutation buckets against the published baseline, not the staged
      // form baseline. Staged-only conditional values should be created again
      // if present, and ignored if removed before publishing.
      const publishedConditionNamesSet = new Set(publishedConditionNames);
      const conditionNamesToUpdate = conditionNames.filter((conditionName) =>
        publishedConditionNamesSet.has(conditionName),
      );
      const conditionNamesToDelete = getConditionNamesToDelete({
        publishedConditionNames,
        stagedDeletedConditionNames,
        submittedConditionNames: conditionNames,
      });

      const onSuccess = () => {
        refresh();
        setActiveStep(ConfigCreationStep.AddToCode);
      };

      if (shouldUseUpdateMutation) {
        // Update is used when key has published base.
        // For published-backed keys, preserve pre-change behavior and update
        // existing conditional values in place (no recreate list).
        void updateConfig(
          {
            universeId,
            updateConfigurationData: { isDeleted: false, entry },
            conditionNamesToUpdate,
            conditionNamesToDelete,
            conditionalRules,
          },
          { onSuccess },
        );
        return;
      }

      // Draft-only edited keys are treated as creates in V2.
      // Rationale: key does not exist in published config, so update endpoint
      // cannot apply; we re-stage whole entry via create endpoint.
      void createConfig(
        {
          universeId,
          createConfigurationData: { isDeleted: false, entry },
          conditionalRules,
        },
        { onSuccess },
      );
    },
    [
      createConfig,
      publishedConditionNames,
      refresh,
      shouldUseUpdateMutation,
      stagedDeletedConditionNames,
      transformConfigFormDataToValidConfig,
      universeId,
      updateConfig,
    ],
  );

  const isMutationPending = isCreating || isUpdating;

  const mutationErrorMessage = useMemo(() => {
    const mutationError = shouldUseUpdateMutation ? updateError : createError;
    return mutationError?.getTranslatedErrorMessage(tPendingTranslation);
  }, [createError, shouldUseUpdateMutation, tPendingTranslation, updateError]);

  const steps = useMemo<TStepperStep[]>(() => {
    return [
      {
        label: tPendingTranslation(
          'Define key',
          'Label for the first step in the config creation stepper where the user defines the configuration key.',
          translationKey(
            'Label.ConfigCreation.Step.DefineKey',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
      {
        label: tPendingTranslation(
          'Add targeting',
          'Label for the second step in the config creation stepper where the user adds targeting rules.',
          translationKey(
            'Label.ConfigCreation.Step.AddTargeting',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
      {
        label: tPendingTranslation(
          'Add to code',
          'Label for the third step in the config creation stepper where the user integrates the config into their code.',
          translationKey(
            'Label.ConfigCreation.Step.AddToCode',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      },
    ];
  }, [tPendingTranslation]);

  const nextButtonLabel = tPendingTranslation(
    'Next',
    'Label on a button that advances to the next step in a multi-step wizard.',
    translationKey('Action.Next', TranslationNamespace.Controls),
  );
  const backButtonLabel = tPendingTranslation(
    'Back',
    'Label on a button that returns to the previous step in a multi-step wizard.',
    translationKey('Action.Back', TranslationNamespace.Controls),
  );

  return (
    <div className='flex flex-col width-full' style={{ minHeight: 'calc(100vh - 280px)' }}>
      <div style={{ width: '100%', maxWidth: 960 }}>
        <h2 style={{ margin: 0, marginBottom: 24 }}>
          {translate(
            isEditing
              ? translationKey(
                  'Dialog.CreateOrEdit.Title.Edit',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                )
              : translationKey(
                  'Dialog.CreateOrEdit.Title.Create',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
          )}
        </h2>

        <div style={{ marginBottom: 24 }}>
          <Stepper steps={steps} currentStepIndex={activeStep} size='Medium' />
        </div>

        {activeStep === ConfigCreationStep.DefineKey ? (
          <ConfigCreationDefineKeyStep
            isStepTransitionPending={false}
            nextButtonLabel={nextButtonLabel}
            onNext={onNextDefineKeyStep}
            onCancel={onCancel}
            actionBarContainer={actionBarContainer}
          />
        ) : null}

        {activeStep === ConfigCreationStep.AddTargeting ? (
          <ConfigCreationAddTargetingStep
            onSubmitAddTargeting={onSubmitAddTargeting}
            backButtonLabel={backButtonLabel}
            nextButtonLabel={nextButtonLabel}
            hasAnyFormChanges={isDirty}
            isMutationPending={isMutationPending}
            mutationErrorMessage={mutationErrorMessage}
            onBack={() => setActiveStep(ConfigCreationStep.DefineKey)}
            onCancel={onCancel}
            actionBarContainer={actionBarContainer}
          />
        ) : null}

        {activeStep === ConfigCreationStep.AddToCode ? (
          <ConfigCreationAddToCodeStep
            configKey={configKey}
            onDone={onDone}
            actionBarContainer={actionBarContainer}
          />
        ) : null}
      </div>

      {/* Sticky footer receives portaled action buttons from the active step.
          marginTop:auto pushes it to the bottom when content is shorter than
          the container; position:sticky keeps it in view while scrolling. */}
      <div
        ref={setActionBarContainer}
        className='sticky bottom-[0px] padding-y-large margin-top-auto'
        style={{ zIndex: 10 }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Outer wrapper: reads configKey from query params, fetches the existing
// config entry + rules when editing, then renders the provider + inner
// content.
// ---------------------------------------------------------------------------

type ConfigCreationPageContentProps = {
  withDraftHashValidation?: boolean;
};

const ConfigCreationPageContent: FC<ConfigCreationPageContentProps> = ({
  withDraftHashValidation = false,
}) => {
  const router = useRouter();
  const { isLoading: isLoadingUniverse } = useUniverseResource();

  const configKeyFromQuery = getSingleQueryValue(router.query.configKey) ?? '';
  const isEditMode = !!configKeyFromQuery;
  const [hasCompletedInitialEditLoad, setHasCompletedInitialEditLoad] = useState(!isEditMode);

  const {
    unfilteredConfigEntries,
    rules: allRules,
    ruleOrdering,
    configRequestState,
    drafts,
    draftRules,
    draftRuleOrdering,
    draftRequestState,
    refresh,
  } = useRemoteConfigsPageBundle({
    withDraftHashValidation,
  });

  const matchingDraft = useMemo(() => {
    if (!isEditMode) {
      return undefined;
    }
    // Staged/draft rows represent newest working copy. Prefer this when present.
    return drafts.find(
      (draft) => !draft.isDeleted && draft.overrideEntry.entry.key === configKeyFromQuery,
    );
  }, [isEditMode, drafts, configKeyFromQuery]);

  const matchingPublishedConfig = useMemo<ValidConfigEntry | undefined>(() => {
    if (!isEditMode) {
      return undefined;
    }
    // Published row is fallback baseline when no staged row exists for key.
    const entryDetail = unfilteredConfigEntries.find((entryDetailGiven) => {
      const entry = entryDetailGiven.overrideEntry?.entry;
      return entry && 'key' in entry && entry.key === configKeyFromQuery;
    });
    const entry = entryDetail?.overrideEntry?.entry;
    if (!entry || !('entryValue' in entry) || !entry.entryValue) {
      return undefined;
    }
    return entry;
  }, [isEditMode, unfilteredConfigEntries, configKeyFromQuery]);

  // staged == draft in this module terminology
  const isEditingStagedConfig = !!matchingDraft;
  // key exists in draft, but no published base exists yet
  const isEditingDraftOnlyConfig = isEditingStagedConfig && !matchingPublishedConfig;

  const { existingConfig, existingRules } = useMemo<{
    existingConfig: ValidConfigEntry | undefined;
    existingRules: Map<string, ValidConditionRule> | undefined;
  }>(() => {
    if (!isEditMode) {
      return { existingConfig: undefined, existingRules: undefined };
    }

    // Priority 1: staged/draft value for key, because that is what user is editing now.
    if (matchingDraft && !matchingDraft.isDeleted) {
      const filteredRules = new Map<string, ValidConditionRule>();
      matchingDraft.overrideEntry.entry.conditionValue?.forEach((_, conditionName) => {
        const rule = draftRules.get(conditionName) ?? allRules.get(conditionName);
        if (rule) {
          filteredRules.set(conditionName, rule);
        }
      });
      return {
        existingConfig: matchingDraft.overrideEntry.entry,
        existingRules: filteredRules,
      };
    }

    // Priority 2: published value for key when there is no staged draft entry.
    if (!matchingPublishedConfig) {
      return { existingConfig: undefined, existingRules: undefined };
    }

    const entry = matchingPublishedConfig;

    const filteredRules = new Map<string, ValidConditionRule>();
    entry.conditionValue?.forEach((_, conditionName) => {
      const rule = allRules.get(conditionName);
      if (rule) {
        filteredRules.set(conditionName, rule);
      }
    });

    return { existingConfig: entry, existingRules: filteredRules };
  }, [isEditMode, matchingDraft, matchingPublishedConfig, draftRules, allRules]);

  // Conditional values already published for this key must be updated; staged-only
  // conditional values must be sent as creates again when editing the draft.
  const publishedConditionNames = useMemo(
    () =>
      getPublishedConditionNamesForMutation({
        matchingDraft,
        matchingPublishedConfig,
        existingConfig,
      }),
    [existingConfig, matchingDraft, matchingPublishedConfig],
  );

  // Draft rows preserve deleted conditional values in currentConditionValue so
  // later edits can keep sending those deletes instead of resurrecting them.
  const stagedDeletedConditionNames = useMemo(
    () => getStagedDeletedConditionNames(matchingDraft),
    [matchingDraft],
  );

  // Dropdown source for "Use existing condition" must reflect the active staged
  // condition list. Draft rules add staged-only conditions, while staged rule
  // ordering removes conditions that were staged for deletion.
  const allRulesIncludingDrafts = useMemo<Map<string, ValidConditionRule>>(() => {
    const merged = new Map<string, ValidConditionRule>(allRules);
    draftRules.forEach((rule, name) => {
      merged.set(name, rule);
    });

    const stagedConditionOrder = draftRuleOrdering?.conditionOrder;
    if (!isConditionOrderDifferent(ruleOrdering?.conditionOrder, stagedConditionOrder)) {
      return merged;
    }

    return new Map(
      (stagedConditionOrder ?? [])
        .map((conditionName) => {
          const rule = merged.get(conditionName);
          return rule ? ([conditionName, rule] as const) : undefined;
        })
        .filter((entry): entry is readonly [string, ValidConditionRule] => !!entry),
    );
  }, [allRules, draftRules, draftRuleOrdering?.conditionOrder, ruleOrdering?.conditionOrder]);

  // We block the edit page on the initial fetch only. After initial data is ready,
  // subsequent refreshes should not remount the stepper (which would reset to step 1).
  useEffect(() => {
    setHasCompletedInitialEditLoad(!isEditMode);
  }, [isEditMode, configKeyFromQuery]);

  useEffect(() => {
    if (
      isEditMode &&
      !configRequestState.isDataLoading &&
      !draftRequestState.isDataLoading &&
      !hasCompletedInitialEditLoad
    ) {
      setHasCompletedInitialEditLoad(true);
    }
  }, [
    configRequestState.isDataLoading,
    draftRequestState.isDataLoading,
    hasCompletedInitialEditLoad,
    isEditMode,
  ]);

  if (
    isLoadingUniverse ||
    (isEditMode &&
      !hasCompletedInitialEditLoad &&
      (configRequestState.isDataLoading || draftRequestState.isDataLoading))
  ) {
    return <PageLoading />;
  }

  return (
    <ConfigCreationFormProvider
      existingConfig={existingConfig}
      existingRules={existingRules}
      allRules={allRulesIncludingDrafts}>
      <ConfigCreationSteps
        refresh={refresh}
        publishedConditionNames={publishedConditionNames}
        stagedDeletedConditionNames={stagedDeletedConditionNames}
        isEditingDraftOnlyConfig={isEditingDraftOnlyConfig}
      />
    </ConfigCreationFormProvider>
  );
};

export default ConfigCreationPageContent;
