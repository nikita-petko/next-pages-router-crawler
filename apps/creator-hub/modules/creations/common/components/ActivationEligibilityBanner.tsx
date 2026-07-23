import React, { useState } from 'react';
import { Alert, Button, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  useGetActivationEligibilityForUniverse,
  useGetActivationEligibilityForUser,
} from '@modules/react-query/develop';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import StepsToGoPublicModal from './StepsToGoPublicModal';

type ActivationEligibilityBannerProps = {
  onLearnMoreClick?: () => void;
};

const ActivationEligibilityBanner: React.FC<ActivationEligibilityBannerProps> = ({
  onLearnMoreClick,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: activationEligibility, isLoading } =
    useGetActivationEligibilityForUniverse(universeId);

  const { data: userActivationEligibility, isLoading: userActivationEligibilityLoading } =
    useGetActivationEligibilityForUser();

  // Show banner only if User is ineligible (isEligible is false)
  const shouldShow =
    !isLoading &&
    !userActivationEligibilityLoading &&
    (activationEligibility?.isEligible === false ||
      userActivationEligibility?.isEligible === false);

  if (!shouldShow) {
    return null;
  }

  return (
    <React.Fragment>
      <Alert
        severity='info'
        variant='standard'
        action={
          <Grid item mt='-4px'>
            <Button
              size='small'
              color='inherit'
              onClick={() => {
                onLearnMoreClick?.();
                setIsModalOpen(true);
              }}>
              {translate(universeId ? 'Action.LearnMore' : 'Action.GenericLearnMore')}
            </Button>
          </Grid>
        }>
        <Typography variant='body1'>
          {translateHTML(
            universeId
              ? 'Message.ExperienceNotEligibleForPublicAccess'
              : 'Message.GenericNotEligibleForPublicAccess',
            [
              {
                opening: 'strongStart',
                closing: 'strongEnd',
                content: (chunks) => <strong>{chunks}</strong>,
              },
            ],
          )}
        </Typography>
      </Alert>
      <StepsToGoPublicModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        universeId={universeId}
      />
    </React.Fragment>
  );
};

export default withTranslation(ActivationEligibilityBanner, [TranslationNamespace.PublicPublish]);
