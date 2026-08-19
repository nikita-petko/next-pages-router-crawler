import { useCallback, useState } from 'react';
import { Button, clsx as cx, CollectionCarousel, Link } from '@rbx/foundation-ui';
import type { Speaker } from '../constants/inspireConstants';
import { INSPIRE_EVENTS_URL, SPEAKERS_SECTION } from '../constants/inspireConstants';
import { useLocalizedFeaturedSpeakers } from '../hooks/useInspireLocalizedConstants';
import Section from './Section';
import styles from './FeaturedSpeakers.module.css';
import layoutStyles from './Layout.module.css';

type FeaturedSpeakersProps = {
  embedded?: boolean;
};

function SpeakerCard({
  speaker: { name, title, bio, image, talks },
  className,
}: {
  speaker: Speaker;
  className?: string;
}) {
  return (
    <div className={cx(styles.speakerCard, layoutStyles.card, 'clip', className)}>
      <div className={styles.speakerHeader}>
        <img className={styles.speakerAvatar} src={image} alt={name} />
        <div className={styles.speakerIdentity}>
          <span className='text-title-large content-emphasis'>{name}</span>
          <span className='text-body-medium content-muted'>{title}</span>
        </div>
      </div>
      <div className={styles.speakerBody}>
        <div className={styles.speakerBio}>
          {bio ? <span className='text-body-medium content-default'>{bio}</span> : null}
        </div>
        {talks.length > 0 ? (
          <div className={cx('flex flex-col gap-xsmall', styles.speakerTalks)}>
            <span className='text-label-large content-emphasis'>{SPEAKERS_SECTION.talkLabel}</span>
            {talks.map((talk) => (
              <Link
                key={talk}
                href={INSPIRE_EVENTS_URL}
                target='_blank'
                rel='noopener noreferrer'
                isExternal={false}
                size='Medium'
                className='text-align-x-left width-full'>
                {talk}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SpeakerGrid({ featuredSpeakers }: { featuredSpeakers: Speaker[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { initialVisibleCount } = SPEAKERS_SECTION;
  const hasHiddenSpeakers = featuredSpeakers.length > initialVisibleCount;
  const visibleSpeakers = isExpanded
    ? featuredSpeakers
    : featuredSpeakers.slice(0, initialVisibleCount);
  const toggleExpanded = useCallback(() => {
    setIsExpanded((expanded) => !expanded);
  }, []);

  return (
    <div className='flex flex-col gap-xlarge width-full'>
      <div
        className={cx(
          styles.tileGridWrapper,
          !isExpanded && hasHiddenSpeakers && styles.tileGridWrapperCollapsed,
        )}>
        <div className={styles.tileGrid}>
          {visibleSpeakers.map((speaker) => (
            <SpeakerCard key={speaker.id} speaker={speaker} />
          ))}
        </div>
        {!isExpanded && hasHiddenSpeakers ? (
          <div className={styles.tileGridFade} aria-hidden='true' />
        ) : null}
      </div>
      {hasHiddenSpeakers ? (
        <div className={styles.expandRow}>
          <Button variant='Emphasis' size='Small' onClick={toggleExpanded}>
            {isExpanded ? SPEAKERS_SECTION.seeLessLabel : SPEAKERS_SECTION.seeMoreLabel}
          </Button>
        </div>
      ) : null}
      <div className={styles.carouselWrapper}>
        <CollectionCarousel hasMargin={false} aria-label={SPEAKERS_SECTION.title}>
          {featuredSpeakers.map((speaker) => (
            <div key={speaker.id} className={styles.carouselItem}>
              <SpeakerCard speaker={speaker} className={styles.carouselCard} />
            </div>
          ))}
        </CollectionCarousel>
      </div>
    </div>
  );
}

export default function FeaturedSpeakers({ embedded = false }: FeaturedSpeakersProps) {
  const featuredSpeakers = useLocalizedFeaturedSpeakers();

  if (embedded) {
    return (
      <div className='flex flex-col gap-xlarge'>
        <span className='text-heading-small content-emphasis'>{SPEAKERS_SECTION.title}</span>
        <SpeakerGrid featuredSpeakers={featuredSpeakers} />
      </div>
    );
  }

  return (
    <Section title={SPEAKERS_SECTION.title} spacingClassName={layoutStyles.workshopsSpacing}>
      <SpeakerGrid featuredSpeakers={featuredSpeakers} />
    </Section>
  );
}
