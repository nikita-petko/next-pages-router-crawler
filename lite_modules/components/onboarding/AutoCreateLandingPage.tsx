import { Button, Icon, Link } from '@rbx/foundation-ui';
import { memo } from 'react';

import styles from '@components/onboarding/AutoCreateLandingPage.module.css';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { GetSitetestBaseUrl } from '@utils/url';

const ADS_MANAGER_DOCS_URL = 'https://create.roblox.com/docs/production/promotion/ads-manager';

interface AutoCreateLandingPageProps {
  getStartedDisabled: boolean;
  hasVerifiedEmail: boolean;
  onGetStartedClick: () => void;
}

const resourceData = [
  {
    bodyKey: 'Description.GetDiscovered',
    href: ADS_MANAGER_DOCS_URL,
    titleKey: 'Heading.GetDiscovered',
  },
  {
    bodyKey: 'Description.ImprovePlayerRetention',
    href: ADS_MANAGER_DOCS_URL,
    titleKey: 'Heading.ImprovePlayerRetention',
  },
  {
    bodyKey: 'Description.ControlYourGrowth',
    href: ADS_MANAGER_DOCS_URL,
    titleKey: 'Heading.ControlYourGrowth',
  },
] as const;

const AutoCreateLandingPage = memo(
  ({ getStartedDisabled, hasVerifiedEmail, onGetStartedClick }: AutoCreateLandingPageProps) => {
    const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
    const { translate: translateLanding } = useNamespacedTranslation(TranslationNamespace.Landing);
    const { translate: translateNavigation } = useNamespacedTranslation(
      TranslationNamespace.Navigation,
    );
    const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);

    return (
      <div className='flex flex-col bg-system-contrast'>
        {!hasVerifiedEmail ? (
          <div
            className={`flex items-center justify-between gap-medium ${styles.warningBanner}`}
            role='alert'>
            <div className={`flex items-center gap-small ${styles.warningContent}`}>
              <Icon className={styles.warningIcon} name='icon-filled-triangle' size='Small' />
              <span className={styles.warningText}>
                {translateLanding('Description.VerifyEmailBanner')}
              </span>
            </div>
            <Link
              className={styles.verifyEmailLink}
              href={`https://www.${GetSitetestBaseUrl()}/my/account`}
              isExternal={false}
              rel='noopener noreferrer'
              target='_blank'>
              {translateAccount('Heading.VerifyEmail')}
            </Link>
          </div>
        ) : null}

        <section className={`relative clip ${styles.heroSection}`}>
          <img
            alt=''
            aria-hidden
            className={`absolute inset-0 ${styles.heroImage}`}
            src={`${process.env.assetPathPrefix}/common/new_hero_ads_Manager_2026.png`}
          />
          <div className={`absolute inset-0 ${styles.heroOverlay}`} />
          <div className={`relative flex flex-col gap-large ${styles.heroContent}`}>
            <h1 className={`content-emphasis ${styles.heroTitle}`}>
              {translateLanding('Heading.HeroTitleV2')}
            </h1>
            <Button
              className={styles.getStartedButton}
              isDisabled={getStartedDisabled}
              onClick={onGetStartedClick}
              size='Medium'
              variant='Emphasis'>
              {translateLanding('Action.GetStarted')}
            </Button>
          </div>
        </section>

        <section className={`flex flex-col ${styles.resourceSection}`}>
          <h2 className={`content-emphasis ${styles.resourceHeading}`}>
            {translateNavigation('Label.Resources')}
          </h2>
          <div className={styles.resourceCardGrid}>
            {resourceData.map((resource) => (
              <div className='flex flex-col' key={resource.titleKey}>
                <h3 className={`content-emphasis ${styles.resourceTitle}`}>
                  {translateLanding(resource.titleKey)}
                </h3>
                <p className={`grow content-muted ${styles.resourceBody}`}>
                  {translateLanding(resource.bodyKey)}
                </p>
                <Button
                  as='a'
                  className={styles.learnMoreButton}
                  href={resource.href}
                  rel='noopener noreferrer'
                  size='Medium'
                  target='_blank'
                  variant='Utility'>
                  {translateReport('Action.LearnMoreManage')}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  },
);

export default AutoCreateLandingPage;
