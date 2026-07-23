import type { FC } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { CreatorTierEnum, ReasonEnum, SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import { Button, Dialog, DialogContent } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Ages16PlusThreshold,
  PublishingPermissionsRoute,
} from '../constants/audienceReachConstants';
import AudienceReachCard, { type CardMessage } from './AudienceReachCard';

interface PublishingReachCardProps {
  creatorTier: CreatorTierEnum;
  selectStatus: SelectStatusEnum;
  selectReasons: ReasonEnum[];
  contentMinimumAge: number;
  isPrivate: boolean;
  isGroupOwnedExperience: boolean;
  isCreator: boolean;
  isPublishedToGatedAudience: boolean;
}

const PublishingReachCard: FC<PublishingReachCardProps> = ({
  creatorTier,
  selectStatus,
  selectReasons,
  contentMinimumAge,
  isPrivate,
  isGroupOwnedExperience,
  isCreator,
  isPublishedToGatedAudience,
}) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const [showNonCreatorModal, setShowNonCreatorModal] = useState(false);

  const isPublic = !isPrivate;
  const hasCreatorEligibilityReason = selectReasons.includes(ReasonEnum.CreatorEligibility);
  // The API only surfaces the Threshold reason when the experience hasn't met
  // the qualified-player bar, so its absence is the "QPP qualifies" signal.
  const hasQualifyingQpp = !selectReasons.includes(ReasonEnum.Threshold);
  const isUnderSixteen = contentMinimumAge < Ages16PlusThreshold;
  const isSelectEligible = selectStatus === SelectStatusEnum.Eligible;

  let tierLabel = '';
  if (creatorTier === CreatorTierEnum.Everyone) {
    tierLabel = translate('Label.AllAges');
  }
  if (creatorTier === CreatorTierEnum.Trusted) {
    tierLabel = translate('Label.Ages16PlusAndTrustedFriends');
  }
  if (creatorTier === CreatorTierEnum.Private) {
    tierLabel = translate('Label.PersonalUse');
  }
  if (creatorTier === CreatorTierEnum.Blocked) {
    tierLabel = translate('Label.Private');
  }
  // If new creator tiers are added, they will need to be added here.

  let message: CardMessage | undefined;
  if (isPublic && isUnderSixteen && hasCreatorEligibilityReason) {
    // If the experience is select eligible or published to gated audience and the creator is no longer eligible, show the warning callout.
    if (isSelectEligible || isPublishedToGatedAudience) {
      message = {
        severity: 'Warning',
        layout: 'Inline',
        title: translate('Heading.PublishingTierAtRisk'),
        description: translate('Description.PublishingTierAtRisk'),
      };
    } else if (hasQualifyingQpp) {
      message = {
        severity: 'Info',
        layout: 'Stacked',
        title: translate('Heading.ExpandYourReach'),
        description: translate('Description.PublishingReach'),
      };
    }
  }

  // Suppress the card-level description when a callout is shown — the Info
  // callout already carries the same copy.
  const description =
    !message && creatorTier !== CreatorTierEnum.Everyone
      ? translate('Description.PublishingReach')
      : undefined;

  const showViewRequirements =
    isPublic && isUnderSixteen && hasCreatorEligibilityReason && hasQualifyingQpp;
  const actionLabel = showViewRequirements
    ? translate('Action.ViewRequirements')
    : translate('Action.Manage');

  const handleAction = () => {
    if (!isCreator) {
      setShowNonCreatorModal(true);
      return;
    }
    void router.push(PublishingPermissionsRoute);
  };

  return (
    <>
      <AudienceReachCard
        message={message}
        title={
          isGroupOwnedExperience
            ? translate('Label.GroupPublishingReach')
            : translate('Label.YourPublishingReach')
        }
        value={tierLabel}
        description={description}
        action={{
          label: actionLabel,
          onClick: handleAction,
          variant: showViewRequirements ? 'Emphasis' : 'Standard',
        }}
      />
      <Dialog
        open={showNonCreatorModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowNonCreatorModal(false);
          }
        }}
        size='Small'
        isModal
        hasCloseAffordance={false}>
        <DialogContent>
          <div className='flex flex-col padding-large gap-medium'>
            <h2 className='text-heading-small margin-none'>
              {translate('Heading.CannotManageReach')}
            </h2>
            <p className='text-body-medium margin-none'>
              {translate('Description.ReachOutToCreator')}
            </p>
            <div>
              <Button
                variant='Standard'
                size='Small'
                className='width-full'
                onClick={() => setShowNonCreatorModal(false)}>
                {translate('Action.Acknowledge')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublishingReachCard;
