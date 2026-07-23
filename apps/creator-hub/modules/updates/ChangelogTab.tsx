import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Typography } from '@rbx/ui';
import { Chip, Icon } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { captureException } from '@sentry/nextjs';
import { getDevForumAnnouncements } from '@modules/home/utils/apiUtils';
import type { TDevForumAnnouncement } from '@modules/home/utils/apiUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ChangelogPost from './ChangelogPost';
import useChangelogTabStyles from './ChangelogTab.styles';
import { CHANGELOG_MORE_TAG_OPTIONS } from './ChangelogTags';
import { getOrFetchTakeaways, TakeawaysPayload } from './takeaways';
import { captureUpdatesPageEvent, EUpdatesPageSection } from './eventUtils';

type SearchResponse = { posts?: Array<{ topic_id: number }> };

let cachedAnnouncements: TDevForumAnnouncement[] | null = null;
const takeawaysCacheByUrl = new Map<string, TakeawaysPayload>();
const takeawaysInFlightByUrl = new Map<string, Promise<TakeawaysPayload>>();

const normalizeTag = (tag: string) => tag.trim().toLowerCase().replace(/\s+/g, '-');

const ChangelogTab: FunctionComponent = () => {
  const { classes, cx } = useChangelogTabStyles();
  const { translate } = useTranslation();
  const tagFilterOptions = useMemo(
    () => [{ label: translate('Label.All'), value: 'all' }, ...CHANGELOG_MORE_TAG_OPTIONS],
    [translate],
  );
  const [announcements, setAnnouncements] = useState<TDevForumAnnouncement[] | null>(
    cachedAnnouncements,
  );
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTopicIds, setSearchTopicIds] = useState<Set<number> | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (cachedAnnouncements) {
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        const { topics } = await getDevForumAnnouncements('');
        cachedAnnouncements = topics;
        setAnnouncements(topics);
      } catch (error) {
        captureException(`Updates Page: Error fetching announcements: ${error}`);
        cachedAnnouncements = [];
        setAnnouncements([]);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchTopicIds(null);
    }
  }, [searchInput]);

  useEffect(() => {
    if (!isFilterOpen) return undefined;
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target as Node)) {
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

  const getDevforumJsonUrl = useCallback((url: string) => `${url}.json`, []);
  const getDevforumSearchUrl = useCallback((query: string) => {
    const fullQuery = `#updates:announcements status:public after:2025-12-01 in:title ${query} order:latest`;
    return `https://devforum.roblox.com/search.json?q=${encodeURIComponent(fullQuery)}`;
  }, []);

  const sanitizeText = useCallback((text: string) => {
    const decoded = new DOMParser().parseFromString(text, 'text/html').textContent ?? text;
    const withoutEmoji = decoded.replace(/:[a-z0-9_+-]+:/gi, '');
    const normalizedEllipsis = withoutEmoji.replace(/&hellip;/gi, '...').replace(/…/g, '...');
    return normalizedEllipsis.replace(/[ \t]+/g, ' ').trim();
  }, []);

  const getTakeaways = useCallback(
    async (announcement: TDevForumAnnouncement): Promise<TakeawaysPayload> => {
      return getOrFetchTakeaways({
        announcement,
        getDevforumJsonUrl,
        sanitizeText,
        takeawaysCache: takeawaysCacheByUrl,
        takeawaysInFlight: takeawaysInFlightByUrl,
      });
    },
    [getDevforumJsonUrl, sanitizeText],
  );

  const handleSearch = useCallback(async () => {
    const query = searchInput.trim();
    if (!query) {
      setSearchTopicIds(null);
      return;
    }

    captureUpdatesPageEvent('clickSearch', EUpdatesPageSection.ChangelogSearch, {
      query,
    });
    setSearchInput(query);
    setIsSearching(true);
    try {
      const response = await fetch(getDevforumSearchUrl(query));
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }
      const data = (await response.json()) as SearchResponse;

      setSearchTopicIds(new Set(data.posts?.map((post) => post.topic_id) ?? []));
    } catch (error) {
      captureException(`Updates Page: Error searching announcements: ${error}`);
      setSearchTopicIds(new Set());
    } finally {
      setIsSearching(false);
    }
  }, [getDevforumSearchUrl, searchInput]);

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];

    const tagFiltered =
      selectedFilter === 'all'
        ? announcements
        : announcements.filter((announcement) =>
            announcement.tags?.some((tag) => normalizeTag(tag) === selectedFilter),
          );

    if (!searchTopicIds) {
      return tagFiltered;
    }

    return tagFiltered.filter((announcement) => searchTopicIds.has(announcement.id));
  }, [announcements, selectedFilter, searchTopicIds]);

  const filterLabel =
    tagFilterOptions.find((opt) => opt.value === selectedFilter)?.label ?? translate('Label.All');

  const groupedByDate = useMemo(() => {
    const groups: Map<string, TDevForumAnnouncement[]> = new Map();
    filteredAnnouncements.forEach((announcement) => {
      const dateKey = new Date(announcement.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)?.push(announcement);
    });
    return groups;
  }, [filteredAnnouncements]);

  return (
    <div className={classes.container}>
      {/* Filters Section */}
      <div className={classes.filtersSection}>
        <div className={classes.filtersRow}>
          <div className={classes.filterDropdownWrapper} ref={filterWrapperRef}>
            <button
              className={classes.filterDropdownButton}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              type='button'>
              <Chip
                variant='Standard'
                size='Medium'
                text={filterLabel}
                isChecked={isFilterOpen}
                trailing='icon-filled-chevron-large-down'
                style={{ pointerEvents: 'none' }}
                tabIndex={-1}
              />
            </button>
            {isFilterOpen && (
              <div className={classes.filterDropdownMenu}>
                {tagFilterOptions.map((option) => {
                  const isActive = option.value === selectedFilter;
                  return (
                    <button
                      key={option.value}
                      className={classes.filterDropdownMenuItem}
                      type='button'
                      onClick={() => {
                        captureUpdatesPageEvent(
                          'clickFilter',
                          EUpdatesPageSection.ChangelogFilters,
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
                          className={classes.filterDropdownMenuIcon}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className={classes.searchContainer}>
          <button
            type='button'
            className={classes.searchButton}
            onClick={handleSearch}
            disabled={isSearching}
            aria-label={translate('Label.SearchUpdates')}>
            <Icon
              name='icon-regular-magnifying-glass'
              size='Small'
              className={classes.searchIcon}
            />
          </button>
          <div className={classes.searchUpdates}>
            <input
              type='text'
              placeholder={translate('Label.SearchUpdates')}
              className={classes.searchInput}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={classes.timeline}>
        {(() => {
          let globalPosition = 0;
          return Array.from(groupedByDate.entries()).map(([date, posts]) => (
            <div key={date} className={classes.dateGroup}>
              <div className={classes.postsColumn}>
                {/* Mobile: date on its own row */}
                <div className={classes.mobileDateRow}>
                  <div className={cx(classes.postContentWrapper, classes.mobileDateContentWrapper)}>
                    <Typography
                      variant='largeLabel1'
                      classes={{ root: classes.mobileDateInColumn }}
                      component='div'>
                      {date}
                    </Typography>
                  </div>
                </div>
                {posts.map((post, postIndex) => {
                  const position = globalPosition;
                  globalPosition += 1;
                  return (
                    <div key={post.id} className={classes.postRow}>
                      <div className={classes.dateCell}>
                        {postIndex === 0 ? (
                          <Typography variant='largeLabel1' classes={{ root: classes.dateText }}>
                            {date}
                          </Typography>
                        ) : (
                          <span className={classes.dateSpacer} />
                        )}
                      </div>
                      <div className={classes.timelineIndicator}>
                        <Icon
                          name='icon-regular-ps-circle'
                          size='Medium'
                          className={classes.timelineDot}
                        />
                        <div className={classes.timelineLineBottom} />
                      </div>
                      <div className={classes.postContentWrapper}>
                        <div className={classes.postContentInner}>
                          <ChangelogPost
                            announcement={post}
                            position={position}
                            getTakeaways={getTakeaways}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default withTranslation(ChangelogTab, [TranslationNamespace.Home]);
