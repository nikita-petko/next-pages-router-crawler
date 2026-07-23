import { FC, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useFormContext, useWatch } from 'react-hook-form';
import { Stepper, TStepperStep } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  analyticsConfigsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { PageLoading } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { ErrorType } from './api/universeConfigsClientEnums';
import type { ValidConfigEntry, ValidConditionRule } from './api/validTypes';
import {
  useCreateConfigMutationV2,
  useUpdateConfigMutationV2,
} from './hooks/useConfigsActionMutations';
import { useLatestConfigurations } from './hooks/useLatestConfigurations';
import ConfigCreationDefineKeyStep from './components/ConfigCreationDefineKeyStep';
import ConfigCreationAddTargetingStep from './components/ConfigCreationAddTargetingStep';
import ConfigCreationAddToCodeStep from './components/ConfigCreationAddToCodeStep';
import type { ConfigFormData } from './types/FormData';
import ConfigCreationFormProvider from './context/ConfigCreationFormProvider';
import useConfigCreationFormContext from './context/ConfigCreationFormContext';

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

// ---------------------------------------------------------------------------
// Inner content rendered inside the ConfigCreationFormProvider so it has
// access to both FormProvider (react-hook-form) and ConfigCreationFormContext.
// ---------------------------------------------------------------------------

const ConfigCreationSteps: FC = () => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { id: universeId } = useUniverseResource();
  const [activeStep, setActiveStep] = useState<ConfigCreationStep>(ConfigCreationStep.DefineKey);

  const { isEditing, transformConfigFormDataToValidConfig } = useConfigCreationFormContext();

  const { control } = useFormContext<ConfigFormData>();

  const configKey = useWatch({ control, name: 'configKey' });

  const { createConfig, isCreating, createError } = useCreateConfigMutationV2();
  const { updateConfig, isUpdating, updateError } = useUpdateConfigMutationV2();

  const configsPageUrl = useMemo(() => {
    return buildExperienceAnalyticsUrlWithParams(analyticsConfigsNavigationItem, {}, universeId);
  }, [universeId]);

  const onCancel = useCallback(() => {
    router.push(configsPageUrl);
  }, [configsPageUrl, router]);

  const onDone = useCallback(() => {
    router.push(configsPageUrl);
  }, [configsPageUrl, router]);

  const onNextDefineKeyStep = useCallback(() => {
    setActiveStep(ConfigCreationStep.AddTargeting);
  }, []);

  const onSubmitAddTargeting = useCallback(
    (formData: ConfigFormData) => {
      const { entry, conditionalRules, conditionNames } =
        transformConfigFormDataToValidConfig(formData);

      const onSuccess = () => {
        setActiveStep(ConfigCreationStep.AddToCode);
      };

      if (isEditing) {
        updateConfig(
          {
            universeId,
            updateConfigurationData: { isDeleted: false, entry },
            conditionNamesToUpdate: conditionNames,
            conditionalRules,
          },
          { onSuccess },
        );
        return;
      }

      createConfig(
        {
          universeId,
          createConfigurationData: { isDeleted: false, entry },
          conditionalRules,
        },
        { onSuccess },
      );
    },
    [createConfig, isEditing, transformConfigFormDataToValidConfig, universeId, updateConfig],
  );

  const isMutationPending = isCreating || isUpdating;

  const mutationErrorMessage = useMemo(() => {
    const mutationErrorType = isEditing ? updateError?.type : createError?.type;
    switch (mutationErrorType) {
      case 'unknown':
        return translate(
          translationKey('Error.Unknown', TranslationNamespace.UniverseConfigAndExperimentation),
        );
      case 'change-during-publish':
        return translate(
          translationKey(
            'Error.UpdateDuringPublishing',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.ReachedMaxEntries:
        return translate(
          translationKey(
            'Error.ReachedMaxEntries',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          { maxEntries: '1000' },
        );
      case ErrorType.ConfigLockedByExperiment:
        return translate(
          translationKey(
            'Error.ConfigLockedByExperiment',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.DraftMismatch:
        return translate(
          translationKey(
            'Error.DraftMismatch',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.UpdateFailed:
        return translate(
          translationKey(
            'Error.UpdateFailed',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case ErrorType.CreateKeyHasOverride:
        return translate(
          translationKey(
            'Dialog.CreateOrEdit.Error.KeyExists',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case undefined:
        return undefined;
      default: {
        const exhaustiveCheck: never = mutationErrorType;
        throw new Error(`Unhandled mutation error type ${exhaustiveCheck}`);
      }
    }
  }, [createError?.type, isEditing, translate, updateError?.type]);

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
        />
      ) : null}

      {activeStep === ConfigCreationStep.AddTargeting ? (
        <ConfigCreationAddTargetingStep
          onSubmitAddTargeting={onSubmitAddTargeting}
          backButtonLabel={backButtonLabel}
          nextButtonLabel={nextButtonLabel}
          isMutationPending={isMutationPending}
          mutationErrorMessage={mutationErrorMessage}
          onBack={() => setActiveStep(ConfigCreationStep.DefineKey)}
          onCancel={onCancel}
        />
      ) : null}

      {activeStep === ConfigCreationStep.AddToCode ? (
        <ConfigCreationAddToCodeStep configKey={configKey} onDone={onDone} />
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Outer wrapper: reads configKey from query params, fetches the existing
// config entry + rules when editing, then renders the provider + inner
// content.
// ---------------------------------------------------------------------------

const ConfigCreationPageContent: FC = () => {
  const router = useRouter();
  const { id: universeId, isLoading: isLoadingUniverse } = useUniverseResource();

  const configKeyFromQuery = getSingleQueryValue(router.query.configKey) ?? '';
  const isEditMode = !!configKeyFromQuery;

  const {
    entries,
    rules: allRules,
    isLoading: isLoadingConfigs,
  } = useLatestConfigurations({
    universeId,
    isUniverseLoading: isLoadingUniverse,
  });

  const { existingConfig, existingRules } = useMemo<{
    existingConfig: ValidConfigEntry | undefined;
    existingRules: Map<string, ValidConditionRule> | undefined;
  }>(() => {
    if (!isEditMode || entries.length === 0) {
      return { existingConfig: undefined, existingRules: undefined };
    }

    const matchingDetail = entries.find((detail) => {
      const entry = detail.overrideEntry?.entry;
      return entry && 'key' in entry && entry.key === configKeyFromQuery;
    });

    if (!matchingDetail?.overrideEntry?.entry) {
      return { existingConfig: undefined, existingRules: undefined };
    }

    const entry = matchingDetail.overrideEntry.entry as ValidConfigEntry;

    const filteredRules = new Map<string, ValidConditionRule>();
    entry.conditionValue?.forEach((_, conditionName) => {
      const rule = allRules.get(conditionName);
      if (rule) {
        filteredRules.set(conditionName, rule);
      }
    });

    return { existingConfig: entry, existingRules: filteredRules };
  }, [isEditMode, entries, configKeyFromQuery, allRules]);

  if (isLoadingUniverse || (isEditMode && isLoadingConfigs)) {
    return <PageLoading />;
  }

  return (
    <ConfigCreationFormProvider
      existingConfig={existingConfig}
      existingRules={existingRules}
      allRules={allRules}>
      <ConfigCreationSteps />
    </ConfigCreationFormProvider>
  );
};

export default ConfigCreationPageContent;
