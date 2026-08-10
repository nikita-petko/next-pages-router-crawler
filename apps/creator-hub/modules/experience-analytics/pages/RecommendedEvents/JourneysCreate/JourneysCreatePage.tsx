import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import type { Control, UseFormGetValues, UseFormTrigger } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { TStepperStep } from '@rbx/foundation-ui';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Button,
  IconButton,
  ProgressCircle,
  Snackbar,
  Stepper,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '@modules/charts-generic/components/HighlightingCodeBlock/HighlightingCodeBlock';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { Link } from '@modules/miscellaneous/components';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import generateJourneySnippet from './generateJourneySnippet';
import type { JourneyNameError, NodeNameError } from './journeyValidation';
import {
  NODES_PER_STAGE_MAX,
  STAGES_PER_JOURNEY_MAX,
  STAGES_PER_JOURNEY_MIN,
  getDuplicateNodeIds,
  getJourneyNameError,
  getNodeNameError,
} from './journeyValidation';
import { useJourneyConfigs, useSaveJourneyConfig } from './useJourneyConfigStorage';
import type { JourneyEntry } from './useJourneyConfigStorage';

const journeysDocsLink = '/docs/production/analytics/journey-events';

enum JourneyStep {
  Configure = 0,
  AddToCode = 1,
}

// ── types ─────────────────────────────────────────────────────────────────────

type JourneyFormValues = {
  name: string;
  stages: Array<{
    nodes: Array<{ eventName: string }>;
  }>;
};

// ── conversion helpers ────────────────────────────────────────────────────────

function makeEmptyJourney(): JourneyFormValues {
  return {
    name: '',
    stages: [{ nodes: [{ eventName: '' }] }, { nodes: [{ eventName: '' }] }],
  };
}

function entryToFormValues(entry: JourneyEntry): JourneyFormValues {
  return {
    name: entry.journeyName,
    stages: [...entry.config.stages]
      .sort((a, b) => a.stage_index - b.stage_index)
      .map((stage) => ({
        nodes: stage.nodes.map((node) => ({ eventName: node.node_name })),
      })),
  };
}

function formValuesToEntry(values: JourneyFormValues): JourneyEntry {
  return {
    journeyName: values.name.trim(),
    config: {
      stages: values.stages.map((stage, idx) => ({
        stage_index: idx + 1,
        nodes: stage.nodes.map((node) => ({ node_name: node.eventName.trim() })),
      })),
    },
  };
}

// ── StageFields: owns one stage's node field array ────────────────────────────

type StageFieldsProps = {
  stageIdx: number;
  control: Control<JourneyFormValues>;
  getValues: UseFormGetValues<JourneyFormValues>;
  trigger: UseFormTrigger<JourneyFormValues>;
  stageCount: number;
  onRemove: () => void;
  eventNameLabel: string;
  addNodeLabel: string;
  removeNodeLabel: string;
  removeStageLabel: string;
  nodeNamePlaceholder: string;
  translateNodeNameError: (error: NodeNameError) => string;
};

