import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { LicenseRecommendationResponse } from '@modules/clients/contentLicensing';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useEnableIPRecommender from '../hooks/useEnableIPRecommender';
import useGetLicenseRecommendations from '../hooks/useGetLicenseRecommendations';
import { EXPLORE_LISTING_DETAILS } from '../urls';
import LicenseHeroCarousel, {
  type LicenseHeroCarouselNavigationSource,
  type LicenseHeroCarouselSlide,
} from './LicenseHeroCarousel';

const UNKNOWN_RECOMMENDATION_CONTEXT = '';
const RECOMMENDATION_AUTO_ADVANCE_MS = 5000;
type RecommendationImpressionSource = 'initial' | LicenseHeroCarouselNavigationSource;

function createRecommendationRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRecommendationUniverseId(
  recommendation?: LicenseRecommendationResponse,
): number | string {
  return recommendation?.sourceUniverseId ?? UNKNOWN_RECOMMENDATION_CONTEXT;
}

function getPrimaryThumbnailAssetId(recommendation: LicenseRecommendationResponse): number | null {
  const [thumbnailAssetId] = recommendation.thumbnailAssetIds ?? [];
  return thumbnailAssetId ?? null;
}

function getRecommendationReasonIndex(recommendation: LicenseRecommendationResponse): number {
  return Math.max(0, (recommendation.rank ?? 1) - 1) % 3;
}

function normalizeCarouselIndex(index: number, count: number): number {
  if (count === 0) {
    return 0;
  }

  return ((index % count) + count) % count;
}

