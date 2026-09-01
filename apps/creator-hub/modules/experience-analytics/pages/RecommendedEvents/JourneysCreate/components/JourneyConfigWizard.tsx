import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import type { TStepperStep } from '@rbx/foundation-ui';
import { Button, Snackbar, Stepper } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import HighlightingCodeBlock, {
  HighlightingCodeBlockLanguage,
} from '@modules/charts-generic/components/HighlightingCodeBlock/HighlightingCodeBlock';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import generateJourneySnippet from '../generateJourneySnippet';
import type { JourneyFormValues } from '../journeyFormValues';
import type { JourneyEntry } from '../useJourneyConfigStorage';
import JourneyForm from './JourneyForm';

enum JourneyStep {
  Configure = 0,
  AddToCode = 1,
}

export type JourneyConfigWizardProps = {
  universeId: number;
  initialValues: JourneyFormValues;
  // Present only when editing; passed through to `useSaveJourneyConfig` so a
  // rename deletes the old config key when it publishes the new one.
  originalName?: string;
};

const JourneyConfigWizard: FC<JourneyConfigWizardProps> = ({
  universeId,
  initialValues,
  originalName,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const router = useRouter();

  const [activeStep, setActiveStep] = useState<JourneyStep>(JourneyStep.Configure);
  const [savedEntry, setSavedEntry] = useState<JourneyEntry | null>(null);
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);
  const [actionBarContainer, setActionBarContainer] = useState<HTMLDivElement | null>(null);

  const snippetText = useMemo(
    () => (savedEntry !== null ? generateJourneySnippet(savedEntry) : null),
    [savedEntry],
  );

  const onCancel = useCallback(() => {
    void router.push(dashboard.getAnalyticsJourneysUrl(universeId));
  }, [router, universeId]);

  const onSaved = useCallback((entry: JourneyEntry) => {
    setSavedEntry(entry);
    setActiveStep(JourneyStep.AddToCode);
  }, []);

  const onDone = useCallback(() => {
    const name = savedEntry?.journeyName ?? '';
    void router.push(dashboard.getAnalyticsJourneysViewUrl(universeId, name));
  }, [savedEntry, router, universeId]);

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
        <div className='margin-bottom-medium'>
          <Stepper steps={steps} currentStepIndex={activeStep} size='Medium' showDescription />
        </div>

        {activeStep === JourneyStep.Configure && (
          <JourneyForm
            key={originalName ?? 'new'}
            defaultValues={initialValues}
            originalName={originalName}
            onSaved={onSaved}
            onCancel={onCancel}
            actionBarContainer={actionBarContainer}
          />
        )}

        {activeStep === JourneyStep.AddToCode && savedEntry !== null && (
          <div className='margin-top-medium'>
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

            <div className='margin-top-medium'>
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

export default JourneyConfigWizard;