const StageFields: FC<StageFieldsProps> = ({
  stageIdx,
  control,
  getValues,
  trigger,
  stageCount,
  onRemove,
  eventNameLabel,
  addNodeLabel,
  removeNodeLabel,
  removeStageLabel,
  nodeNamePlaceholder,
  translateNodeNameError,
}) => {
  const {
    fields: nodes,
    append: appendNode,
    remove: removeNode,
  } = useFieldArray<JourneyFormValues, `stages.${number}.nodes`>({
    control,
    name: `stages.${stageIdx}.nodes`,
  });

  return (
    <div className='flex flex-col gap-medium padding-top-none padding-x-medium'>
      {nodes.map((node, nodeIdx) => (
        <div key={node.id} className='flex items-center gap-small'>
          <div className='flex gap-small grow'>
            <div className='grow min-width-0'>
              <Controller
                control={control}
                name={`stages.${stageIdx}.nodes.${nodeIdx}.eventName`}
                rules={{
                  validate: (v) => {
                    const fieldErr = getNodeNameError(v);
                    if (fieldErr !== null) {
                      return translateNodeNameError(fieldErr);
                    }
                    // duplicate check: pair RHF field ids with current values
                    const stageNodes = getValues(`stages.${stageIdx}.nodes`);
                    const nodesWithId = nodes.map((f, i) => ({
                      id: f.id,
                      eventName: stageNodes[i]?.eventName ?? '',
                    }));
                    if (getDuplicateNodeIds(nodesWithId).has(node.id)) {
                      return translateNodeNameError('duplicate');
                    }
                    return true;
                  },
                }}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Re-validate siblings so stale 'duplicate' errors clear immediately
                      void trigger(
                        nodes
                          .map((_, i) => `stages.${stageIdx}.nodes.${i}.eventName` as const)
                          .filter((_, i) => i !== nodeIdx),
                      );
                    }}
                    id={`event-${node.id}`}
                    label={nodeIdx === 0 ? eventNameLabel : undefined}
                    placeholder={nodeNamePlaceholder}
                    error={fieldState.error?.message}
                    size='Small'
                  />
                )}
              />
            </div>
          </div>
          <IconButton
            variant='Utility'
            size='Small'
            icon='icon-regular-trash-can'
            className={nodeIdx === 0 ? '[visibility:hidden]' : undefined}
            ariaLabel={removeNodeLabel}
            onClick={() => removeNode(nodeIdx)}
          />
        </div>
      ))}
      <div className='flex gap-small'>
        <Button
          variant='Standard'
          size='Small'
          icon='icon-filled-plus-small'
          isDisabled={nodes.length >= NODES_PER_STAGE_MAX}
          onClick={() => appendNode({ eventName: '' })}>
          {addNodeLabel}
        </Button>
        <Button
          variant='Alert'
          size='Small'
          isDisabled={stageCount <= STAGES_PER_JOURNEY_MIN}
          onClick={onRemove}>
          {removeStageLabel}
        </Button>
      </div>
    </div>
  );
};

// ── JourneyForm ───────────────────────────────────────────────────────────────

type JourneyFormProps = {
  defaultValues: JourneyFormValues;
  originalName?: string;
  onSaved: (entry: JourneyEntry) => void;
  onCancel: () => void;
  actionBarContainer?: HTMLElement | null;
};

