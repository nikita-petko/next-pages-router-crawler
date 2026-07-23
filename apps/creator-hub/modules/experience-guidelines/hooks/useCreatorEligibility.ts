import { useCallback, useState } from 'react';
import type { V1Beta1MultiGetCreatorEligibilityResponse } from '@rbx/client-experience-guidelines-service/v1';
import {
  V1Beta1CreatorEligibilityAction,
  V1Beta1IneligibilityReason,
} from '@rbx/client-experience-guidelines-service/v1';
import type { TUser } from '@modules/authentication/types';
import experienceGuidelinesServiceApiClient, {
  CreatorEligibility,
} from '@modules/clients/experienceGuidelinesService';
import { www } from '@modules/miscellaneous/urls';

export const CONTENT_UNRATED = 'unrated';
export const CONTENT_RESTRICTED = 'restricted';

function useCreatorEligibility(contentMaturity?: string) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [creatorEligibility, setCreatorEligibility] = useState<CreatorEligibility>(
    contentMaturity === CONTENT_RESTRICTED
      ? CreatorEligibility.NotEligible
      : CreatorEligibility.Eligible,
  );

  const getCreatorElibilityFromResponse = useCallback(
    (
      eligibilityResponse: V1Beta1MultiGetCreatorEligibilityResponse,
      userId?: number,
    ): CreatorEligibility => {
      const eligibility = eligibilityResponse?.eligibilityByCreator?.find(
        (eligibilityByCreator) => eligibilityByCreator.userId === userId,
      );
      if (eligibility?.userIsEligible === true) {
        return CreatorEligibility.Eligible;
      }
      if (eligibility?.ineligibilityReason === V1Beta1IneligibilityReason.AgeNotVerified) {
        return CreatorEligibility.NotEligibleUpsell;
      }
      return CreatorEligibility.NotEligible;
    },
    [],
  );

  const toggleDialog = useCallback(
    (event?: React.UIEvent<HTMLDivElement, Event>) => {
      if (event) {
        event.preventDefault();
      }
      setIsDialogOpen(!isDialogOpen);
    },
    [isDialogOpen, setIsDialogOpen],
  );

  const onConfirmButton = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>, verifyAge?: boolean) => {
      if (event) {
        event.preventDefault();
      }
      if (verifyAge === true) {
        window.open(www.getAccountSettingsUrl(), '_blank');
      }
      setIsDialogOpen(!isDialogOpen);
    },
    [isDialogOpen, setIsDialogOpen],
  );

  const getCreatorEligibility = useCallback(
    async (universeId?: number, currentUser?: TUser | null) => {
      setCreatorEligibility(CreatorEligibility.NotEligible);

      if (universeId && currentUser?.id) {
        try {
          const response = await experienceGuidelinesServiceApiClient.multiGetCreatorEligibility(
            universeId,
            [currentUser.id],
            V1Beta1CreatorEligibilityAction.Collaboration,
            true,
          );

          setCreatorEligibility(getCreatorElibilityFromResponse(response, currentUser?.id));
        } catch {
          // Leave disabled if unable to determine eligibility.
        }
      }
    },
    [getCreatorElibilityFromResponse],
  );

  return {
    getCreatorElibilityFromResponse,
    getCreatorEligibility,
    toggleDialog,
    onConfirmButton,
    setCreatorEligibility,
    creatorEligibility,
    isDialogOpen,
  };
}

export default useCreatorEligibility;
