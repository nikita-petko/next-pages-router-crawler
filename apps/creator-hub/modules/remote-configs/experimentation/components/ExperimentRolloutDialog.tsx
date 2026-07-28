import React, { useState, useCallback, useMemo } from 'react';
import { addDays } from '@rbx/core';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  FeedbackBanner,
  ProgressCircle,
  Radio,
  RadioGroup,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { ExperimentState } from '../../api/universeExperimentationClientEnums';
import type { ValidRolloutNewCondition } from '../../api/validExperimentationTypes';
import ConfigDiffTable from '../../components/ConfigDiffTable';
import useConfigConditionNameValidator from '../../hooks/useConfigConditionNameValidator';
import { buildRuleDiffRows } from '../../utils/buildRuleDiffRows';
import {
  isExperimentRunningAndDurationMet,
  isExperimentStatsSig,
  isExperimentStoppable,
} from '../../utils/experimentProperties';
import useExperiment from '../hooks/useExperiment';
import useExperimentVariantsResults from '../hooks/useExperimentVariantsResults';
import usePreviewRollout from '../hooks/usePreviewRollout';

type ExperimentRolloutDialogProps = {
  experimentId: string;
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (params: {
    variantId: string;
    previewHash: string;
    overrides?: { conditionNames?: Record<string, string> };
  }) => void;
};

const DialogStep = {
  VariantSelection: 'variant-selection',
  Preview: 'preview',
} as const;

type DialogStep = (typeof DialogStep)[keyof typeof DialogStep];

