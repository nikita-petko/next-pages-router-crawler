import { Button, clsx as cx, Icon, Link } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { challengePrizesIllustration } from '../constants/assetConstants';
import {
  CHALLENGE_SECTION,
  challengeCategories,
  challengeGuidelines,
  challengePrizeGroups,
} from '../constants/inspireConstants';
import HallOfFame from './HallOfFame';
import Section from './Section';
import styles from './InspireChallenge.module.css';
import layoutStyles from './Layout.module.css';

function ChallengeGuidelineText({
  guidelineId,
  segments,
}: {
  guidelineId: string;
  segments: (typeof challengeGuidelines)[number]['segments'];
}) {
  return (
    <span className='text-body-medium content-default'>
      {segments.map(({ text, href }) =>
        href ? (
          <Link
            key={`${guidelineId}-${href}`}
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            isExternal={false}>
            {text}
          </Link>
        ) : (
          <span key={`${guidelineId}-${text}`}>{text}</span>
        ),
      )}
    </span>
  );
}

export default function InspireChallenge() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));

  return (
    <Section
      sectionId={CHALLENGE_SECTION.id}
      title={CHALLENGE_SECTION.title}
      subtitle={CHALLENGE_SECTION.subtitle}
      spacingClassName={layoutStyles.challengeSpacing}
      contentGapClassName='gap-xlarge medium:gap-[48px]'>
      <div className='flex flex-col gap-[48px] width-full'>
        <div className='flex flex-col gap-medium'>
          <span className='text-heading-small content-emphasis'>
            {CHALLENGE_SECTION.categoriesTitle}
          </span>
          <div className={styles.tileGrid}>
            {challengeCategories.map(({ id, title, description, iconName }) => (
              <div
                key={id}
                className={cx(
                  layoutStyles.card,
                  styles.categoryCard,
                  'padding-x-medium padding-y-xlarge medium:padding-x-large medium:padding-y-xlarge bg-surface-100',
                )}>
                <div className={styles.categoryHeader}>
                  <Icon name={iconName} />
                  <span className='text-label-large content-emphasis'>{title}</span>
                </div>
                <span className='text-body-medium content-default'>{description}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.detailsRow}>
          <div className={styles.detailsPanel}>
            <span className='text-heading-small content-emphasis'>
              {CHALLENGE_SECTION.guidelinesTitle}
            </span>
            <ul className={styles.guidelinesList}>
              {challengeGuidelines.map(({ id, segments }) => (
                <li key={id} className={styles.guidelineItem}>
                  <Icon
                    name='icon-regular-circle-check'
                    className={cx(styles.guidelineIcon, 'content-emphasis')}
                  />
                  <ChallengeGuidelineText guidelineId={id} segments={segments} />
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.detailsPanel}>
            <span className='text-heading-small content-emphasis'>
              {CHALLENGE_SECTION.prizesTitle}
            </span>
            <div className={styles.prizesPanel}>
              <div className={styles.prizesContent}>
                {challengePrizeGroups.map(({ title, description, items }) => (
                  <div key={title} className={styles.prizeGroup}>
                    <span className='text-title-medium content-emphasis'>{title}</span>
                    {description && (
                      <span className='text-body-medium content-default'>{description}</span>
                    )}
                    {items && (
                      <div className={styles.prizeItems}>
                        {items.map(({ place, value }) => (
                          <div key={place} className='flex flex-col gap-xsmall'>
                            <span className='text-body-medium content-muted'>{place}</span>
                            <span className='text-title-medium content-emphasis'>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <span className={cx('text-caption-medium content-muted', styles.prizesDisclaimer)}>
                  {CHALLENGE_SECTION.prizesDisclaimer}
                </span>
              </div>
              <div className={styles.prizesIllustration} aria-hidden='true'>
                <img src={challengePrizesIllustration} alt='' />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.submitRow}>
          <Button
            as='a'
            href={CHALLENGE_SECTION.submitUrl}
            target='_blank'
            rel='noopener noreferrer'
            variant='Emphasis'
            size={isMobile ? 'Small' : 'Medium'}>
            {CHALLENGE_SECTION.submitLabel}
          </Button>
        </div>
        <HallOfFame embedded />
      </div>
    </Section>
  );
}
