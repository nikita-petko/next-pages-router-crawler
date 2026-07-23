import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { CreatorEligibilityEnum, AgeBracketEnum } from '@rbx/client-core-content-api/v1';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { idVerificationActionUrl, parentLinkActionUrl } from '../constants/tiers';
import type { TierRequirement } from '../types';
import IdVerificationDialog from './IdVerificationDialog';
import styles from './RequirementChip.module.css';

const RequirementChip: FunctionComponent<{
  requirement: TierRequirement;
  isCompleted: boolean;
  ageBracket: AgeBracketEnum;
}> = ({ requirement, isCompleted, ageBracket }) => {
  const { translate } = useTranslation();
  const [isIdDialogOpen, setIsIdDialogOpen] = useState(false);

  const shouldOpenIdDialog =
    requirement.id === CreatorEligibilityEnum.IdVerified &&
    ageBracket === AgeBracketEnum.Between13And18;

  if (requirement.comingSoon) {
    return (
      <Button size='Small' variant='Emphasis' isDisabled className={styles.chip}>
        {translate('Label.ComingSoon')}
      </Button>
    );
  }

  // There's no action that can be taken, so we do not show a button
  if (!requirement.actionUrl && !shouldOpenIdDialog) {
    return null;
  }

  if (isCompleted) {
    return (
      <Button size='Small' variant='Emphasis' isDisabled className={styles.chip}>
        {translate('Label.StatusDone')}
      </Button>
    );
  }

  const handleClick = () => {
    if (shouldOpenIdDialog) {
      setIsIdDialogOpen(true);
      return;
    }
    if (requirement.actionUrl) {
      window.open(requirement.actionUrl, '_blank');
    }
  };

  return (
    <>
      <Button
        size='Small'
        variant='SoftEmphasis'
        onClick={shouldOpenIdDialog || requirement.actionUrl ? handleClick : undefined}
        className={styles.chip}>
        {translate('Action.Start')}
      </Button>
      {shouldOpenIdDialog && (
        <IdVerificationDialog
          open={isIdDialogOpen}
          onOpenChange={setIsIdDialogOpen}
          onContinueWithId={() => {
            window.open(idVerificationActionUrl, '_blank');
            setIsIdDialogOpen(false);
          }}
          onAddParent={() => {
            window.open(parentLinkActionUrl, '_blank');
            setIsIdDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default RequirementChip;