const ExperimentRolloutDialog = ({
  experimentId,
  open,
  onClose,
  onCancel,
  onConfirm,
}: ExperimentRolloutDialogProps) => {
  const locale = useLocale();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { experiment } = useExperiment({ experimentId });
  const { experimentVariantsResults } = useExperimentVariantsResults(experimentId);

  const validateConditionName = useConfigConditionNameValidator();

  const [step, setStep] = useState<DialogStep>(DialogStep.VariantSelection);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [conditionNameOverrides, setConditionNameOverrides] = useState<Record<string, string>>({});
  const [conditionNameErrors, setConditionNameErrors] = useState<
    Record<string, string | undefined>
  >({});

  const isControlSelected =
    !!experiment &&
    !!selectedVariantId &&
    experiment.variants.some((v) => v.variantId === selectedVariantId && v.isBaseline);

  const isTargeted =
    !!experiment && 'targetingCriteria' in experiment && experiment.targetingCriteria != null;

  const needsPreview = isTargeted && !isControlSelected;

  const {
    data: previewData,
    isLoading: isPreviewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = usePreviewRollout({
    experimentId,
    variantId: selectedVariantId ?? '',
    enabled: !!selectedVariantId,
  });

  const newConditions = previewData?.newConditions ?? [];

  const ruleDiffExtraRows = useMemo(() => {
    if (!previewData) {
      return [];
    }
    return buildRuleDiffRows({
      currentRules: previewData.currentRules,
      stagedRules: previewData.rules,
      deletedConditionKeys: previewData.deletedRuleConditionKeys,
      conditionNameOverrides,
    });
  }, [conditionNameOverrides, previewData]);

  const warningBanner = useMemo(() => {
    if (!experiment || !isExperimentStoppable(experiment.state)) {
      return null;
    }

    const isDurationMet = isExperimentRunningAndDurationMet(experiment);

    if (!isDurationMet) {
      return {
        title: tPendingTranslation(
          'This experiment has not reached the decision date',
          'Warning title when experiment duration has not been met.',
          translationKey(
            'Title.ExperimentRampUpDialog.DurationNotMet',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
        description: tPendingTranslation(
          'The experiment will reach the decision date on {date}. Consider waiting until the experiment has run for the full duration.',
          'Warning description with target date when experiment duration will be met.',
          translationKey(
            'Description.ExperimentRampUpDialog.DurationNotMet',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            date:
              experiment.state === ExperimentState.Running
                ? formatDate(addDays(experiment.startedTime, experiment.durationDays), locale)
                : '',
          },
        ),
        linkHref: creatorHub.docs.getExperimentationBestPracticesUrl(),
        linkLabel: tPendingTranslation(
          'Learn more',
          'Link to experimentation best practices.',
          translationKey('Label.LearnMore', TranslationNamespace.UniverseConfigAndExperimentation),
        ),
      };
    }

    return isExperimentStatsSig({
      experiment,
      experimentVariantsResults,
    })
      ? null
      : {
          title: tPendingTranslation(
            'No variants have statistically significant changes',
            'Warning title when experiment results are not statistically significant.',
            translationKey(
              'Title.ExperimentRampUpDialog.Significant',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          description: tPendingTranslation(
            'Consider keeping your current experience (control)',
            'Warning description suggesting user keep control when stats are not significant.',
            translationKey(
              'Description.ExperimentRampUpDialog.Significant',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          linkHref: creatorHub.docs.getExperimentationBestPracticesUrl(),
          linkLabel: tPendingTranslation(
            'Learn more',
            'Link to experimentation best practices.',
            translationKey(
              'Label.LearnMore',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        };
  }, [experiment, experimentVariantsResults, locale, tPendingTranslation]);

  const handlePreviewClick = useCallback(() => {
    setStep(DialogStep.Preview);
  }, []);

  const handleApply = useCallback(() => {
    if (!selectedVariantId || !previewData) {
      return;
    }

    const nonEmptyOverrides = Object.fromEntries(
      Object.entries(conditionNameOverrides).filter(([, v]) => v !== ''),
    );
    const overrides =
      Object.keys(nonEmptyOverrides).length > 0 ? { conditionNames: nonEmptyOverrides } : undefined;

    onConfirm({
      variantId: selectedVariantId,
      previewHash: previewData.previewHash,
      overrides,
    });
  }, [selectedVariantId, previewData, conditionNameOverrides, onConfirm]);

  const handleDirectApply = useCallback(() => {
    if (!selectedVariantId || !previewData) {
      return;
    }
    onConfirm({
      variantId: selectedVariantId,
      previewHash: previewData.previewHash,
      overrides: undefined,
    });
  }, [selectedVariantId, previewData, onConfirm]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const handleConditionNameChange = useCallback(
    (autoName: string, newName: string) => {
      setConditionNameOverrides((prev) => ({ ...prev, [autoName]: newName }));
      if (newName) {
        const result = validateConditionName({ value: newName });
        setConditionNameErrors((prev) => ({
          ...prev,
          [autoName]: result.isValid ? undefined : String(result.message ?? ''),
        }));
      } else {
        setConditionNameErrors((prev) => ({ ...prev, [autoName]: undefined }));
      }
    },
    [validateConditionName],
  );

  const previewDescription = useMemo(() => {
    if (!previewData) {
      return '';
    }
    if (newConditions.length > 0) {
      return tPendingTranslation(
        'This variant will roll out as a conditional. Since there is a new condition applied, a new condition will be created for this config.',
        'Description shown in rollout preview when new targeting conditions will be created.',
        translationKey(
          'Description.RolloutDialog.NewCondition',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }
    return tPendingTranslation(
      'This variant will roll out as a conditional. Existing conditional values will be updated as follows:',
      'Description shown in rollout preview when updating existing targeting conditions.',
      translationKey(
        'Description.RolloutDialog.ExistingCondition',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
    );
  }, [previewData, newConditions.length, tPendingTranslation]);

  const description =
    step === DialogStep.Preview
      ? previewDescription
      : tPendingTranslation(
          'Select the variant to roll out to your users. This action is permanent and will stop the experiment.',
          'Description prompting user to select a variant for rollout.',
          translationKey(
            'Description.RolloutDialog.SelectVariant',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={String(
        tPendingTranslation(
          'Close',
          'Accessible label for the close button on the rollout dialog.',
          translationKey('Action.Close', TranslationNamespace.UniverseConfigAndExperimentation),
        ),
      )}
      hasDescription>
      <DialogContent>
        <DialogBody className='flex flex-col margin-bottom-[8px]'>
          <DialogTitle className='text-heading-small margin-none'>
            {tPendingTranslation(
              'Stop experiment and finalize?',
              'Title of the rollout dialog.',
              translationKey(
                'Title.RolloutDialog.StopAndFinalize',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </DialogTitle>
          <p className='text-body-medium content-muted margin-top-[8px] margin-bottom-none max-width-[500px]'>
            {description}
          </p>

          {step === DialogStep.VariantSelection && (
            <div className='flex flex-col gap-x-small margin-top-[8px]'>
              {warningBanner && (
                <FeedbackBanner
                  title={String(warningBanner.title)}
                  description={String(warningBanner.description)}
                  severity='Warning'
                  layout='Stacked'
                  variant='Standard'
                  linkLabel={String(warningBanner.linkLabel)}
                  linkHref={warningBanner.linkHref}
                />
              )}
              <div>
                <p className='text-label-large content-muted'>
                  {tPendingTranslation(
                    'Variants',
                    'Label above the radio group listing experiment variants.',
                    translationKey(
                      'Label.ExperimentRampUpDialog.Variants',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </p>
                <RadioGroup
                  value={selectedVariantId ?? ''}
                  onValueChange={setSelectedVariantId}
                  size='Medium'>
                  {experiment?.variants.map((variant) => (
                    <Radio
                      key={variant.variantId}
                      value={variant.variantId}
                      label={variant.label}
                    />
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === DialogStep.Preview && (
            <div className='flex flex-col gap-x-small margin-top-small'>
              {isPreviewLoading ? (
                <div className='flex justify-center padding-large'>
                  <ProgressCircle
                    variant='Indeterminate'
                    size='Medium'
                    ariaLabel={String(
                      tPendingTranslation(
                        'Loading preview',
                        'Accessible label for the loading spinner while preview is loading.',
                        translationKey(
                          'Label.RolloutDialog.LoadingPreview',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      ),
                    )}
                  />
                </div>
              ) : previewError ? (
                <div className='flex flex-col gap-small'>
                  <FeedbackBanner
                    title={String(
                      tPendingTranslation(
                        'Failed to load rollout preview. Please try again.',
                        'Error message when rollout preview API call fails.',
                        translationKey(
                          'Title.RolloutDialog.PreviewError',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      ),
                    )}
                    severity='Error'
                    layout='Stacked'
                    variant='Standard'
                  />
                  <Button variant='Standard' size='Medium' onClick={refetchPreview}>
                    {tPendingTranslation(
                      'Retry',
                      'Button label to retry loading the rollout preview.',
                      translationKey(
                        'Label.RolloutDialog.Retry',
                        TranslationNamespace.UniverseConfigAndExperimentation,
                      ),
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {newConditions.map((cond: ValidRolloutNewCondition) => (
                    <div key={cond.conditionName} className='max-width-[220px]'>
                      <TextInput
                        label={String(
                          tPendingTranslation(
                            'New condition name',
                            'Label for text field where user names a new targeting condition.',
                            translationKey(
                              'Label.RolloutDialog.NewConditionName',
                              TranslationNamespace.UniverseConfigAndExperimentation,
                            ),
                          ),
                        )}
                        isRequired
                        placeholder={cond.conditionName}
                        value={conditionNameOverrides[cond.conditionName] ?? ''}
                        onChange={(e) =>
                          handleConditionNameChange(cond.conditionName, e.target.value)
                        }
                        error={conditionNameErrors[cond.conditionName]}
                      />
                    </div>
                  ))}
                  {previewData && previewData.conflicts.length > 0 && (
                    <FeedbackBanner
                      title={String(
                        tPendingTranslation(
                          'Any existing conditional values on the config will be removed.',
                          'Warning title shown when rollout has conflicts with existing conditions.',
                          translationKey(
                            'Title.RolloutDialog.ConflictWarning',
                            TranslationNamespace.UniverseConfigAndExperimentation,
                          ),
                        ),
                      )}
                      severity='Warning'
                      layout='Stacked'
                      variant='Standard'
                    />
                  )}
                  {previewData && (
                    <div className='margin-top-[8px]'>
                      <ConfigDiffTable
                        drafts={previewData.entries}
                        currentRuleOrdering={previewData.currentRuleOrdering}
                        stagedRuleOrdering={previewData.stagedRuleOrdering}
                        conditionNameOverrides={conditionNameOverrides}
                        extraRows={ruleDiffExtraRows}
                        hover={false}
                        tableBorder={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <div className='flex gap-small justify-end'>
            {step === DialogStep.VariantSelection && needsPreview && (
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={handlePreviewClick}
                isDisabled={!selectedVariantId}>
                {tPendingTranslation(
                  'Preview',
                  'Button label to preview the rollout changes before finalizing.',
                  translationKey(
                    'Label.RolloutDialog.Preview',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </Button>
            )}
            {step === DialogStep.VariantSelection && !needsPreview && !!previewError && (
              <p className='text-body-small content-system-alert'>
                {tPendingTranslation(
                  'Something went wrong. Please try again.',
                  'Error text shown when rollout preview fails to load.',
                  translationKey(
                    'Error.RolloutDialog.PreviewFailed',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </p>
            )}
            {step === DialogStep.VariantSelection && !needsPreview && (
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={handleDirectApply}
                isDisabled={!selectedVariantId || !previewData || !!previewError}
                isLoading={!!selectedVariantId && isPreviewLoading}>
                {tPendingTranslation(
                  'Finalize and roll out',
                  'Button label to confirm the rollout.',
                  translationKey(
                    'Label.RolloutDialog.FinalizeAndRollOut',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </Button>
            )}
            {step === DialogStep.Preview && (
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={handleApply}
                isDisabled={
                  isPreviewLoading ||
                  !!previewError ||
                  Object.values(conditionNameErrors).some(Boolean)
                }>
                {tPendingTranslation(
                  'Finalize and roll out',
                  'Button label to confirm the rollout.',
                  translationKey(
                    'Label.RolloutDialog.FinalizeAndRollOut',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </Button>
            )}
            <Button variant='Standard' size='Medium' onClick={onCancel}>
              {tPendingTranslation(
                'Cancel',
                'Button label to cancel and close the rollout dialog.',
                translationKey(
                  'Label.ExperimentRampUpDialog.Cancel',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExperimentRolloutDialog;
