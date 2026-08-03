import { ExperienceSubscriptionsClientProvider } from '../../context/ExperienceSubscriptionsClientProvider';
import ExperienceSubscriptionsPageContent from './ExperienceSubscriptionsPageContent';

function ExperienceSubscriptionsPageContentContainer() {
  return (
    <ExperienceSubscriptionsClientProvider>
      <ExperienceSubscriptionsPageContent />
    </ExperienceSubscriptionsClientProvider>
  );
}

export default ExperienceSubscriptionsPageContentContainer;
