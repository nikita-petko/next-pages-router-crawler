import { experienceSubscriptionsClient } from '@modules/clients';
import { useState, useEffect } from 'react';

// Whitelist endpoint to check if user has access to developer subscriptions
export default function useExperienceSubscriptionPermission(universeId: number) {
  const [hasSubscriptionPermission, setSubscriptionPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { canUserEditExperienceSubscription } =
          await experienceSubscriptionsClient.canUserAccessSubscriptions(universeId);
        setSubscriptionPermission(canUserEditExperienceSubscription ?? false);
      } catch (e) {
        setSubscriptionPermission(false);
      }
    })();
  }, [universeId]);

  return hasSubscriptionPermission;
}
