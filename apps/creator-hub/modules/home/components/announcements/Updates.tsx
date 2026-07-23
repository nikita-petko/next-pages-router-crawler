import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPrettifiedNumber } from '@rbx/core';
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  Icon,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Typography, useMediaQuery } from '@rbx/ui';
import { Carousel, LoadingCarousel } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CHANGELOG_MORE_TAG_OPTIONS, CHANGELOG_TAG_VALUES } from '@modules/updates/ChangelogTags';
import { getOrFetchTakeaways } from '@modules/updates/takeaways';
import type { TakeawaysPayload } from '@modules/updates/takeaways';
import type { TDevForumAnnouncement } from '../../utils/apiUtils';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Section from '../common/Section';
import useUpdatesStyles from './Updates.styles';
import UpdatesLoadingTile from './UpdatesLoadingTile';
import UpdatesTile from './UpdatesTile';

const maxUpdatesTiles = 20;
const visibleTilesCount = 6; // Number of tiles visible before scroll
const updatesViewAllUrl = 'https://devforum.roblox.com/c/updates/announcements/36';
const updatesPageUrl = '/updates';
const UPDATES_TOOLTIP_DISMISSED_KEY = 'creatorHub_updatesCollapseTooltipDismissed';
const UPDATES_COLLAPSE_FEATURE_LAUNCH_DATE = new Date('2026-03-25');
const UPDATES_COLLAPSE_TOOLTIP_EXPIRY_DAYS = 34;

const isCollapseTooltipExpired = (): boolean => {
  const expiryMs = UPDATES_COLLAPSE_TOOLTIP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > UPDATES_COLLAPSE_FEATURE_LAUNCH_DATE.getTime() + expiryMs;
};

const handleViewAllClick = () => {
  captureHomepageEvent('clickViewUpdates', EHomepageSection.HomePageAnnouncements);
};

interface UpdatesProps {
  announcements: TDevForumAnnouncement[] | null;
  isSingleColumn?: boolean;
  enableUpdatesNewLayoutV1?: boolean;
  isCollapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
}

