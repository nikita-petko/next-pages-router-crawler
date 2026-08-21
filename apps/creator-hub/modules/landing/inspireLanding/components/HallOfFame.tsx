import { Button, clsx as cx, CollectionCarousel } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { gameThumbnail } from '../constants/assetConstants';
import { hallOfFameEntries, HALL_OF_FAME_SECTION } from '../constants/inspireConstants';
import Section from './Section';
import styles from './HallOfFame.module.css';
import layoutStyles from './Layout.module.css';

type HallOfFameProps = {
  embedded?: boolean;
};

type HallOfFameEntry = (typeof hallOfFameEntries)[number];

function HallOfFameCard({
  entry: { id, gameTitle, award, gameUrl },
  className,
}: {
  entry: HallOfFameEntry;
  className?: string;
}) {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));

  return (
    <div
      className={cx(
        layoutStyles.card,
        styles.entryCard,
        'flex flex-col bg-surface-100 clip overflow-hidden',
        className,
      )}>
      <div className={styles.entryImageWrap}>
        <img className={styles.entryImage} src={gameThumbnail(id)} alt={gameTitle} />
      </div>
      <Flex
        className={cx(
          'padding-x-medium padding-y-xlarge medium:padding-x-large medium:padding-y-xlarge flex-1 flex flex-col gap-xsmall',
        )}
        flexDirection='column'
        alignItems='flex-start'
        justifyContent='space-between'>
        <Flex flexDirection='column' className='gap-xsmall'>
          <span className='text-heading-small content-emphasis'>{gameTitle}</span>
          <span className='text-caption-large content-muted'>{HALL_OF_FAME_SECTION.eyebrow}</span>
          <span className='text-body-medium content-muted'>{award}</span>
        </Flex>
        <Button
          as='a'
          href={gameUrl}
          target='_blank'
          rel='noopener noreferrer'
          variant='Standard'
          size={isMobile ? 'Small' : 'Medium'}
          className='margin-top-medium'>
          {HALL_OF_FAME_SECTION.viewGameLabel}
        </Button>
      </Flex>
    </div>
  );
}

function HallOfFameSlider() {
  return (
    <CollectionCarousel hasMargin={false} aria-label='Hall of Fame' className={styles.slider}>
      {hallOfFameEntries.map((entry) => (
        <HallOfFameCard key={entry.id} entry={entry} className={styles.sliderCard} />
      ))}
    </CollectionCarousel>
  );
}

export default function HallOfFame({ embedded = false }: HallOfFameProps) {
  if (embedded) {
    return (
      <div className='flex flex-col gap-xlarge'>
        <span className='text-heading-small content-emphasis'>{HALL_OF_FAME_SECTION.title}</span>
        <HallOfFameSlider />
      </div>
    );
  }

  return (
    <Section title={HALL_OF_FAME_SECTION.title} spacingClassName={layoutStyles.challengeSpacing}>
      <HallOfFameSlider />
    </Section>
  );
}
