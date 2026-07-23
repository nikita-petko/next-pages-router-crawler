import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import PageContent from '../components/shared/PageContent';
import { useMyStudios } from '../hooks/useMyStudios';
import styles from '../components/shared/Layout.module.css';

const CRITERION_FALLBACKS = [
  "A registered legal business name, website, and work email on your studio's domain (e.g., you@yourstudio.com).",
  'At least one full-time or part-time role, paid in USD or a local currency (not Robux). If you have commission or revenue-share work, please post it in the DevForum Collaboration section instead.',
  'At least one shipped game on Roblox or another platform.',
] as const;

const CRITERION_KEYS = [
  'Description.StudioOnboardingCriterion1',
  'Description.StudioOnboardingCriterion2',
  'Description.StudioOnboardingCriterion3',
] as const;

export function StudioOnboardingCriteria() {
  const { translate } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useMyStudios();

  useEffect(() => {
    if (!isLoading && (data?.studios.length ?? 0) > 0) {
      void router.replace('/hire/my-studio');
    }
  }, [data, isLoading, router]);

  const title = translate('Heading.StudioOnboardingCriteriaTitle') || 'Application criteria';
  const introA =
    translate('Description.StudioOnboardingCriteriaIntroA') ||
    "We're rebuilding Talent Hub to focus on full-time and part-time roles at verified studios.";
  const introB =
    translate('Description.StudioOnboardingCriteriaIntroB') ||
    'Before you start, please review the criteria below.';
  const introC =
    translate('Description.StudioOnboardingCriteriaIntroC') || 'To onboard, your studio must have:';
  const startLabel = translate('Action.StartApplication') || 'Start application';
  const cancelLabel = translate('Action.Cancel') || 'Cancel';

  const handleStart = useCallback(() => {
    void router.push('/hire/my-studio/onboard/form');
  }, [router]);

  const handleCancel = useCallback(() => {
    void router.push('/hire/my-studio');
  }, [router]);

  return (
    <PageContent testId='studio-onboarding-criteria' gap='medium'>
      <div className='gap-medium flex flex-col'>
        <h1 className='m-0 text-heading-large'>{title}</h1>
        <div className='gap-small flex flex-col text-body-large'>
          <p className='m-0'>{introA}</p>
          <p className='m-0'>{introB}</p>
          <p className='m-0'>{introC}</p>
        </div>
        <ul className={styles.criteriaList}>
          {CRITERION_KEYS.map((key, i) => (
            <li key={key} className='text-body-large'>
              {translate(key) || CRITERION_FALLBACKS[i]}
            </li>
          ))}
        </ul>
      </div>
      <div className='margin-top-large gap-small flex'>
        <Button variant='Emphasis' size='Medium' onClick={handleStart}>
          {startLabel}
        </Button>
        <Button variant='Standard' size='Medium' onClick={handleCancel}>
          {cancelLabel}
        </Button>
      </div>
    </PageContent>
  );
}
