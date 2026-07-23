import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { V1Beta1CreatorEligibilityAction } from '@rbx/client-experience-guidelines-service/v1';
import { useAuthentication } from '@modules/authentication/providers';
import experienceGuidelinesServiceApiClient, {
  CreatorEligibility,
} from '@modules/clients/experienceGuidelinesService';
import { PageNotFound } from '@modules/miscellaneous/error';
import AgeRestricted from '../components/AgeRestricted';
import ExperienceBlocked from '../components/ExperienceBlocked';
import Upsell from '../components/Upsell';
import useCreatorEligibility from '../hooks/useCreatorEligibility';

export interface ExperienceGuidelinesProviderProps {
  // When specified, this will instruct the provider to ignore the id on the router's path
  // and instead attempt to manage the details for the specified game
  requestedGameId?: number;
}

const ExperienceGuidelinesProvider: FunctionComponent<
  React.PropsWithChildren<ExperienceGuidelinesProviderProps>
> = ({ requestedGameId, children }) => {
  const router = useRouter();
  const { user } = useAuthentication();

  const [creatorEligibility, setCreatorEligibility] = useState<CreatorEligibility | undefined>();

  const { getCreatorElibilityFromResponse } = useCreatorEligibility();

  const gameId = useMemo(() => {
    // Explicitly-specified id takes precedence over the path
    if (requestedGameId) {
      return requestedGameId;
    }

    // Fallback on the id in the path
    const { id } = router.query;

    if (typeof id !== 'string' || !id) {
      return undefined;
    }

    const parsedId = parseInt(id, 10);
    // Make sure the id is a positive integer (if it is 0 or NaN the api call doesn't work)
    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
  }, [requestedGameId, router.query]);

  const getEligibility = useCallback(async () => {
    if (gameId && user) {
      try {
        const response = await experienceGuidelinesServiceApiClient.multiGetCreatorEligibility(
          gameId,
          [user.id ?? 0],
          V1Beta1CreatorEligibilityAction.Collaboration,
          true,
        );

        setCreatorEligibility(getCreatorElibilityFromResponse(response, user?.id));
      } catch {
        // Leave disabled if unable to determine eligibility.
      }
    }
  }, [user, gameId, getCreatorElibilityFromResponse]);

  useEffect(() => {
    void getEligibility();
  }, [getEligibility]);

  if (!router.isReady) {
    return undefined;
  }

  if (gameId === undefined) {
    return <PageNotFound />;
  }

  if (creatorEligibility === CreatorEligibility.NotEligible) {
    return (
      <ExperienceBlocked>
        <AgeRestricted />
      </ExperienceBlocked>
    );
  }

  if (creatorEligibility === CreatorEligibility.NotEligibleUpsell) {
    return (
      <ExperienceBlocked>
        <Upsell />
      </ExperienceBlocked>
    );
  }

  return children;
};

export default ExperienceGuidelinesProvider;
