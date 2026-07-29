import type { FC } from 'react';
import React, { useCallback } from 'react';
import { Chip } from '@rbx/foundation-ui';
import {
  AssistantClickEventName,
  logAssistantEvent,
} from '@modules/analytics-assistant/utils/AssistantLogger';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useAIChatContext } from '../../providers/AIChatProvider';
import { useChatEventEnvelope } from '../../providers/useChatEventEnvelope';

const AIChatReviewArtifactsChip: FC = () => {
  const { canvasElement, isCanvasOpen, toggleCanvas } = useAIChatContext();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const chatEnvelope = useChatEventEnvelope();
  const { tPendingTranslation } = useRAQIV2TranslationDependencies();

  const handleCheckedChange = useCallback(() => {
    logAssistantEvent(unifiedLogger, AssistantClickEventName.AssistantChatArtifactInteract, {
      ...chatEnvelope,
      action: 'toggle_from_chip',
      // The chip toggles; report the state it is moving to.
      willOpen: !isCanvasOpen,
    });
    toggleCanvas();
  }, [chatEnvelope, unifiedLogger, isCanvasOpen, toggleCanvas]);

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
