import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import PerformancePageContent from './PerformancePageContent';

const PerformancePageContentContainer = () => {
  return (
    <UniversePerformanceRaqiClientProvider>
      <PerformancePageContent />
    </UniversePerformanceRaqiClientProvider>
  );
};
export default PerformancePageContentContainer;
