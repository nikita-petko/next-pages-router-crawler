import React, { FC } from 'react';
import GenericCanvasCard from '@modules/analytics-assistant/components/canvas/GenericCanvasCard';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BarChartIcon } from '@rbx/ui';
import { useAIChatContext } from '../../providers/AIChatProvider';

const AIChatCanvasCard: FC = () => {
  const { canvasElement } = useAIChatContext();

  return (
    <GenericCanvasCard
      header={{
        titleKey: translationKey('Label.Charts', TranslationNamespace.AnalyticsAssistant),
        icon: BarChartIcon,
      }}>
      {canvasElement}
    </GenericCanvasCard>
  );
};

export default AIChatCanvasCard;
