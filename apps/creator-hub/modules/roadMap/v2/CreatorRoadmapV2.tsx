import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx as cx, Icon, ProgressCircle } from '@rbx/foundation-ui';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useGetRoadmapItems,
  useGetRoadmapLikes,
  useToggleRoadmapLike,
} from '@modules/react-query/roadmap/roadmapQueries';
import {
  ALL_STAGES_FILTER,
  applyLikedState,
  buildTimelineRows,
  countVisibleItems,
} from '../utils/roadmapUtils';
import HeroVideoBanner, { type HeroStat } from './HeroVideoBanner';
import RoadmapCard from './RoadmapCard';
import RoadmapDetailModal from './RoadmapDetailModal';
import {
  logRoadmapFilterApplied,
  logRoadmapItemClick,
  logRoadmapItemImpression,
  logRoadmapItemLikeToggle,
  logRoadmapPageView,
} from './roadmapEvents';
import RoadmapFilterDropdown, { type RoadmapFilterOption } from './RoadmapFilterDropdown';
import { getRoadmapLocale } from './roadmapLocale';
import type { RoadmapCategory, RoadmapItem } from './types';
import styles from './CreatorRoadmapV2.module.css';

const CATEGORY_LABEL_KEYS: Record<RoadmapCategory, string> = {
  Featured: 'Label.Featured',
  Studio: 'Label.Studio',
  Engine: 'Label.Engine',
  APIs: 'Label.APIs',
  Social: 'Label.Social',
  Discovery: 'Label.Discovery',
  Safety: 'Label.Safety',
  Policy: 'Label.Policy',
  Analytics: 'Label.Analytics',
  Monetization: 'Label.Monetization',
  Avatar: 'Label.Avatar',
  AI: 'Label.AI',
  Ads: 'Label.Ads',
  'Creator Hub': 'Label.CreatorHub',
};

// Module-level so the query defaults keep a stable identity: a fresh `[]` each render would
// invalidate the memoized derivations below while a query has no data.
const EMPTY_ROADMAP_ITEMS: RoadmapItem[] = [];
const EMPTY_LIKED_IDS: string[] = [];

