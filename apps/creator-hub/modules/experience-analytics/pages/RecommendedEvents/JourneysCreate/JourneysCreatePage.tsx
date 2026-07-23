import type { FC } from 'react';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import type { Control } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Button,
  IconButton,
  ProgressCircle,
  TextInput,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { Link } from '@modules/miscellaneous/components';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import { useJourneyConfigs, useSaveJourneyConfig } from './useJourneyConfigStorage';
import type { JourneyEntry } from './useJourneyConfigStorage';

const journeysDocsLink = '/docs/production/analytics/journey-events';

// ── types ────────────────────────────────────────────────────────────────────

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
  stageCount: number;
  onRemove: () => void;
  eventNameLabel: string;
  addNodeLabel: string;
  removeNodeLabel: string;
  removeStageLabel: string;
  nodeNamePlaceholder: string;
};

const StageFields: FC<StageFieldsProps> = ({
  stageIdx,
  control,
  stageCount,
  onRemove,
  eventNameLabel,
  addNodeLabel,
  removeNodeLabel,
  removeStageLabel,
  nodeNamePlaceholder,
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
                rules={{ required: true, validate: (v) => v.trim().length > 0 }}
                render={({ field, fieldState }) => (
                  <TextInput
                    {...field}
                    id={`event-${node.id}`}
                    label={nodeIdx === 0 ? eventNameLabel : undefined}
                    placeholder={nodeNamePlaceholder}
                    hasError={fieldState.invalid}
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
          onClick={() => appendNode({ eventName: '' })}>
          {addNodeLabel}
        </Button>
        <Button variant='Alert' size='Small' isDisabled={stageCount <= 2} onClick={onRemove}>
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
};

const JourneyForm: FC<JourneyFormProps> = ({ defaultValues, originalName }) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const router = useRouter();
  const { mutateAsync: saveConfig } = useSaveJourneyConfig();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JourneyFormValues>({
    defaultValues,
    mode: 'onTouched',
  });

  const {
    fields: stages,
    append: appendStage,
    remove: removeStage,
  } = useFieldArray({ control, name: 'stages' });

  const saveErrorMessage = tPendingTranslation(
    'Failed to save. Please try again.',
    'Error message when saving a journey configuration fails',
    translationKey('Error.SaveJourney', TranslationNamespace.Analytics),
  );

  const onSubmit = useCallback(
    async (values: JourneyFormValues) => {
      const { id } = router.query;
      try {
        await saveConfig({ ...formValuesToEntry(values), originalName });
        void router.push(
          `/dashboard/creations/experiences/${String(id)}/analytics/journeys/view?filter_JourneyName=${encodeURIComponent(values.name.trim())}`,
        );
      } catch {
        setError('root.serverError', { type: 'server', message: saveErrorMessage });
      }
    },
    [router, saveConfig, originalName, setError, saveErrorMessage],
  );

  // ── labels ───────────────────────────────────────────────────

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
    'Button to add another node/event to this stage',
    translationKey('Action.AddNode', TranslationNamespace.Analytics),
  );
  const addStageLabel = tPendingTranslation(
    'Add stage',
    'Button to append a new stage to the journey',
    translationKey('Action.AddStage', TranslationNamespace.Analytics),
  );
  const removeStageLabel = tPendingTranslation(
    'Remove stage',
    'Button to remove this stage from the journey',
    translationKey('Action.RemoveStage', TranslationNamespace.Analytics),
  );
  const removeNodeLabel = tPendingTranslation(
    'Remove node',
    'Aria label for remove node button',
    translationKey('Action.RemoveNode', TranslationNamespace.Analytics),
  );
  const nodeNamePlaceholder = tPendingTranslation(
    'Node name',
    'Placeholder for the node name input within a journey stage',
    translationKey('Placeholder.JourneyNodeEventName', TranslationNamespace.Analytics),
  );

  // ── render ───────────────────────────────────────────────────

  return (
    <form
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
            required: true,
            pattern: /^[A-Za-z][^\s]{0,255}$/,
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
              helperText={tPendingTranslation(
                'Keys must start with a letter, have no spaces, and not exceed 256 characters',
                'Helper text for journey name input describing key format constraints',
                translationKey('HelperText.JourneyName', TranslationNamespace.Analytics),
              )}
              hasError={fieldState.invalid}
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
              <AccordionItem key={stage.id} defaultOpen={stageIdx === 0}>
                <AccordionItemTrigger>
                  <span className='text-title-medium content-default'>
                    {tPendingTranslation(
                      'Stage {stageNumber}',
                      'Accordion header for a journey stage; {stageNumber} is the 1-based stage index',
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
                    stageCount={stages.length}
                    onRemove={() => removeStage(stageIdx)}
                    eventNameLabel={eventNameLabel}
                    addNodeLabel={addNodeLabel}
                    removeNodeLabel={removeNodeLabel}
                    removeStageLabel={removeStageLabel}
                    nodeNamePlaceholder={nodeNamePlaceholder}
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
            onClick={() => appendStage({ nodes: [{ eventName: '' }] })}>
            {addStageLabel}
          </Button>
        </div>
      </div>

      {errors.root?.serverError?.message != null && (
        <p className='text-body-small content-system-alert margin-none'>
          {errors.root.serverError.message}
        </p>
      )}

      <div className='flex items-center gap-medium padding-top-large'>
        <Button variant='Emphasis' size='Medium' type='submit' isLoading={isSubmitting}>
          {translate(translationKey('Action.Save', TranslationNamespace.Controls))}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          type='button'
          onClick={() =>
            void router.push(
              `/dashboard/creations/experiences/${String(router.query.id)}/analytics/journeys`,
            )
          }>
          {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
        </Button>
      </div>
    </form>
  );
};

// ── JourneysCreatePage: handles loading/error, then mounts form ───────────────

const JourneysCreatePage: FC = () => {
  const translationObj = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(translationObj);
  const { translate, translateHTML } = translationObj;
  const router = useRouter();

  useBreadcrumbRegistration(
    BreadcrumbItemType.Create,
    translate('Action.CreateJourneyConfig') || undefined,
  );
  const { data: apiConfigs, isLoading, error, refetch } = useJourneyConfigs();

  const description = (
    <Grid container item spacing={2} wrap='nowrap'>
      <AnalyticsPageDescription
        text={translateHTML('Description.TakeActionJourneyEvents', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link href={journeysDocsLink} target='_blank' underline='always' color='inherit'>
                {chunks}
              </Link>
            ),
          },
        ])}
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

  const requestedJourneyName =
    typeof router.query.journeyName === 'string' ? router.query.journeyName : undefined;

  let defaultValues: JourneyFormValues;
  if (requestedJourneyName !== undefined) {
    const match = (apiConfigs ?? []).find((e) => e.journeyName === requestedJourneyName);
    defaultValues = match !== undefined ? entryToFormValues(match) : makeEmptyJourney();
  } else {
    defaultValues = makeEmptyJourney();
  }

  return (
    <>
      {description}
      <JourneyForm defaultValues={defaultValues} originalName={requestedJourneyName} />
    </>
  );
};

export default JourneysCreatePage;
