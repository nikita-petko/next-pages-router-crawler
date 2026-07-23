import { useContext } from 'react';
import ExperienceSubscriptionsContext from '../ExperienceSubscriptionContext';

export default function useCurrentExperienceSubscription() {
  return useContext(ExperienceSubscriptionsContext);
}
