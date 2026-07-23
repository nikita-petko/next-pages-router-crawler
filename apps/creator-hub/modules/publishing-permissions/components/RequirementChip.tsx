import { FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { TierRequirement } from '../types';
import styles from './RequirementChip.module.css';

const RequirementChip: FunctionComponent<{
  requirement: TierRequirement;
  isCompleted: boolean;
}> = ({ requirement, isCompleted }) => {
  const { translate } = useTranslation();

  if (requirement.comingSoon) {
    return (
      <Button size='Small' variant='Emphasis' isDisabled className={styles.chip}>
        {translate('Label.ComingSoon')}
      </Button>
    );
  }

  if (isCompleted) {
    return (
      <Button size='Small' variant='Emphasis' isDisabled className={styles.chip}>
        {translate('Label.StatusDone')}
      </Button>
    );
  }

  return (
    <Button
      size='Small'
      variant='Emphasis'
      onClick={
        requirement.actionUrl ? () => window.open(requirement.actionUrl, '_blank') : undefined
      }
      className={styles.chip}>
      {translate('Action.Start')}
    </Button>
  );
};

export default RequirementChip;
