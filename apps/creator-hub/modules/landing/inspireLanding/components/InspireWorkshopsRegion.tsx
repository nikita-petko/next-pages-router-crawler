import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  clsx as cx,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useMediaQuery } from '@rbx/ui';
import Flex from '@modules/miscellaneous/components/Flex';
import { INSPIRE_EVENTS_URL, WORKSHOPS_SECTION, workshopTabs } from '../constants/inspireConstants';
import { useLocalizedWorkshopSessions } from '../hooks/useInspireLocalizedConstants';
import ExclusiveAwardBanner from './ExclusiveAwardBanner';
import FeaturedSpeakers from './FeaturedSpeakers';
import Section from './Section';
import styles from './InspireWorkshops.module.css';
import layoutStyles from './Layout.module.css';

export const INSPIRE_WORKSHOPS_SECTION_ID = 'inspire-workshops';

// First tab shows every workshop; the rest filter by day.
const workshopFilterTabs = [WORKSHOPS_SECTION.allTabLabel, ...workshopTabs];

export default function InspireWorkshopsRegion() {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('Small'));
  const [activeTab, setActiveTab] = useState<string>(WORKSHOPS_SECTION.allTabLabel);
  const workshopSessions = useLocalizedWorkshopSessions();

  const filteredSessions = useMemo(
    () =>
      activeTab === WORKSHOPS_SECTION.allTabLabel
        ? workshopSessions
        : workshopSessions.filter(({ dateLabel }) => dateLabel === activeTab),
    [activeTab, workshopSessions],
  );

  return (
    <Section
      sectionId={INSPIRE_WORKSHOPS_SECTION_ID}
      title={WORKSHOPS_SECTION.title}
      subtitle={WORKSHOPS_SECTION.subtitle}
      spacingClassName={layoutStyles.workshopsSpacing}>
      <div className='flex flex-col gap-xlarge width-full'>
        <div className={styles.scheduleGroup}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            fitBehavior='Fit'
            className={styles.tabsRoot}>
            <TabsList className={styles.tabsList}>
              {workshopFilterTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} className='padding-x-large'>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className={styles.tileGrid}>
            {filteredSessions.map(({ id, title, topic, dateLabel, time, language, speakers }) => (
              <Flex
                key={id}
                className={cx(layoutStyles.card, styles.workshopCard, 'bg-surface-100')}
                flexDirection='column'
                alignItems='flex-start'>
                <div className={styles.metaRow}>
                  <Badge label={dateLabel} />
                  <Badge label={time} />
                  <Badge label={language} />
                </div>
                <span className='text-heading-small content-emphasis'>{title}</span>
                <span className='text-body-medium content-muted'>{topic}</span>
                <div className={styles.avatarRow}>
                  {speakers
                    .slice(0, WORKSHOPS_SECTION.maxVisibleSpeakerAvatars)
                    .map((speaker, index) => (
                      <Tooltip key={speaker.name} title={speaker.name} position='top-center'>
                        <TooltipTrigger asChild>
                          <span
                            className={cx(
                              styles.avatarTrigger,
                              index > 0 && styles.avatarTriggerOverlap,
                            )}>
                            <img
                              className={styles.speakerAvatar}
                              src={speaker.image}
                              alt={speaker.name}
                            />
                          </span>
                        </TooltipTrigger>
                      </Tooltip>
                    ))}
                </div>
              </Flex>
            ))}
          </div>
          <div className={styles.registerRow}>
            <Button
              as='a'
              href={INSPIRE_EVENTS_URL}
              target='_blank'
              rel='noopener noreferrer'
              variant='Emphasis'
              size={isMobile ? 'Small' : 'Medium'}>
              {WORKSHOPS_SECTION.registerLabel}
            </Button>
          </div>
        </div>
        <div className='flex flex-col gap-xlarge width-full'>
          <ExclusiveAwardBanner inline />
          <FeaturedSpeakers embedded />
        </div>
      </div>
    </Section>
  );
}