const RecommendedLicensesBanner: FunctionComponent = () => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched: isRecommenderExperimentFetched, isEnabled: isRecommenderExperimentEnabled } =
    useEnableIPRecommender();
  const shouldFetchRecommendations =
    isRecommenderExperimentFetched && isRecommenderExperimentEnabled;
  const { data, isPending, isError } = useGetLicenseRecommendations(shouldFetchRecommendations);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImpressionSource, setActiveImpressionSource] =
    useState<RecommendationImpressionSource>('initial');
  const [visibleCarouselRequestId, setVisibleCarouselRequestId] = useState('');
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const loggedImpressionKeysRef = useRef<Set<string>>(new Set());

  const recommendations = useMemo(() => {
    return (data?.recommendations ?? []).filter((recommendation) => recommendation.listingId);
  }, [data?.recommendations]);

  const recommendationSetKey = useMemo(() => {
    return recommendations.map((recommendation) => recommendation.listingId).join('|');
  }, [recommendations]);

  const requestId = useMemo(
    () => data?.requestId ?? (recommendationSetKey ? createRecommendationRequestId() : ''),
    [data?.requestId, recommendationSetKey],
  );

  useEffect(() => {
    loggedImpressionKeysRef.current.clear();
  }, [requestId]);

  const normalizedActiveIndex = normalizeCarouselIndex(activeIndex, recommendations.length);
  const activeRecommendation = recommendations[normalizedActiveIndex];
  const canRenderBanner =
    isRecommenderExperimentFetched &&
    shouldFetchRecommendations &&
    !isPending &&
    !isError &&
    recommendations.length > 0 &&
    activeRecommendation != null;
  const isCarouselVisible =
    typeof IntersectionObserver === 'undefined' ||
    (requestId !== '' && visibleCarouselRequestId === requestId);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const carouselContainer = carouselContainerRef.current;
    if (!canRenderBanner || carouselContainer == null) {
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        setVisibleCarouselRequestId(isVisible ? requestId : '');
      },
      { threshold: 0.5 },
    );
    observer.observe(carouselContainer);
    return () => {
      observer.disconnect();
    };
  }, [canRenderBanner, requestId]);

  useEffect(() => {
    if (!isCarouselVisible || !isDocumentVisible || !requestId || activeRecommendation == null) {
      return;
    }

    const impressionKey = `${requestId}:${activeRecommendation.listingId}`;
    if (loggedImpressionKeysRef.current.has(impressionKey)) {
      return;
    }

    loggedImpressionKeysRef.current.add(impressionKey);
    logEvent(LicenseManagerImpressionEvent.RecommendationImpressionEvent, {
      requestId,
      universeId: getRecommendationUniverseId(activeRecommendation),
      licenseId: activeRecommendation.licenseId ?? '',
      listingId: activeRecommendation.listingId ?? '',
      carouselPosition: normalizedActiveIndex + 1,
      score: activeRecommendation.score ?? 0,
      source: activeImpressionSource,
    });
  }, [
    activeImpressionSource,
    activeRecommendation,
    isCarouselVisible,
    isDocumentVisible,
    logEvent,
    normalizedActiveIndex,
    requestId,
  ]);

  const getRecommendationReason = useCallback(
    (recommendation: LicenseRecommendationResponse) => {
      const reasonIndex = getRecommendationReasonIndex(recommendation);

      if (reasonIndex === 0) {
        return tPendingTranslation(
          'the gameplay of your most popular Roblox games aligns with this IP.',
          'Recommendation explanation shown in the license recommendation banner when the recommendation is based on gameplay alignment.',
          translationKey(
            'Description.RecommendationReasonGameplayAlignment',
            TranslationNamespace.Licenses,
          ),
        );
      }

      if (reasonIndex === 1) {
        return tPendingTranslation(
          'the core game loop of your popular games could work well with the storyline of this IP.',
          'Recommendation explanation shown in the license recommendation banner when the recommendation is based on core loop alignment.',
          translationKey(
            'Description.RecommendationReasonCoreLoopAlignment',
            TranslationNamespace.Licenses,
          ),
        );
      }

      return tPendingTranslation(
        'the genre of your popular games could work well with the storyline of this IP.',
        'Recommendation explanation shown in the license recommendation banner when the recommendation is based on genre alignment.',
        translationKey(
          'Description.RecommendationReasonGenreAlignment',
          TranslationNamespace.Licenses,
        ),
      );
    },
    [tPendingTranslation],
  );

  const handleSelectRecommendation = useCallback(
    (nextIndex: number, source: LicenseHeroCarouselNavigationSource) => {
      const normalizedNextIndex = normalizeCarouselIndex(nextIndex, recommendations.length);
      if (normalizedActiveIndex === normalizedNextIndex) {
        return;
      }

      if (requestId) {
        const fromRecommendation = recommendations[normalizedActiveIndex];
        logEvent(LicenseManagerClickEvent.RecommendationCarouselAdvanceEvent, {
          requestId,
          universeId: getRecommendationUniverseId(fromRecommendation),
          licenseId: fromRecommendation?.licenseId ?? '',
          listingId: fromRecommendation?.listingId ?? '',
          fromPosition: normalizedActiveIndex + 1,
          toPosition: normalizedNextIndex + 1,
          source,
        });
      }

      setActiveImpressionSource(source);
      setActiveIndex(normalizedNextIndex);
    },
    [logEvent, normalizedActiveIndex, recommendations, requestId],
  );

  const handleClickViewLicense = useCallback(
    (recommendation: LicenseRecommendationResponse) => {
      const recommendationIndex = recommendations.findIndex(
        (item) => item.licenseId === recommendation.licenseId,
      );
      logEvent(LicenseManagerClickEvent.RecommendationClickEvent, {
        requestId,
        universeId: getRecommendationUniverseId(recommendation),
        licenseId: recommendation.licenseId ?? '',
        listingId: recommendation.listingId ?? '',
        carouselPosition:
          recommendationIndex >= 0 ? recommendationIndex + 1 : (recommendation.rank ?? 0),
        clickTarget: 'view_license',
      });
    },
    [logEvent, recommendations, requestId],
  );

  const handleClickViewListing = useCallback(
    (recommendation: LicenseRecommendationResponse) => {
      const recommendationIndex = recommendations.findIndex(
        (item) => item.licenseId === recommendation.licenseId,
      );
      logEvent(LicenseManagerClickEvent.RecommendationClickEvent, {
        requestId,
        universeId: getRecommendationUniverseId(recommendation),
        licenseId: recommendation.licenseId ?? '',
        listingId: recommendation.listingId ?? '',
        carouselPosition:
          recommendationIndex >= 0 ? recommendationIndex + 1 : (recommendation.rank ?? 0),
        clickTarget: 'view_listing',
      });
    },
    [logEvent, recommendations, requestId],
  );

  const slides = useMemo<LicenseHeroCarouselSlide[]>(
    () =>
      recommendations.map((recommendation) => {
        const listingName = recommendation.ipFamilyName ?? recommendation.licenseName ?? '';
        const listingHref = EXPLORE_LISTING_DETAILS(recommendation.listingId ?? '');

        return {
          id:
            recommendation.licenseId ??
            recommendation.listingId ??
            String(recommendation.rank ?? 0),
          title: listingName,
          eyebrow: tPendingTranslation(
            'Recommended licenses for you',
            'Heading for the personalized license recommendations banner.',
            translationKey('Heading.RecommendedLicenses', TranslationNamespace.Licenses),
          ),
          description: (
            <>
              {tPendingTranslation(
                'This IP is recommended to you because',
                'Prefix before the personalized recommendation reason in the license recommendations banner.',
                translationKey(
                  'Description.RecommendationReasonPrefix',
                  TranslationNamespace.Licenses,
                ),
              )}{' '}
              {getRecommendationReason(recommendation)}
            </>
          ),
          action: (
            <Button asChild variant='Emphasis' size='Medium'>
              <Link
                href={listingHref}
                data-testid={`explore-license-recommendation-view-license-${recommendation.licenseId ?? ''}`}
                onClick={() => handleClickViewLicense(recommendation)}>
                {tPendingTranslation(
                  'View License',
                  'Button label in the license recommendations banner that opens the recommended license listing.',
                  translationKey('Button.ViewLicense', TranslationNamespace.Licenses),
                )}
              </Link>
            </Button>
          ),
          thumbnailAssetId: getPrimaryThumbnailAssetId(recommendation),
          imageAlt: listingName,
          titleHref: listingHref,
          mediaHref: listingHref,
          mediaAriaLabel: tPendingTranslation(
            'View listing for {listingName}',
            'ARIA label for clicking the artwork or title in a license recommendation to open the listing details page.',
            translationKey('Label.ViewListingAria', TranslationNamespace.Licenses),
            { listingName },
          ),
          onTitleClick: () => handleClickViewListing(recommendation),
          onMediaClick: () => handleClickViewListing(recommendation),
        };
      }),
    [
      getRecommendationReason,
      handleClickViewLicense,
      handleClickViewListing,
      recommendations,
      tPendingTranslation,
    ],
  );

  if (!canRenderBanner) {
    return null;
  }

  return (
    <div ref={carouselContainerRef} className='width-full'>
      <LicenseHeroCarousel
        slides={slides}
        activeIndex={activeIndex}
        onSelectIndex={handleSelectRecommendation}
        previousAriaLabel={translate('Action.Back')}
        nextAriaLabel={tPendingTranslation(
          'Next recommendation',
          'ARIA label for the carousel button that advances to the next license recommendation.',
          translationKey('Action.NextRecommendation', TranslationNamespace.Licenses),
        )}
        getPositionAriaLabel={(position, count) =>
          tPendingTranslation(
            'Recommendation {position} of {count}',
            'ARIA label for a license recommendation carousel position indicator.',
            translationKey('Label.RecommendationPosition', TranslationNamespace.Licenses),
            {
              position: String(position),
              count: String(count),
            },
          )
        }
        testId='explore-license-recommendations'
        nextButtonTestId='explore-license-recommendation-next'
        previousButtonTestId='explore-license-recommendation-previous'
        getDotTestId={(index) => `explore-license-recommendation-dot-${index}`}
        autoAdvanceIntervalMs={RECOMMENDATION_AUTO_ADVANCE_MS}
      />
    </div>
  );
};

export default RecommendedLicensesBanner;
