import { useCallback } from 'react';
import { Button, clsx as cx, CollectionCarousel } from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { ITINERARY_SECTION, itineraryCards } from '../constants/inspireConstants';
import Section from './Section';
import styles from './Itinerary.module.css';
import layoutStyles from './Layout.module.css';

function ItineraryCard({
  title,
  description,
  image,
  sectionId,
  className,
  onLearnMore,
  isMobile,
}: {
  title: string;
  description: string;
  image: string;
  sectionId: string;
  className?: string;
  onLearnMore: (sectionId: string) => void;
  isMobile: boolean;
}) {
  const handleLearnMore = useCallback(() => {
    onLearnMore(sectionId);
  }, [onLearnMore, sectionId]);

  return (
    <div
      className={cx(
        className,
        styles.cardRoot,
        layoutStyles.card,
        'flex flex-col bg-surface-100 clip',
      )}>
      <img className='width-full max-width-full aspect-16-9 object-cover' src={image} alt={title} />
      <div className='flex flex-1 flex-col gap-medium padding-medium'>
        <span className='text-heading-small small:text-heading-medium content-emphasis'>
          {title}
        </span>
        <span className='text-body-medium small:text-body-large content-default flex-1'>
          {description}
        </span>
        <div className='margin-top-auto padding-top-medium'>
          <Button variant='Standard' size={isMobile ? 'Small' : 'Medium'} onClick={handleLearnMore}>
            {ITINERARY_SECTION.learnMoreLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Itinerary() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));

  const scrollToSection = useCallback((sectionId: string) => {
    const target = document.querySelector<HTMLElement>(`[data-inspire-section="${sectionId}"]`);
    const scrollContainer = document.getElementById(SCROLL_CONTAINER_ID);
    if (!target || !scrollContainer) {
      return;
    }

    const containerTop = scrollContainer.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    scrollContainer.scrollTo({
      top: scrollContainer.scrollTop + (targetTop - containerTop),
      behavior: 'smooth',
    });
  }, []);

  return (
    <Section
      title={ITINERARY_SECTION.title}
      subtitle={ITINERARY_SECTION.subtitle}
      spacingClassName={layoutStyles.itinerarySpacing}>
      <div className={cx(styles.cardsGrid, 'hidden medium:grid')}>
        {itineraryCards.map((item) => (
          <ItineraryCard
            key={item.id}
            {...item}
            isMobile={isMobile}
            onLearnMore={scrollToSection}
          />
        ))}
      </div>
      <div className={cx(styles.carouselWrapper, 'medium:hidden')}>
        <CollectionCarousel hasMargin={false} aria-label={ITINERARY_SECTION.title}>
          {itineraryCards.map((item) => (
            <ItineraryCard
              key={item.id}
              {...item}
              className={styles.carouselCard}
              isMobile={isMobile}
              onLearnMore={scrollToSection}
            />
          ))}
        </CollectionCarousel>
      </div>
    </Section>
  );
}
