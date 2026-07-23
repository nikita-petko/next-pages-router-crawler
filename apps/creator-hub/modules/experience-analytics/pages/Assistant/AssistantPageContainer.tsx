import {
  ExperienceAnalyticsConvAIProvider,
  OnboardingTipsProvider,
} from '@modules/experience-analytics-shared';
import { FC } from 'react';
import AssistantPage from '@modules/analytics-assistant/components/layout/AssistantPage';
import { AssistantSurfaceProvider } from '@modules/analytics-assistant/context/AssistantSurfaceContextProvider';

const ExperienceAnalyticsAssistantPageContainer: FC = () => {
  return (
    <ExperienceAnalyticsConvAIProvider>
      <AssistantSurfaceProvider>
        <OnboardingTipsProvider>
          <AssistantPage />
        </OnboardingTipsProvider>
      </AssistantSurfaceProvider>
    </ExperienceAnalyticsConvAIProvider>
  );
};

export default ExperienceAnalyticsAssistantPageContainer;