const JourneyForm: FC<JourneyFormProps> = ({
  defaultValues,
  originalName,
  onSaved,
  onCancel,
  actionBarContainer,
}) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const { mutateAsync: saveConfig } = useSaveJourneyConfig();

  const {
    control,
    handleSubmit,
    setError,
    getValues,
    trigger,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JourneyFormValues>({
    defaultValues,
    mode: 'onTouched',
  });

  const {
    fields: stages,
    append: appendStage,
    remove: removeStage,
  } = useFieldArray({ control, name: 'stages' });

  // Single-expand: only one stage's fields are open at a time, so editing a
  // stage/node collapses the others. -1 means all collapsed.
  const [expandedStageIdx, setExpandedStageIdx] = useState<number>(0);

  // ── validation error messages ─────────────────────────────────────────────

  const translateJourneyNameError = (error: JourneyNameError): string => {
    switch (error) {
      case 'required':
        return tPendingTranslation(
          'Journey name is required.',
          'Validation error when journey name is empty',
          translationKey('Error.JourneyNameRequired', TranslationNamespace.Analytics),
        );
      case 'leadingUnderscore':
        return tPendingTranslation(
          "Journey name cannot start with '_'.",
          'Validation error when journey name starts with an underscore',
          translationKey('Error.JourneyNameLeadingUnderscore', TranslationNamespace.Analytics),
        );
      case 'invalidChars':
        return tPendingTranslation(
          "Journey name can only contain letters, numbers, '.', '-', and '_'.",
          'Validation error when journey name contains disallowed characters',
          translationKey('Error.JourneyNameInvalidChars', TranslationNamespace.Analytics),
        );
      case 'tooLong':
        return tPendingTranslation(
          'Journey name cannot exceed 250 characters.',
          'Validation error when journey name exceeds the maximum length',
          translationKey('Error.JourneyNameTooLong', TranslationNamespace.Analytics),
        );
      default: {
        const exhaustive: never = error;
        return String(exhaustive);
      }
    }
  };

  const translateNodeNameError = useCallback(
    (error: NodeNameError): string => {
      switch (error) {
        case 'required':
          return tPendingTranslation(
            'Node name is required.',
            'Validation error when a node event name is empty',
            translationKey('Error.NodeNameRequired', TranslationNamespace.Analytics),
          );
        case 'whitespaceOnly':
          return tPendingTranslation(
            'Node name cannot be whitespace only.',
            'Validation error when a node name contains only whitespace characters',
            translationKey('Error.NodeNameWhitespaceOnly', TranslationNamespace.Analytics),
          );
        case 'reservedPrefix':
          return tPendingTranslation(
            "Node name cannot start with '__' (reserved prefix).",
            'Validation error when a node name starts with double underscore',
            translationKey('Error.NodeNameReservedPrefix', TranslationNamespace.Analytics),
          );
        case 'forbiddenChars':
          return tPendingTranslation(
            'Node name cannot contain , " \' or line breaks.',
            'Validation error when a node name contains forbidden characters',
            translationKey('Error.NodeNameForbiddenChars', TranslationNamespace.Analytics),
          );
        case 'tooLong':
          return tPendingTranslation(
            'Node name cannot exceed 50 characters.',
            'Validation error when a node name exceeds the maximum length',
            translationKey('Error.NodeNameTooLong', TranslationNamespace.Analytics),
          );
        case 'duplicate':
          return tPendingTranslation(
            'Node names must be unique within a stage.',
            'Validation error when two nodes in the same stage share a name',
            translationKey('Error.NodeNameDuplicate', TranslationNamespace.Analytics),
          );
        default: {
          const exhaustive: never = error;
          return String(exhaustive);
        }
      }
    },
    [tPendingTranslation],
  );

  // ── save ─────────────────────────────────────────────────────────────────

  const saveErrorMessage = tPendingTranslation(
    'Failed to save. Please try again.',
    'Error message when saving a journey configuration fails',
    translationKey('Error.SaveJourney', TranslationNamespace.Analytics),
  );

  const onSubmit = useCallback(
    async (values: JourneyFormValues) => {
      if (!isDirty) {
        onSaved(formValuesToEntry(values));
        return;
      }
      try {
        const entry = formValuesToEntry(values);
        await saveConfig({ ...entry, originalName });
        onSaved(entry);
      } catch {
        setError('root.serverError', { type: 'server', message: saveErrorMessage });
      }
    },
    [isDirty, saveConfig, originalName, onSaved, setError, saveErrorMessage],
  );

  // ── labels ───────────────────────────────────────────────────────────────

  const journeyNameLabel = tPendingTranslation(
    'Journey name',
    'Label for journey name input field',
    translationKey('Label.JourneyName', TranslationNamespace.Analytics),
  );
  const eventNameLabel = tPendingTranslation(
    'Node name',
    'Label for the event node name in a journey stage',
    translationKey('Label.JourneyNodeEventName', TranslationNamespace.Analytics),
  );
  const addNodeLabel = tPendingTranslation(
    'Add node',
    'Button to add a new event node within a stage',
    translationKey('Action.AddJourneyNode', TranslationNamespace.Analytics),
  );
  const addStageLabel = tPendingTranslation(
    'Add stage',
    'Button to append a new stage to the journey config',
    translationKey('Action.AddJourneyStage', TranslationNamespace.Analytics),
  );
  const removeStageLabel = tPendingTranslation(
    'Remove stage',
    'Button to delete a stage from a journey config',
    translationKey('Action.RemoveJourneyStage', TranslationNamespace.Analytics),
  );
  const removeNodeLabel = tPendingTranslation(
    'Remove node',
    'Aria label for remove node button',
    translationKey('Action.RemoveJourneyNode', TranslationNamespace.Analytics),
  );
  const nodeNamePlaceholder = tPendingTranslation(
    'Node name',
    'Placeholder for the node name input within a journey stage',
    translationKey('Placeholder.JourneyNodeEventName', TranslationNamespace.Analytics),
  );

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <form
      id='journey-config-form'
      className='flex flex-col gap-large padding-bottom-xlarge'
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      noValidate>
      <div className='flex flex-col gap-medium'>
        <Controller
          control={control}
          name='name'
          rules={{
            validate: (v) => {
              const err = getJourneyNameError(v);
              return err === null || translateJourneyNameError(err);
            },
          }}
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              id='journey-name'
              label={journeyNameLabel}
              placeholder={tPendingTranslation(
                'Journey name',
                'Placeholder text for the journey name input',
                translationKey('Placeholder.JourneyName', TranslationNamespace.Analytics),
              )}
              helperText={
                fieldState.error == null
                  ? tPendingTranslation(
                      "Name can only contain letters, numbers, '.', '-', and '_', up to 250 characters",
                      'Helper text for journey name input describing key format constraints',
                      translationKey('HelperText.JourneyName', TranslationNamespace.Analytics),
                    )
                  : undefined
              }
              error={fieldState.error?.message}
              isRequired
              size='Medium'
            />
          )}
        />
      </div>

      <div className='flex flex-col gap-medium'>
        <h2 className='text-title-medium content-emphasis'>
          {tPendingTranslation(
            'Journey stages',
            'Section heading for the list of stages in a journey config',
            translationKey('Heading.JourneyStages', TranslationNamespace.Analytics),
          )}
        </h2>

        <div className='[border:var(--stroke-thin)_solid_var(--color-stroke-default)] radius-medium [overflow:hidden]'>
          <Accordion hasDivider isContained>
            {stages.map((stage, stageIdx) => (
              <AccordionItem
                key={stage.id}
                isOpen={expandedStageIdx === stageIdx}
                onOpenChange={(open) => setExpandedStageIdx(open ? stageIdx : -1)}>
                <AccordionItemTrigger>
                  <span className='text-title-medium content-default'>
                    {tPendingTranslation(
                      'Stage {stageNumber}',
                      'Stage heading label. {stageNumber} is replaced with the stage index.',
                      translationKey('Label.JourneyStageNumber', TranslationNamespace.Analytics),
                      { stageNumber: String(stageIdx + 1) },
                    )}
                  </span>
                </AccordionItemTrigger>
                <AccordionItemContent>
                  {/* oxlint-disable react/no-array-index-key -- index is intentional: forces StageFields remount when index shifts so useFieldArray re-subscribes to the correct path */}
                  <StageFields
                    key={`${stage.id}-${stageIdx}`}
                    stageIdx={stageIdx}
                    control={control}
                    getValues={getValues}
                    trigger={trigger}
                    stageCount={stages.length}
                    onRemove={() => {
                      // Keep the expanded index pointing at the same visual slot
                      // after a stage is removed.
                      if (expandedStageIdx === stageIdx) {
                        setExpandedStageIdx(-1);
                      } else if (expandedStageIdx > stageIdx) {
                        setExpandedStageIdx(expandedStageIdx - 1);
                      }
                      removeStage(stageIdx);
                    }}
                    eventNameLabel={eventNameLabel}
                    addNodeLabel={addNodeLabel}
                    removeNodeLabel={removeNodeLabel}
                    removeStageLabel={removeStageLabel}
                    nodeNamePlaceholder={nodeNamePlaceholder}
                    translateNodeNameError={translateNodeNameError}
                  />
                  {/* oxlint-enable react/no-array-index-key */}
                </AccordionItemContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className='flex gap-small'>
          <Button
            variant='Standard'
            size='Small'
            icon='icon-filled-plus-small'
            isDisabled={stages.length >= STAGES_PER_JOURNEY_MAX}
            onClick={() => {
              appendStage({ nodes: [{ eventName: '' }] });
              setExpandedStageIdx(stages.length);
            }}>
            {addStageLabel}
          </Button>
        </div>
      </div>

      {errors.root?.serverError?.message != null && (
        <p className='text-body-small content-system-alert margin-none'>
          {errors.root.serverError.message}
        </p>
      )}

      {actionBarContainer ? (
        createPortal(
          <div className='flex items-center gap-medium'>
            <Button
              variant='Emphasis'
              size='Medium'
              type='submit'
              form='journey-config-form'
              isLoading={isSubmitting}>
              {translate(translationKey('Action.Next', TranslationNamespace.Controls))}
            </Button>
            <Button variant='Standard' size='Medium' type='button' onClick={onCancel}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
            </Button>
          </div>,
          actionBarContainer,
        )
      ) : (
        <div className='flex items-center gap-medium padding-top-large'>
          <Button variant='Emphasis' size='Medium' type='submit' isLoading={isSubmitting}>
            {translate(translationKey('Action.Next', TranslationNamespace.Controls))}
          </Button>
          <Button variant='Standard' size='Medium' type='button' onClick={onCancel}>
            {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
          </Button>
        </div>
      )}
    </form>
  );
};

// ── JourneysCreatePage: handles loading/error, then mounts stepper ────────────

const JourneysCreatePage: FC = () => {
  const { tPendingTranslation, translate, translateHTML } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const isEdit = router.pathname.endsWith('/edit');

  const [activeStep, setActiveStep] = useState<JourneyStep>(JourneyStep.Configure);
  const [savedEntry, setSavedEntry] = useState<JourneyEntry | null>(null);
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);
  const [actionBarContainer, setActionBarContainer] = useState<HTMLDivElement | null>(null);

  useBreadcrumbRegistration(
    BreadcrumbItemType.Create,
    translate(translationKey('Action.CreateJourneyConfig', TranslationNamespace.Analytics)) ??
      undefined,
  );
  const { data: apiConfigs, isLoading, error, refetch } = useJourneyConfigs();

  const requestedJourneyName =
    typeof router.query.journeyName === 'string' ? router.query.journeyName : undefined;

  // Entry for step 2: just-saved, or (on edit) the existing API entry.
  const snippetEntry = useMemo(() => {
    if (savedEntry !== null) {
      return savedEntry;
    }
    if (isEdit && requestedJourneyName !== undefined) {
      return (apiConfigs ?? []).find((e) => e.journeyName === requestedJourneyName) ?? null;
    }
    return null;
  }, [savedEntry, isEdit, requestedJourneyName, apiConfigs]);

  const snippetText = useMemo(
    () => (snippetEntry !== null ? generateJourneySnippet(snippetEntry) : null),
    [snippetEntry],
  );

  const onCancel = useCallback(() => {
    void router.push(
      `/dashboard/creations/experiences/${String(router.query.id)}/analytics/journeys`,
    );
  }, [router]);

  const onSaved = useCallback((entry: JourneyEntry) => {
    setSavedEntry(entry);
    setActiveStep(JourneyStep.AddToCode);
  }, []);

  const onDone = useCallback(() => {
    const name = savedEntry?.journeyName ?? requestedJourneyName ?? '';
    void router.push(
      `/dashboard/creations/experiences/${String(router.query.id)}/analytics/journeys/view?filter_JourneyName=${encodeURIComponent(name)}`,
    );
  }, [savedEntry, requestedJourneyName, router]);

  const onCopyClick = useCallback(() => {
    if (snippetText === null) {
      return;
    }
    navigator.clipboard.writeText(snippetText).then(
      () => setShowCopySnackbar(true),
      () => undefined,
    );
  }, [snippetText]);

  const steps = useMemo<TStepperStep[]>(
    () => [
      {
        label: tPendingTranslation(
          'Setup',
          'First step in the journey config wizard: set up the journey stages',
          translationKey('Label.JourneyStep.Configure', TranslationNamespace.Analytics),
        ),
        description: tPendingTranslation(
          'Required',
          'Description for the first step in the journey config wizard',
          translationKey('Label.JourneyStep.ConfigureDescription', TranslationNamespace.Analytics),
        ),
      },
      {
        label: tPendingTranslation(
          'Add to code',
          'Second step in the journey config wizard: copy the generated Lua snippet',
          translationKey('Label.JourneyStep.AddToCode', TranslationNamespace.Analytics),
        ),
        description: tPendingTranslation(
          'Optional',
          'Description for the second step in the journey config wizard',
          translationKey('Label.JourneyStep.AddToCodeDescription', TranslationNamespace.Analytics),
        ),
      },
    ],
    [tPendingTranslation],
  );

  const description = (
    <Grid container>
      <AnalyticsPageDescription
        text={translateHTML(
          translationKey('Description.TakeActionJourneyEvents', TranslationNamespace.Analytics),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks: ReactNode) => (
                <Link href={journeysDocsLink} target='_blank' underline='always' color='inherit'>
                  {chunks}
                </Link>
              ),
            },
          ],
        )}
      />
    </Grid>
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center padding-xlarge'>
        <ProgressCircle
          variant='Indeterminate'
          ariaLabel={tPendingTranslation(
            'Loading journey configurations',
            'Aria label for the loading spinner while journey configs are fetched',
            translationKey('Label.LoadingJourneyConfigs', TranslationNamespace.Analytics),
          )}
        />
      </div>
    );
  }

  if (error) {
    return <LoadError onReload={refetch} />;
  }

  let defaultValues: JourneyFormValues;
  if (requestedJourneyName !== undefined) {
    const match = (apiConfigs ?? []).find((e) => e.journeyName === requestedJourneyName);
    defaultValues = match !== undefined ? entryToFormValues(match) : makeEmptyJourney();
  } else {
    defaultValues = makeEmptyJourney();
  }

  return (
    <div className='flex flex-col width-full min-height-[calc(100vh-280px)]'>
      {showCopySnackbar && (
        <Snackbar
          title={tPendingTranslation(
            'Copied to clipboard',
            'Snackbar shown after copying the journey code snippet',
            translationKey('Toast.JourneySnippetCopied', TranslationNamespace.Analytics),
          )}
          shouldAutoDismiss
          onClose={() => setShowCopySnackbar(false)}
        />
      )}

      <div className='width-full [max-width:720px]'>
        {description}

        <div className='margin-bottom-large'>
          <Stepper steps={steps} currentStepIndex={activeStep} size='Medium' showDescription />
        </div>

        {activeStep === JourneyStep.Configure && (
          <JourneyForm
            key={requestedJourneyName ?? 'new'}
            defaultValues={defaultValues}
            originalName={requestedJourneyName}
            onSaved={onSaved}
            onCancel={onCancel}
            actionBarContainer={actionBarContainer}
          />
        )}

        {activeStep === JourneyStep.AddToCode && snippetEntry !== null && (
          <div className='margin-top-large'>
            <p className='text-title-medium content-emphasis margin-none margin-bottom-small'>
              {tPendingTranslation(
                'Code snippet',
                'Label above the generated Lua code block',
                translationKey('Label.JourneyCodeSnippet', TranslationNamespace.Analytics),
              )}
            </p>

            <div className='stroke-standard stroke-default padding-medium radius-medium [max-height:400px] [overflow:auto]'>
              <HighlightingCodeBlock
                code={snippetText ?? ''}
                codePreviewSnippet={snippetText ?? ''}
                language={HighlightingCodeBlockLanguage.Lua}
                expanded
              />
            </div>

            <p className='text-body-small content-muted margin-none margin-top-small'>
              {tPendingTranslation(
                'Copy the following code snippet and add to your codebase',
                'Helper text below the journey code snippet',
                translationKey('Description.JourneySnippet', TranslationNamespace.Analytics),
              )}
            </p>

            <div className='margin-top-large'>
              <Button
                type='button'
                variant='Standard'
                size='Medium'
                isDisabled={!snippetText}
                onClick={onCopyClick}>
                {tPendingTranslation(
                  'Copy',
                  'action for copy',
                  translationKey('Action.Copy', TranslationNamespace.Controls),
                )}
              </Button>
            </div>

            {actionBarContainer &&
              createPortal(
                <Button type='button' variant='Emphasis' size='Medium' onClick={onDone}>
                  {tPendingTranslation(
                    'Done',
                    'Done',
                    translationKey('Action.Done', TranslationNamespace.Controls),
                  )}
                </Button>,
                actionBarContainer,
              )}
          </div>
        )}
      </div>

      {/* Action bar — pushed to page bottom via margin-top-auto */}
      <div ref={setActionBarContainer} className='padding-y-large margin-top-auto' />
    </div>
  );
};

export default JourneysCreatePage;