const Updates: FunctionComponent<UpdatesProps> = ({
  announcements,
  isSingleColumn,
  enableUpdatesNewLayoutV1,
  isCollapsed,
  onCollapse,
  onExpand,
}) => {
  const { translate } = useTranslation();
  const { classes, cx } = useUpdatesStyles();
  const isSingleColumnMedia = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const isSingleColumnResolved = isSingleColumn ?? isSingleColumnMedia;

  const [showCollapseTooltip, setShowCollapseTooltip] = useState(false);
  const tooltipWrapperRef = useRef<HTMLDivElement>(null);
  const prevCollapsedRef = useRef(isCollapsed);

  useEffect(() => {
    if (isCollapsed && !prevCollapsedRef.current && !isCollapseTooltipExpired()) {
      try {
        const dismissed = localStorage.getItem(UPDATES_TOOLTIP_DISMISSED_KEY);
        if (dismissed !== 'true') {
          // oxlint-disable-next-line react/react-compiler
          setShowCollapseTooltip(true);
        }
      } catch {
        setShowCollapseTooltip(true);
      }
    }
    if (!isCollapsed) {
      setShowCollapseTooltip(false);
    }
    prevCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  const dismissTooltip = useCallback(() => {
    setShowCollapseTooltip(false);
    try {
      localStorage.setItem(UPDATES_TOOLTIP_DISMISSED_KEY, 'true');
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!showCollapseTooltip) {
      return undefined;
    }
    const handleClick = () => dismissTooltip();
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick, { once: true });
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [showCollapseTooltip, dismissTooltip]);
  const filterOptions = useMemo(
    () => [
      { label: translate('Label.Featured'), value: 'featured' },
      { label: translate('Label.All'), value: 'all' },
      ...CHANGELOG_MORE_TAG_OPTIONS.filter((opt) => opt.value !== 'featured'),
    ],
    [translate],
  );
  const [selectedFilter, setSelectedFilter] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFilterOpen) {
      return undefined;
    }
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        filterWrapperRef.current &&
        event.target instanceof Node &&
        !filterWrapperRef.current.contains(event.target)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isFilterOpen]);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<TDevForumAnnouncement | null>(
    null,
  );
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [takeawaysContent, setTakeawaysContent] = useState<string>('');
  const [takeawaysContentHtml, setTakeawaysContentHtml] = useState<string | null>(null);
  const takeawaysCache = useRef(new Map<string, TakeawaysPayload>());
  const takeawaysInFlight = useRef(new Map<string, Promise<TakeawaysPayload>>());

  const getDevforumJsonUrl = useCallback((url: string) => `${url}.json`, []);

  const sanitizeText = useCallback((text: string) => {
    const decoded = new DOMParser().parseFromString(text, 'text/html').textContent ?? text;
    const withoutEmoji = decoded.replaceAll(/:[a-z0-9_+-]+:/gi, '');
    const normalizedEllipsis = withoutEmoji.replaceAll(/&hellip;/gi, '...').replaceAll('…', '...');
    return normalizedEllipsis.replaceAll(/[ \t]+/g, ' ').trim();
  }, []);

  const getTakeaways = useCallback(
    async (announcement: TDevForumAnnouncement): Promise<TakeawaysPayload> => {
      return getOrFetchTakeaways({
        announcement,
        getDevforumJsonUrl,
        sanitizeText,
        takeawaysCache: takeawaysCache.current,
        takeawaysInFlight: takeawaysInFlight.current,
      });
    },
    [getDevforumJsonUrl, sanitizeText],
  );

  const viewAllUrl = enableUpdatesNewLayoutV1 ? updatesPageUrl : updatesViewAllUrl;

  const normalizeTag = useCallback(
    (tag: string) => tag.trim().toLowerCase().replaceAll(/\s+/g, '-'),
    [],
  );

  const matchesTag = useCallback(
    (announcement: TDevForumAnnouncement, tagValue: string) => {
      if (!announcement.tags || announcement.tags.length === 0) {
        return false;
      }
      return announcement.tags.some((tag) => normalizeTag(tag) === tagValue);
    },
    [normalizeTag],
  );

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) {
      return null;
    }

    const filterTag = isSingleColumnResolved ? 'featured' : selectedFilter;
    if (!filterTag || filterTag === 'all') {
      return announcements;
    }
    return announcements.filter((announcement) => matchesTag(announcement, filterTag));
  }, [announcements, isSingleColumnResolved, matchesTag, selectedFilter]);

  const hasMoreThanMax =
    filteredAnnouncements != null &&
    !isSingleColumnResolved &&
    filteredAnnouncements.length > maxUpdatesTiles;

  const mobileTilesCount = 6;
  const items = useMemo(() => {
    if (!filteredAnnouncements) {
      return [];
    }
    if (isSingleColumnResolved) {
      return filteredAnnouncements.slice(0, mobileTilesCount);
    }
    if (hasMoreThanMax) {
      return filteredAnnouncements;
    }
    return filteredAnnouncements.slice(0, maxUpdatesTiles);
  }, [filteredAnnouncements, isSingleColumnResolved, hasMoreThanMax, mobileTilesCount]);

  const needsScroll = !isSingleColumnResolved && items.length > visibleTilesCount;

  const selectedTags = Array.isArray(selectedAnnouncement?.tags)
    ? selectedAnnouncement.tags
        .filter((tag) => tag && tag.trim())
        .map((tag) => normalizeTag(tag))
        .filter((tag) => CHANGELOG_TAG_VALUES.has(tag) && tag !== 'featured')
        .map((tag) => `#${tag}`)
    : [];

  const loadingTilesCount = isSingleColumnResolved ? mobileTilesCount : maxUpdatesTiles;
  let tilesContent: React.ReactNode = null;
  if (announcements === null) {
    tilesContent = isSingleColumnResolved ? (
      <div className={classes.carouselWrapper}>
        <LoadingCarousel>
          {Array.from({ length: loadingTilesCount }, (_, i) => (
            <div key={`loading-${i}`} className={classes.carouselTileWrapper}>
              <UpdatesLoadingTile isCarousel />
            </div>
          ))}
        </LoadingCarousel>
      </div>
    ) : (
      <>
        {Array.from({ length: loadingTilesCount }, (_, i) => (
          <UpdatesLoadingTile key={`loading-${i}`} />
        ))}
      </>
    );
  } else if (items.length === 0) {
    tilesContent = (
      <div className={classes.noUpdatesContainer}>
        <div className={classes.noUpdatesTray}>
          <div className={classes.noUpdatesStack}>
            <Typography variant='smallLabel1' classes={{ root: classes.noUpdatesText }}>
              {translate('Label.NoRecentUpdates')}
            </Typography>
          </div>
        </div>
      </div>
    );
  } else {
    tilesContent = isSingleColumnResolved ? (
      <div className={classes.carouselWrapper}>
        <Carousel>
          {items.map((data, position) => (
            <div key={data.id} className={classes.carouselTileWrapper}>
              <UpdatesTile
                data={data}
                position={position}
                disableHover
                isCarousel
                onOpen={(announcement) => setSelectedAnnouncement(announcement)}
                onHover={(announcement) => {
                  getTakeaways(announcement).catch(() => {});
                }}
              />
            </div>
          ))}
        </Carousel>
      </div>
    ) : (
      <>
        {items.map((data, position) => (
          <UpdatesTile
            key={data.id}
            data={data}
            position={position}
            disableHover={false}
            onOpen={(announcement) => setSelectedAnnouncement(announcement)}
            onHover={(announcement) => {
              getTakeaways(announcement).catch(() => {});
            }}
          />
        ))}
      </>
    );
  }

  useEffect(() => {
    let isMounted = true;

    const loadTakeaways = async () => {
      if (!selectedAnnouncement) {
        setTakeawaysContent('');
        setTakeawaysContentHtml(null);
        return;
      }

      setTakeawaysContent(sanitizeText(selectedAnnouncement.excerpt ?? ''));
      setTakeawaysContentHtml(null);

      try {
        const result = await getTakeaways(selectedAnnouncement);
        if (isMounted) {
          setTakeawaysContent(result.content);
          setTakeawaysContentHtml(result.html ?? null);
        }
      } catch {
        if (isMounted) {
          setTakeawaysContent(sanitizeText(selectedAnnouncement.excerpt ?? ''));
          setTakeawaysContentHtml(null);
        }
      }
    };

    void loadTakeaways();
    return () => {
      isMounted = false;
    };
  }, [getTakeaways, sanitizeText, selectedAnnouncement]);

  useEffect(() => {
    if (!selectedAnnouncement || !items.length) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      const isInsideModal = modalContentRef.current?.contains(event.target) ?? false;
      if (!isInsideModal) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const currentIndex = items.findIndex((item) => item.id === selectedAnnouncement.id);
      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        captureHomepageEvent('clickAnnouncementNav', EHomepageSection.HomePageAnnouncements, {
          direction: 'previous',
          source: 'keyboard',
        });
        setSelectedAnnouncement(items[currentIndex - 1]);
      } else if (
        event.key === 'ArrowRight' &&
        currentIndex >= 0 &&
        currentIndex < items.length - 1
      ) {
        captureHomepageEvent('clickAnnouncementNav', EHomepageSection.HomePageAnnouncements, {
          direction: 'next',
          source: 'keyboard',
        });
        setSelectedAnnouncement(items[currentIndex + 1]);
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedAnnouncement, items]);

  if (isCollapsed && !isSingleColumnResolved) {
    return (
      <div ref={tooltipWrapperRef} className={classes.collapsedTooltipWrapper}>
        <Tooltip
          hasBeak
          delayDurationMs={0}
          open={showCollapseTooltip}
          onOpenChange={() => {}}
          title={translate('Heading.ViewUpdatesTitle')}
          description={translate('Description.ViewUpdatesToolTip')}
          position='left-center'>
          <TooltipTrigger asChild>
            <button
              type='button'
              className={classes.collapsedTab}
              onClick={() => {
                captureHomepageEvent('clickExpandUpdates', EHomepageSection.HomePageAnnouncements);
                dismissTooltip();
                onExpand?.();
              }}
              aria-label={translate('Heading.Updates')}>
              <svg
                width='20'
                height='20'
                viewBox='0 0 20 20'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M6.79199 14.1562C6.5624 14.6698 6.15477 15.0977 5.62305 15.3437L14.7021 15.344C15.0047 15.3438 15.25 15.0781 15.25 14.7502C15.25 14.4224 15.0047 14.1566 14.7021 14.1565L6.79199 14.1562ZM4.80859 6.28125C4.59304 6.20656 4.35476 6.26771 4.19922 6.4375L1.87012 9.65137C1.85132 9.67736 1.83441 9.70437 1.82031 9.73242C1.73611 9.89999 1.7363 10.0991 1.82031 10.2666C1.83434 10.2945 1.85041 10.3218 1.86914 10.3477L4.19922 13.5615C4.35009 13.74 4.59028 13.8081 4.80957 13.7344C5.02779 13.6605 5.18223 13.4595 5.2002 13.2246L5.2002 6.78516C5.17764 6.553 5.02415 6.35609 4.80859 6.28125ZM7 10.5937L14.7021 10.594C15.0047 10.5938 15.25 10.3281 15.25 10.0002C15.25 9.67239 15.0047 9.40661 14.7021 9.40648L7 9.40625V10.5937ZM5.58789 4.65625C6.1288 4.89728 6.54696 5.32547 6.78418 5.84375L14.7021 5.84398C15.0047 5.84384 15.25 5.57806 15.25 5.25023C15.25 4.92239 15.0047 4.65661 14.7021 4.65648L5.58789 4.65625Z'
                  fill='currentColor'
                />
              </svg>
            </button>
          </TooltipTrigger>
        </Tooltip>
      </div>
    );
  }

  return (
    <Section>
      <div className={classes.container}>
        <div className={classes.header}>
          <div className={classes.headerLeft}>
            <Typography variant='h5' classes={{ root: classes.title }}>
              {translate('Heading.Updates')}
            </Typography>
            {!isSingleColumnResolved && (
              <div className={classes.moreWrapper} ref={filterWrapperRef}>
                <button
                  className={classes.tagButtonWrapper}
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  type='button'>
                  <Chip
                    variant='Standard'
                    size='Small'
                    text={
                      filterOptions.find((opt) => opt.value === selectedFilter)?.label ??
                      translate('Label.Featured')
                    }
                    isChecked={isFilterOpen}
                    trailingIconName='icon-filled-chevron-large-down'
                    className='pointer-events-none'
                    tabIndex={-1}
                  />
                </button>
                {isFilterOpen && (
                  <div className={classes.moreMenu}>
                    {filterOptions.map((option) => {
                      const isActive = option.value === selectedFilter;
                      return (
                        <button
                          key={option.value}
                          className={cx(
                            classes.moreMenuItem,
                            isActive && classes.moreMenuItemActive,
                          )}
                          type='button'
                          onClick={() => {
                            captureHomepageEvent(
                              'clickHomeUpdateFilter',
                              EHomepageSection.HomePageAnnouncements,
                              { filter: option.value },
                            );
                            setSelectedFilter(option.value);
                            setIsFilterOpen(false);
                          }}>
                          <span>{option.label}</span>
                          {isActive && (
                            <Icon
                              name='icon-filled-check-large'
                              size='XSmall'
                              className={classes.moreMenuIcon}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={classes.headerRight}>
            <a
              href={viewAllUrl}
              className={classes.viewAllLink}
              {...(enableUpdatesNewLayoutV1
                ? {}
                : { target: '_blank', rel: 'noreferrer noopener' })}>
              <Button variant='Utility' size='XSmall' onClick={handleViewAllClick}>
                {translate('Label.ViewAll')}
              </Button>
            </a>
            {!isSingleColumnResolved && onCollapse && (
              <button
                type='button'
                className={classes.collapseButton}
                onClick={() => {
                  captureHomepageEvent(
                    'clickCollapseUpdates',
                    EHomepageSection.HomePageAnnouncements,
                  );
                  onCollapse();
                }}
                aria-label='Collapse updates'>
                <Icon name='icon-regular-two-arrows-to-center' size='Small' />
              </button>
            )}
          </div>
        </div>

        <div className={classes.tilesList}>
          {isSingleColumnResolved && tilesContent}
          {!isSingleColumnResolved && needsScroll && (
            <div className={classes.tilesScrollArea}>{tilesContent}</div>
          )}
          {!isSingleColumnResolved && !needsScroll && tilesContent}
        </div>
      </div>

      <Dialog
        open={!!selectedAnnouncement}
        onOpenChange={() => setSelectedAnnouncement(null)}
        size='Large'
        isModal
        hasCloseAffordance={false}
        closeLabel={translate('Label.CloseDialog' /* CreatorDashboard.Home */)}>
        <DialogContent
          className={classes.modalDialogContent}
          overlayClassName={classes.modalDialogOverlay}>
          {selectedAnnouncement && (
            <div ref={modalContentRef} className={classes.modalContent}>
              <div className={classes.modalHeader}>
                <Typography variant='h4' classes={{ root: classes.modalTitle }} component='div'>
                  {selectedAnnouncement.title}
                </Typography>
                <button
                  type='button'
                  className={classes.modalCloseButton}
                  onClick={() => setSelectedAnnouncement(null)}
                  aria-label='Close'>
                  <Icon name='icon-filled-x' size='Medium' />
                </button>
              </div>

              <div className={classes.modalBody}>
                <div className={classes.modalMetaSection}>
                  <div className={classes.modalMetaRow}>
                    <div className={classes.modalMetaItem}>
                      <Icon name='icon-regular-heart' size='XSmall' className={classes.modalIcon} />
                      <Typography variant='body2' classes={{ root: classes.modalMetaText }}>
                        {getPrettifiedNumber(selectedAnnouncement.likeCount)}
                      </Typography>
                    </div>
                    <div className={classes.modalMetaItem}>
                      <Icon
                        name='icon-regular-speech-bubble-align-left'
                        size='XSmall'
                        className={classes.modalIcon}
                      />
                      <Typography variant='body2' classes={{ root: classes.modalMetaText }}>
                        {getPrettifiedNumber(selectedAnnouncement.postsCount)}
                      </Typography>
                    </div>
                    {selectedTags.map((tag) => (
                      <Typography
                        key={tag}
                        variant='body2'
                        classes={{ root: classes.modalMetaText }}>
                        {tag}
                      </Typography>
                    ))}
                  </div>

                  <div className={classes.modalActionsSection}>
                    <button
                      type='button'
                      className={classes.modalViewDetailsButton}
                      onClick={() => {
                        captureHomepageEvent(
                          'clickViewDetails',
                          EHomepageSection.HomePageAnnouncements,
                        );
                        window.open(selectedAnnouncement.url, '_blank', 'noopener,noreferrer');
                      }}>
                      <Typography variant='smallLabel1'>
                        {translate('Label.ViewDetails')}
                      </Typography>
                    </button>
                    {(() => {
                      const currentIndex = items.findIndex(
                        (item) => item.id === selectedAnnouncement.id,
                      );
                      const previousPost = currentIndex > 0 ? items[currentIndex - 1] : null;
                      const nextPost =
                        currentIndex >= 0 && currentIndex < items.length - 1
                          ? items[currentIndex + 1]
                          : null;
                      return (
                        <div className={classes.modalFooterNavLinks}>
                          <button
                            type='button'
                            disabled={!previousPost}
                            className={cx(
                              classes.modalNavButton,
                              !previousPost && classes.modalFooterNavDisabled,
                            )}
                            onClick={
                              previousPost
                                ? () => {
                                    captureHomepageEvent(
                                      'clickAnnouncementNav',
                                      EHomepageSection.HomePageAnnouncements,
                                      { direction: 'previous', source: 'button' },
                                    );
                                    setSelectedAnnouncement(previousPost);
                                  }
                                : undefined
                            }>
                            <Icon
                              name='icon-filled-chevron-large-left'
                              size='Small'
                              className={classes.modalNavIcon}
                            />
                            <Typography
                              variant='smallLabel1'
                              classes={{ root: classes.modalNavButtonText }}>
                              {translate('Label.Previous')}
                            </Typography>
                          </button>
                          <button
                            type='button'
                            disabled={!nextPost}
                            className={cx(
                              classes.modalNavButton,
                              !nextPost && classes.modalFooterNavDisabled,
                            )}
                            onClick={
                              nextPost
                                ? () => {
                                    captureHomepageEvent(
                                      'clickAnnouncementNav',
                                      EHomepageSection.HomePageAnnouncements,
                                      { direction: 'next', source: 'button' },
                                    );
                                    setSelectedAnnouncement(nextPost);
                                  }
                                : undefined
                            }>
                            <Typography
                              variant='smallLabel1'
                              classes={{ root: classes.modalNavButtonText }}>
                              {translate('Label.Next')}
                            </Typography>
                            <Icon
                              name='icon-filled-chevron-large-right'
                              size='Small'
                              className={classes.modalNavIcon}
                            />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {(takeawaysContent || selectedAnnouncement.imageUrl) && (
                    <div className={classes.modalTakeaways}>
                      {takeawaysContent && (
                        <div
                          className={cx(
                            classes.modalTakeawaysContent,
                            takeawaysContentHtml && classes.modalTakeawaysContentRich,
                          )}>
                          {takeawaysContentHtml ? (
                            /* eslint-disable-next-line react/no-danger -- DevForum cooked HTML is trusted. */
                            <div dangerouslySetInnerHTML={{ __html: takeawaysContentHtml }} />
                          ) : (
                            takeawaysContent
                          )}
                        </div>
                      )}
                      {selectedAnnouncement.imageUrl && (
                        <div className={classes.modalImageSection}>
                          <img
                            src={selectedAnnouncement.imageUrl}
                            alt={selectedAnnouncement.title}
                            className={classes.modalImage}
                            loading='lazy'
                            decoding='async'
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Section>
  );
};

export default withTranslation(Updates, [TranslationNamespace.Home]);
