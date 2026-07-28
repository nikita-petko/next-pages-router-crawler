import type { FC } from 'react';
import { IconButton } from '@rbx/foundation-ui';
import GenericCanvasCard from '@modules/analytics-assistant/components/canvas/GenericCanvasCard';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';

const AIChatCanvasCard: FC = () => {
  const {
    canvasElement,
    closeCanvas,
    canSelectPreviousArtifact,
    canSelectNextArtifact,
    selectPreviousArtifact,
    selectNextArtifact,
  } = useAIChatContext();
  const { tPendingTranslation } = useRAQIV2TranslationDependencies();
  const previousArtifactLabel = tPendingTranslation(
    'Previous artifact',
    'Accessible label for the button that shows the previous analytics AI chat artifact in the charts panel.',
    translationKey('Label.PreviousArtifact', TranslationNamespace.AnalyticsAssistant),
  );
  const nextArtifactLabel = tPendingTranslation(
    'Next artifact',
    'Accessible label for the button that shows the next analytics AI chat artifact in the charts panel.',
    translationKey('Label.NextArtifact', TranslationNamespace.AnalyticsAssistant),
  );

  return (
    <GenericCanvasCard
      header={{
        titleKey: translationKey('Label.Charts', TranslationNamespace.AnalyticsAssistant),
      }}
      headerControls={
        <div className='flex gap-xxsmall' style={{ marginLeft: 4 }}>
          <IconButton
            type='button'
            variant='Standard'
            size='XSmall'
            icon='icon-filled-chevron-large-left'
            ariaLabel={previousArtifactLabel}
            isDisabled={!canSelectPreviousArtifact}
            onClick={selectPreviousArtifact}
          />
          <IconButton
            type='button'
            variant='Standard'
            size='XSmall'
            icon='icon-filled-chevron-large-right'
            ariaLabel={nextArtifactLabel}
            isDisabled={!canSelectNextArtifact}
            onClick={selectNextArtifact}
          />
        </div>
      }
      onClose={closeCanvas}
      closeAriaLabel={tPendingTranslation(
        'Close charts',
        'Accessible label for the close (X) button on the charts panel in the analytics AI chat.',
        translationKey('Label.CloseChartsPanel', TranslationNamespace.AnalyticsAssistant),
      )}>
      {canvasElement}
    </GenericCanvasCard>
  );
};

export default AIChatCanvasCard;
