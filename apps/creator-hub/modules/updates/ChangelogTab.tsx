// oxlint-disable react/react-compiler
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { captureException } from '@sentry/nextjs';
import { Chip, Icon } from '@rbx/foundation-ui';
import { Locale, withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { getChangelogPosts, getPinnedChangelogPosts } from '@modules/clients/creatorUpdatesApi';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { getDevForumAnnouncements, type TDevForumAnnouncement } from '@modules/home/utils/apiUtils';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import localeNameMapping from '@modules/miscellaneous/localization/constants/localeNameMapping';
import ChangelogPost, { type ChangelogPostAnnouncement } from './ChangelogPost';
import useChangelogTabStyles from './ChangelogTab.styles';
import { CHANGELOG_MORE_TAG_OPTIONS, normalizeChangelogTag } from './ChangelogTags';
import { captureUpdatesPageEvent, EUpdatesPageSection } from './eventUtils';
import { getOrFetchTakeaways, type TakeawaysPayload } from './takeaways';

const cachedAnnouncementsByTag = new Map<string, ChangelogPostAnnouncement[]>();
const cachedPinnedAnnouncementsByLang = new Map<string, ChangelogPostAnnouncement[]>();

const DEFAULT_CHANGELOG_LANG = 'en_us';
const SUPPORTED_CHANGELOG_LANGS = new Set([
  DEFAULT_CHANGELOG_LANG,
  'es_es',
  'pt_br',
  'vi_vn',
  'fr_fr',
  'ko_kr',
  'de_de',
  'ja_jp',
  'it_it',
  'zh_cn',
  'zh_tw',
]);

const getChangelogLang = (locale: Locale | null | undefined) => {
  const lang = localeNameMapping[locale ?? Locale.English];
  return SUPPORTED_CHANGELOG_LANGS.has(lang) ? lang : DEFAULT_CHANGELOG_LANG;
};

const getAnnouncementDateLabel = (announcement: ChangelogPostAnnouncement) =>
  new Date(announcement.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getSearchTopicIds = (value: unknown): Set<string> => {
  if (!isRecord(value) || !Array.isArray(value.posts)) {
    return new Set();
  }

  return new Set(
    value.posts.flatMap((post) => {
      if (!isRecord(post) || typeof post.topic_id !== 'number') {
        return [];
      }

      return [post.topic_id.toString()];
    }),
  );
};

const mapDevForumAnnouncementToChangelogPost = (
  announcement: TDevForumAnnouncement,
): ChangelogPostAnnouncement => ({
  id: announcement.id.toString(),
  title: announcement.title,
  createdAt: announcement.createdAt,
  updatedAt: announcement.bumpedAt ?? announcement.createdAt,
  primaryLinkUrl: announcement.url,
  primaryLinkLabel: null,
  postCount: announcement.postsCount,
  likeCount: announcement.likeCount,
  tags: announcement.tags,
  author: announcement.author,
  imageUrl: announcement.imageUrl,
  youtubeUrl: null,
  views: announcement.views,
  keyTakeaways: announcement.excerpt,
  devForumAnnouncement: announcement,
});

const ChangelogTab: FunctionComponent = () => {
  const { classes, cx } = useChangelogTabStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const changelogLang = getChangelogLang(locale);
  const pinnedLabel = translate('Label.Pinned');
  const tagFilterOptions = useMemo(
    () => [{ label: translate('Label.All'), value: 'all' }, ...CHANGELOG_MORE_TAG_OPTIONS],
    [translate],
  );
  const {
    isFetched: isChangelogCMSFetched,
    params: { enableChangelogCMS },
  } = useIXPParameters(IXPLayers.CreatorHubChangelog, { restoreInitialValueFromCache: true });
  const useChangelogCMS = enableChangelogCMS === true;
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<ChangelogPostAnnouncement[] | null>(null);
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<
    ChangelogPostAnnouncement[] | null
  >(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTopicIds, setSearchTopicIds] = useState<Set<string> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const takeawaysCache = useRef(new Map<string, TakeawaysPayload>());
  const takeawaysInFlight = useRef(new Map<string, Promise<TakeawaysPayload>>());

  useEffect(() => {
    if (!isChangelogCMSFetched) {
      setAnnouncements(null);
      setPinnedAnnouncements(null);
      return undefined;
    }

    const cacheKey = `${useChangelogCMS ? `cms:${changelogLang}` : 'devforum'}:${selectedFilter}`;
    const cachedAnnouncements = cachedAnnouncementsByTag.get(cacheKey);
    const cachedPinnedAnnouncements = cachedPinnedAnnouncementsByLang.get(changelogLang);
    if (cachedAnnouncements && (!useChangelogCMS || cachedPinnedAnnouncements)) {
      setAnnouncements(cachedAnnouncements);
      setPinnedAnnouncements(useChangelogCMS ? (cachedPinnedAnnouncements ?? []) : []);
      return undefined;
    }

    setAnnouncements(null);
    setPinnedAnnouncements(useChangelogCMS ? null : []);
    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        if (useChangelogCMS) {
          const [postsResult, pinnedPostsResult] = await Promise.allSettled([
            getChangelogPosts({
              tag: selectedFilter === 'all' ? undefined : selectedFilter,
              lang: changelogLang,
            }),
            getPinnedChangelogPosts({ lang: changelogLang }),
          ]);
          if (postsResult.status === 'rejected') {
            throw postsResult.reason;
          }
          if (pinnedPostsResult.status === 'rejected') {
            captureException(pinnedPostsResult.reason);
          }
          const posts = postsResult.value;
          const pinnedPosts =
            pinnedPostsResult.status === 'fulfilled' ? pinnedPostsResult.value : [];
          cachedAnnouncementsByTag.set(cacheKey, posts);
          cachedPinnedAnnouncementsByLang.set(changelogLang, pinnedPosts);
          if (isMounted) {
            setAnnouncements(posts);
            setPinnedAnnouncements(pinnedPosts);
          }
          return;
        }

        const posts = (await getDevForumAnnouncements('')).topics
          .filter((announcement) => {
            return (
              selectedFilter === 'all' ||
              announcement.tags.some((tag) => normalizeChangelogTag(tag) === selectedFilter)
            );
          })
          .map(mapDevForumAnnouncementToChangelogPost);
        cachedAnnouncementsByTag.set(cacheKey, posts);
        if (isMounted) {
          setAnnouncements(posts);
          setPinnedAnnouncements([]);
        }
      } catch (error) {
        captureException(error);
        cachedAnnouncementsByTag.set(cacheKey, []);
        if (isMounted) {
          setAnnouncements([]);
          setPinnedAnnouncements([]);
        }
      }
    };

    void fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [changelogLang, isChangelogCMSFetched, selectedFilter, useChangelogCMS]);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      setSearchTopicIds(null);
    }
  }, [searchInput]);

  useEffect(() => {
    if (!isFilterOpen) {
      return undefined;
    }
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (filterWrapperRef.current && !filterWrapperRef.current.contains(target)) {
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
    const withoutEmoji = decoded.replaceAll(/:[a-z0-9_+-]+:/gi, '');
    const normalizedEllipsis = withoutEmoji.replaceAll(/&hellip;/gi, '...').replaceAll('…', '...');
    return normalizedEllipsis.replaceAll(/[ \t]+/g, ' ').trim();
  }, []);

  const getTakeaways = useCallback(
    async (announcement: ChangelogPostAnnouncement): Promise<TakeawaysPayload> => {
      if (!useChangelogCMS && announcement.devForumAnnouncement) {
        return getOrFetchTakeaways({
          announcement: announcement.devForumAnnouncement,
          getDevforumJsonUrl,
          sanitizeText,
          takeawaysCache: takeawaysCache.current,
          takeawaysInFlight: takeawaysInFlight.current,
        });
      }

      return {
        content: announcement.keyTakeaways ?? '',
        html: null,
      };
    },
    [getDevforumJsonUrl, sanitizeText, useChangelogCMS],
  );

  const handleSearch = useCallback(async () => {
    const query = searchInput.trim();
    if (!query) {
      setSearchQuery('');
      setSearchTopicIds(null);
      return;
    }

    captureUpdatesPageEvent('clickSearch', EUpdatesPageSection.ChangelogSearch, {
      query,
    });
    setSearchInput(query);
    setIsSearching(true);
    if (useChangelogCMS) {
      setSearchTopicIds(null);
      setSearchQuery(query.toLowerCase());
      setIsSearching(false);
      return;
    }

    setSearchQuery('');
    try {
      const response = await fetch(getDevforumSearchUrl(query));
      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }
      setSearchTopicIds(getSearchTopicIds(await response.json()));
    } catch (error) {
      captureException(error);
      setSearchTopicIds(new Set());
    } finally {
      setIsSearching(false);
    }
  }, [getDevforumSearchUrl, searchInput, useChangelogCMS]);

  const filteredPinnedAnnouncements = useMemo(() => {
    if (!useChangelogCMS || !pinnedAnnouncements) {
      return [];
    }

    const tagFiltered =
      selectedFilter === 'all'
        ? pinnedAnnouncements
        : pinnedAnnouncements.filter((announcement) =>
            announcement.tags.some((tag) => normalizeChangelogTag(tag) === selectedFilter),
          );

    if (!searchQuery) {
      return tagFiltered;
    }

    return tagFiltered.filter((announcement) => {
      return [announcement.title, announcement.keyTakeaways]
        .filter((value): value is string => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(searchQuery));
    });
  }, [pinnedAnnouncements, searchQuery, selectedFilter, useChangelogCMS]);

  const pinnedAnnouncementIds = useMemo(
    () => new Set((pinnedAnnouncements ?? []).map((announcement) => announcement.id)),
    [pinnedAnnouncements],
  );

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) {
      return [];
    }

    const unpinnedAnnouncements = useChangelogCMS
      ? announcements.filter((announcement) => !pinnedAnnouncementIds.has(announcement.id))
      : announcements;

    if (!searchQuery && !searchTopicIds) {
      return unpinnedAnnouncements;
    }

    if (useChangelogCMS) {
      return unpinnedAnnouncements.filter((announcement) => {
        return [announcement.title, announcement.keyTakeaways]
          .filter((value): value is string => typeof value === 'string')
          .some((value) => value.toLowerCase().includes(searchQuery));
      });
    }

    if (!searchTopicIds) {
      return unpinnedAnnouncements;
    }

    return unpinnedAnnouncements.filter((announcement) => searchTopicIds.has(announcement.id));
  }, [announcements, pinnedAnnouncementIds, searchQuery, searchTopicIds, useChangelogCMS]);

  const filterLabel =
    tagFilterOptions.find((opt) => opt.value === selectedFilter)?.label ?? translate('Label.All');

  const groupedByDate = useMemo(() => {
    const groups: Map<string, ChangelogPostAnnouncement[]> = new Map();
    filteredAnnouncements.forEach((announcement) => {
      const dateKey = getAnnouncementDateLabel(announcement);
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
              trailingIconName='icon-filled-chevron-large-down'
              className='pointer-events-none'
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
                      captureUpdatesPageEvent('clickFilter', EUpdatesPageSection.ChangelogFilters, {
                        filter: option.value,
                      });
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
        <div className={classes.searchContainer}>
          <button
            type='button'
            className={classes.searchButton}
            onClick={() => {
              void handleSearch();
            }}
            disabled={isSearching}
            aria-label={translate('Label.SearchUpdates')}>
            <Icon
              name='icon-regular-magnifying-glass'
              size='Small'
              className={classes.searchIcon}
            />
          </button>
          <input
            type='text'
            aria-label={translate('Label.SearchUpdates')}
            placeholder={translate('Label.SearchUpdates')}
            className={classes.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSearch();
              }
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className={classes.timeline}>
        {(() => {
          let globalPosition = 0;
          const renderPostRow = ({
            post,
            postIndex,
            date,
            isPinned,
          }: {
            post: ChangelogPostAnnouncement;
            postIndex: number;
            date: string;
            isPinned: boolean;
          }) => {
            const position = globalPosition;
            globalPosition += 1;
            return (
              <div key={post.id} className={classes.postRow}>
                <div className={classes.dateCell}>
                  {isPinned ? (
                    <div className={classes.pinnedDate}>
                      <Typography variant='smallLabel1' classes={{ root: classes.pinnedLabelText }}>
                        {pinnedLabel}
                      </Typography>
                      <Typography variant='smallLabel1' classes={{ root: classes.dateText }}>
                        {date}
                      </Typography>
                    </div>
                  ) : postIndex === 0 ? (
                    <Typography variant='largeLabel1' classes={{ root: classes.dateText }}>
                      {date}
                    </Typography>
                  ) : (
                    <span className={classes.dateSpacer} />
                  )}
                </div>
                <div className={classes.timelineIndicator}>
                  <Icon
                    name={isPinned ? 'icon-filled-pin' : 'icon-regular-ps-circle'}
                    size='Medium'
                    className={isPinned ? classes.pinnedTimelineIcon : classes.timelineDot}
                  />
                  <div className={classes.timelineLineBottom} />
                </div>
                <div className={classes.postContentWrapper}>
                  <ChangelogPost
                    announcement={post}
                    position={position}
                    getTakeaways={getTakeaways}
                  />
                </div>
              </div>
            );
          };

          const pinnedSections = filteredPinnedAnnouncements.map((post) => {
            const date = getAnnouncementDateLabel(post);
            return (
              <div key={`pinned-${post.id}`} className={classes.postsColumn}>
                <div className={classes.mobileDateRow}>
                  <div className={cx(classes.mobileDateContentWrapper, classes.mobilePinnedDate)}>
                    <Typography
                      variant='smallLabel1'
                      classes={{ root: classes.pinnedLabelText }}
                      component='div'>
                      {pinnedLabel}
                    </Typography>
                    <Typography variant='smallLabel1' classes={{ root: classes.dateText }}>
                      {date}
                    </Typography>
                  </div>
                </div>
                {renderPostRow({
                  post,
                  postIndex: 0,
                  date,
                  isPinned: true,
                })}
              </div>
            );
          });

          const dateSections = Array.from(groupedByDate.entries()).map(([date, posts]) => (
            <div key={date} className={classes.postsColumn}>
              {/* Mobile: date on its own row */}
              <div className={classes.mobileDateRow}>
                <Typography
                  variant='largeLabel1'
                  classes={{
                    root: cx(classes.mobileDateContentWrapper, classes.mobileDateInColumn),
                  }}
                  component='div'>
                  {date}
                </Typography>
              </div>
              {posts.map((post, postIndex) =>
                renderPostRow({ post, postIndex, date, isPinned: false }),
              )}
            </div>
          ));
          return [...pinnedSections, ...dateSections];
        })()}
      </div>
    </div>
  );
};

export default withTranslation(ChangelogTab, [TranslationNamespace.Home]);
