import { ExperienceSubscriptionsClientProvider } from '@modules/experience-subscriptions/context/ExperienceSubscriptionsClientProvider';
import ItemAnalyticsPageContext from '../../context/ItemAnalyticsPageContext';
import SubscriptionsPageContent from './SubscriptionsPageContent';

const SubscriptionsPageContentContainer = () => {
  return (
    <ItemAnalyticsPageContext>
      <ExperienceSubscriptionsClientProvider>
        <SubscriptionsPageContent />
      </ExperienceSubscriptionsClientProvider>
    </ItemAnalyticsPageContext>
  );
};

export default SubscriptionsPageContentContainer;
