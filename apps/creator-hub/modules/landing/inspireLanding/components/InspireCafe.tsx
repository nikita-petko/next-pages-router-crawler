import { Button, clsx as cx, FeedbackBanner } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { CAFE_SECTION, cafeLocations } from '../constants/inspireConstants';
import Section from './Section';
import styles from './InspireCafe.module.css';
import layoutStyles from './Layout.module.css';

export const INSPIRE_CAFE_SECTION_ID = 'inspire-cafe';

export default function InspireCafe() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));

  return (
    <Section
      sectionId={INSPIRE_CAFE_SECTION_ID}
      title={CAFE_SECTION.title}
      subtitle={CAFE_SECTION.subtitle}
      spacingClassName={layoutStyles.cafeSpacing}>
      <div className='flex flex-col gap-xxlarge'>
        <FeedbackBanner
          layout='Stacked'
          variant='Emphasis'
          severity='Info'
          title={CAFE_SECTION.alertTitle}
          description={CAFE_SECTION.alertDescription}
        />
        <div className={styles.tileGrid}>
          {cafeLocations.map(({ id, location, date, applyUrl }) => (
            <div key={id} className={cx(layoutStyles.card, styles.locationCard, 'bg-surface-100')}>
              <span className='text-heading-small small:text-heading-medium content-emphasis'>
                {location}
              </span>
              <span className='text-body-medium content-muted'>{date}</span>
              <Button
                as='a'
                href={applyUrl}
                target='_blank'
                rel='noopener noreferrer'
                variant='Standard'
                size={isMobile ? 'Small' : 'Medium'}
                className={styles.applyButton}>
                {CAFE_SECTION.applyLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
