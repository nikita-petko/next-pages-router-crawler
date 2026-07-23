import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { Button, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import styles from '../shared/Layout.module.css';

const TITLE_KEY = 'Heading.StudioOnboardingEmptyTitle';
const BODY_KEY = 'Description.StudioOnboardingEmptyBody';

export const StudioOnboardingEmptyState: React.FC = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const title = translate(TITLE_KEY) || 'Apply to post on Talent Hub';
  const description =
    translate(BODY_KEY) ||
    'Apply to Talent Hub to gain access to create a studio profile for your group and start posting jobs to connect with top talent.';
  const applyLabel = translate('Action.Apply') || 'Apply';

  const handleApply = useCallback(() => {
    void router.push('/hire/my-studio/onboard');
  }, [router]);

  return (
    <div className={styles.appliedEmptyState} data-testid='studio-onboarding-empty-state'>
      <Icon name='icon-regular-person' size='XLarge' aria-hidden />
      <div className='text-align-center text-heading-medium'>{title}</div>
      <div
        className={`text-align-center content-muted text-body-medium ${styles.appliedEmptyText}`}>
        {description}
      </div>
      <Button variant='Emphasis' size='Medium' onClick={handleApply}>
        {applyLabel}
      </Button>
    </div>
  );
};
