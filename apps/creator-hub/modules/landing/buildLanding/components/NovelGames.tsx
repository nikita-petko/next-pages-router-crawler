import { useState, useRef, useEffect, useCallback } from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import layoutStyles from './Layout.module.css';
import styles from './NovelGames.module.css';

const ASSET_BASE_PATH = `${process.env.assetPathPrefix}/home`;

const TABS = [
  {
    id: 'genres',
    title: 'Genres',
    image: `${ASSET_BASE_PATH}/events_gdc_1.webp`,
    description:
      "RPG, strategy, and shooter games are heavily underrepresented despite strong demand from older age groups. We're seeking bold games in these core genres, plus unexpected genre mash-ups and projects that blend traditional mechanics with Roblox's avatars, social features, and cross-platform support.",
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    image: `${ASSET_BASE_PATH}/events_gdc_2.webp`,
    description:
      "Deep game mechanics, metagame systems, and skillful challenges keep players coming back. We're looking for creators who seamlessly blend depth with massive multiplayer scale, and emergent social dynamics to craft highly replayable, memorable experiences players can't find anywhere else.",
  },
  {
    id: 'visual-style',
    title: 'Visual style',
    image: `${ASSET_BASE_PATH}/events_gdc_3.webp`,
    description:
      "We're looking for games that push aesthetic boundaries and make players think \"Wait, that's Roblox?\" We're looking for teams innovating with hyper-realistic 3D assets, stylized 2.5D sprites, high fidelity avatars or any other technique that brings their vision to life in ways that are entirely new to Roblox.",
  },
];

const NUM_TABS = TABS.length;

const getScrollParent = (el: HTMLElement): HTMLElement => {
  let parent = el.parentElement;
  while (parent && parent !== document.documentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.documentElement;
};

export default function NovelGames() {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return () => {};
    }

    const scrollParent = getScrollParent(section);

    let ticking = false;
    const updateTab = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const vpHeight =
        scrollParent === document.documentElement ? window.innerHeight : scrollParent.clientHeight;

      // Transition tabs over a compact band (middle 30% of the viewport)
      // rather than the full viewport traversal.
      const sectionCenter = rect.top + rect.height / 2;
      const bandTop = vpHeight * 0.25;
      const bandBottom = vpHeight * 0.75;
      const progress = Math.max(
        0,
        Math.min(1, (bandBottom - sectionCenter) / (bandBottom - bandTop)),
      );
      const tabIndex = Math.min(NUM_TABS - 1, Math.floor(progress * NUM_TABS));
      setActiveTab(tabIndex);
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateTab);
        ticking = true;
      }
    };

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scrollParent.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  return (
    <div
      ref={sectionRef}
      className={cx(
        styles.section,
        layoutStyles.container,
        layoutStyles.maxWidthContainer,
        layoutStyles.novelGamesSpacing,
      )}>
      <div className={styles.header}>
        <span className='text-heading-large content-emphasis'>What are novel games?</span>
        <span className='text-body-large content-default'>
          Genre, gameplay, and visual style are common factors in a player&apos;s decision to try a
          new experience, especially for 18+ players. Entrance into Roblox Incubator and Jumpstart
          hinge on innovation in these areas.
        </span>
      </div>

      <div className={styles.contentCard}>
        <div className={styles.contentInner}>
          <div className={styles.imageContainer}>
            {TABS.map((tab, index) => (
              <div
                key={tab.id}
                className={cx(styles.imageSlide, index === activeTab && styles.imageSlideActive)}
                aria-hidden={index !== activeTab}>
                <img src={tab.image} alt={tab.title} className={styles.tabImage} />
              </div>
            ))}
          </div>

          <div className={styles.tabGroup} role='tablist'>
            {TABS.map((tab, index) => {
              const isActive = index === activeTab;
              return (
                <button
                  key={tab.id}
                  type='button'
                  role='tab'
                  aria-selected={isActive}
                  onClick={() => handleTabClick(index)}
                  className={cx(
                    styles.tabItem,
                    isActive ? styles.tabItemActive : styles.tabItemInactive,
                  )}>
                  <span
                    className={cx(
                      'text-label-large',
                      isActive ? 'content-emphasis' : 'content-muted',
                    )}>
                    {tab.title}
                  </span>
                  <div
                    className={cx(styles.tabDescription, isActive && styles.tabDescriptionVisible)}>
                    <div className={styles.tabDescriptionInner}>
                      <span className='text-body-medium content-default'>{tab.description}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
