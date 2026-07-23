import { useState, useEffect } from 'react';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';

// Whitelist endpoint to check if user has access to developer subscriptions
export default function useExperienceSubscriptionPermission(universeId: number) {
  const [hasSubscriptionPermission, setSubscriptionPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { canUserEditExperienceSubscription } =
          await experienceSubscriptionsClient.canUserAccessSubscriptions(universeId);
        setSubscriptionPermission(canUserEditExperienceSubscription ?? false);
      } catch {
        setSubscriptionPermission(false);
      }
    })();
  }, [universeId]);

  return hasSubscriptionPermission;
}