function CreatorRoadmapV2() {
  const { translate, ready } = useTranslation();
  const { locale } = useLocalization();
  const {
    data: roadmapItems = EMPTY_ROADMAP_ITEMS,
    isPending,
    error,
    refetch,
  } = useGetRoadmapItems(getRoadmapLocale(locale));
  const { data: likedItemIds = EMPTY_LIKED_IDS } = useGetRoadmapLikes();
  const { mutate: toggleLike } = useToggleRoadmapLike();
  const { user } = useAuthentication();
  const userId = user?.id;
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Featured');
  const [selectedStage, setSelectedStage] = useState(ALL_STAGES_FILTER);

  const categoryOptions = useMemo<RoadmapFilterOption[]>(
    () => [
      { value: 'all', label: translate('Label.All') },
      ...(userId != null ? [{ value: 'Favorites', label: translate('Label.Favorites') }] : []),
      ...Object.entries(CATEGORY_LABEL_KEYS).map(([category, labelKey]) => ({
        value: category,
        label: translate(labelKey),
      })),
    ],
    [translate, userId],
  );
  const stageOptions = useMemo<RoadmapFilterOption[]>(
    () => [
      { value: ALL_STAGES_FILTER, label: translate('Label.AllStages') },
      { value: 'Live', label: translate('Label.Live') },
      { value: 'Early Access', label: translate('Label.EarlyAccess') },
      { value: 'Beta', label: translate('Label.Beta') },
      { value: 'In Development', label: translate('Label.InDevelopment') },
      { value: 'On Hold', label: translate('Label.OnHold') },
    ],
    [translate],
  );

  const itemsWithLikes = useMemo(
    () => applyLikedState(roadmapItems, likedItemIds),
    [roadmapItems, likedItemIds],
  );

  const timelineRows = useMemo(
    () => buildTimelineRows(itemsWithLikes, selectedCategory, selectedStage),
    [itemsWithLikes, selectedCategory, selectedStage],
  );

  const { unifiedLogger } = useUnifiedLoggerProvider();

  const openDetail = (item: RoadmapItem) => {
    logRoadmapItemClick(unifiedLogger, item);
    setSelectedItem(item);
  };
  const closeDetail = () => setSelectedItem(null);

  const handleSelectCategory = (value: string) => {
    if (value === selectedCategory) {
      return;
    }
    setSelectedCategory(value);
    logRoadmapFilterApplied(unifiedLogger, {
      filterType: 'category',
      filterValue: value,
      itemsRemainingCount: countVisibleItems(itemsWithLikes, value, selectedStage),
    });
  };

  const handleSelectStage = (value: string) => {
    if (value === selectedStage) {
      return;
    }
    setSelectedStage(value);
    logRoadmapFilterApplied(unifiedLogger, {
      filterType: 'stage',
      filterValue: value,
      itemsRemainingCount: countVisibleItems(itemsWithLikes, selectedCategory, value),
    });
  };

  // 'On Hold' items count toward neither shipped nor upcoming, so those two intentionally do not sum to the roadmap total.
  const heroStats = useMemo<HeroStat[]>(() => {
    const shippedCount = roadmapItems.filter((item) => item.devStage === 'Live').length;
    const upcomingCount = roadmapItems.filter(
      (item) =>
        item.devStage === 'Early Access' ||
        item.devStage === 'Beta' ||
        item.devStage === 'In Development',
    ).length;
    return [
      { id: 'roadmap', value: roadmapItems.length, label: translate('Label.FeaturesInRoadmap') },
      { id: 'shipped', value: shippedCount, label: translate('Label.FeaturesShipped') },
      { id: 'upcoming', value: upcomingCount, label: translate('Label.NewFeatures') },
    ];
  }, [roadmapItems, translate]);

  const pageViewLoggedRef = useRef(false);
  useEffect(() => {
    if (isPending || !ready || error != null || pageViewLoggedRef.current) {
      return;
    }
    pageViewLoggedRef.current = true;
    logRoadmapPageView(unifiedLogger, {
      itemsVisibleCount: countVisibleItems(itemsWithLikes, selectedCategory, selectedStage),
    });
  }, [error, isPending, ready, unifiedLogger, itemsWithLikes, selectedCategory, selectedStage]);

  if (isPending || !ready) {
    return (
      <div className='flex justify-center padding-xlarge'>
        <ProgressCircle
          variant='Indeterminate'
          size='Medium'
          ariaLabel={translate('Label.AriaLabel.LoadingRoadmap')}
        />
      </div>
    );
  }

  if (error) {
    return <LoadError onReload={() => void refetch()} />;
  }

  return (
    <div className='flex flex-col'>
      <HeroVideoBanner heading={translate('Heading.HeroBanner')} stats={heroStats} />
      <div className='flex flex-row gap-small padding-bottom-xxlarge'>
        <RoadmapFilterDropdown
          options={categoryOptions}
          value={selectedCategory}
          onSelect={handleSelectCategory}
        />
        <RoadmapFilterDropdown
          options={stageOptions}
          value={selectedStage}
          onSelect={handleSelectStage}
        />
      </div>
      {timelineRows.map(({ row, rowItems, startIndex }, index) => {
        const isFirst = index === 0;
        const isLast = index === timelineRows.length - 1;
        return (
          <div key={row.id} className='flex items-stretch gap-medium self-stretch'>
            <div className='flex flex-col items-center self-stretch min-height-0 grow-0 shrink-0 width-600 padding-top-xlarge max-[990px]:hidden'>
              <Icon
                name='icon-regular-ps-circle'
                size='Large'
                className='flex shrink-0 content-emphasis'
              />
              <div
                className={cx(
                  'relative grow shrink-0 basis-0 self-stretch min-height-0',
                  !isLast && '[margin-bottom:calc(var(--size-500)*-1)]',
                  styles.connectorLine,
                )}
              />
            </div>
            <div
              className={cx(
                'flex grow basis-0 min-width-0 flex-col gap-medium padding-top-xlarge [box-sizing:border-box]',
                isFirst ? 'max-[990px]:padding-top-none' : 'max-[990px]:padding-top-xxlarge',
                !isLast && 'margin-bottom-medium max-[990px]:margin-bottom-none',
              )}>
              <span className='text-heading-small content-emphasis'>
                {translate(row.labelKey, { year: row.year.toString() })}
              </span>
              <div className='grid gap-xxlarge items-stretch [grid-template-columns:repeat(auto-fill,minmax(min(290px,100%),1fr))]'>
                {rowItems.map((item, itemIndex) => (
                  <RoadmapCard
                    key={item.id}
                    title={item.title}
                    description={item.summary}
                    category={item.category}
                    likeCount={item.likeCount}
                    isLiked={item.isLiked}
                    onClick={() => openDetail(item)}
                    onImpression={() =>
                      logRoadmapItemImpression(unifiedLogger, item, startIndex + itemIndex)
                    }
                    onToggleLike={
                      userId != null
                        ? (nextLiked) => {
                            logRoadmapItemLikeToggle(
                              unifiedLogger,
                              item,
                              nextLiked,
                              startIndex + itemIndex,
                            );
                            toggleLike({ itemId: item.id, nextLiked });
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <RoadmapDetailModal item={selectedItem} onClose={closeDetail} />
    </div>
  );
}

export default withTranslation(CreatorRoadmapV2, [
  TranslationNamespace.Home,
  TranslationNamespace.RoadMap,
]);
