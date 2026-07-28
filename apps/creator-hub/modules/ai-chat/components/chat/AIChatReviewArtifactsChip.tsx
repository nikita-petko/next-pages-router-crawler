import type { FC } from 'react';
import React, { useCallback } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';

const AIChatReviewArtifactsChip: FC = () => {
  const { canvasElement, isCanvasOpen, toggleCanvas } = useAIChatContext();
  const { tPendingTranslation } = useRAQIV2TranslationDependencies();

  const handleCheckedChange = useCallback(() => {
    toggleCanvas();
  }, [toggleCanvas]);

  if (canvasElement === null) {
    return null;
  }

  const label = tPendingTranslation(
    'Review artifacts',
    'Control shown in the analytics AI chat that toggles the charts/artifacts panel.',
    translationKey('Label.ReviewArtifacts', TranslationNamespace.AnalyticsAssistant),
  );

  return (
    <Chip
      variant='Standard'
      size='Medium'
      text={label}
      isChecked={false}
      onCheckedChange={handleCheckedChange}
      aria-label={label}
      aria-expanded={isCanvasOpen}
    />
  );
};

export default AIChatReviewArtifactsChip;
