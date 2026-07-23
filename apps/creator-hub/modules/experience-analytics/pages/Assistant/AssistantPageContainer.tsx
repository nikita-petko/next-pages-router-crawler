import type { FC } from 'react';
import AssistantPage from '@modules/analytics-assistant/components/layout/AssistantPage';
import { AssistantSurfaceProvider } from '@modules/analytics-assistant/context/AssistantSurfaceContextProvider';
import ExperienceAnalyticsConvAIProvider from '@modules/experience-analytics-shared/context/ExperienceAnalyticsConvAIProvider';
import { OnboardingTipsProvider } from '@modules/experience-analytics-shared/context/OnboardingTipsProvider';

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
