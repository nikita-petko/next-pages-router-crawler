import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useMemo, useContext, useCallback, createContext } from 'react';
import type { UniverseEligibility } from '@rbx/client-core-content-api/v1';
import type { UniverseModel } from '@rbx/client-universes-api/v1';
import {
  SearchCreatorType,
  SearchSortParameter,
  SortOrder,
  Surface,
} from '@rbx/client-universes-api/v1';
import coreContentClient from '@modules/clients/coreContent';
import type { UniverseResponse } from '@modules/clients/develop';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import gamesClient, { type GameDetailResponse } from '@modules/clients/games';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import placeSafetyStatusApi from '@modules/clients/placeSafetyStatus';
import universesClient, { type V1SearchUniversesRequest } from '@modules/clients/universes';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { CreatorType } from '@modules/miscellaneous/common';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import type { TCreator } from './CreatorProvider';
import type { TExperienceAnalytics } from './getExperienceAnalytics';
import { getRAQIV2ExperienceAnalytics } from './getExperienceAnalytics';

export type TExperience = Omit<UniverseResponse, 'audiences'> & {
  id: number;
  isFriendsOnly?: boolean;
  audiences?: number[];
};
export type TExperienceDetails = GameDetailResponse & { id: number };

export type PlaceSafetyFlags = {
  isSequestered: boolean;
  isDiscoveryBlocked: boolean;
};

const NO_PLACE_SAFETY_FLAGS: PlaceSafetyFlags = {
  isSequestered: false,
  isDiscoveryBlocked: false,
};

// The carousel renders at most this many tiles. Per-experience fan-out (analytics, place-safety)
// is restricted to the same top-N by `updated` so we don't pay for data the user can't see.
// Exported so `Experiences.tsx` and the provider stay in sync.
export const maxExperienceTiles = 12;

// Same sort/slice the carousel uses to pick what renders. Centralized here so the provider's
// fan-out targets and the carousel's display always agree.
const pickVisibleExperiences = (experiences: readonly TExperience[]): TExperience[] =>
  [...experiences]
    .sort((a, b) => (b.updated?.getTime() ?? 0) - (a.updated?.getTime() ?? 0))
    .slice(0, maxExperienceTiles);

export type TExperienceContext = {
  experiences: Readonly<Record<TExperience['id'], TExperience> | null>;
  // Top-N by `updated` desc, the actual set rendered by the carousel.
  visibleExperiences: readonly TExperience[] | null;
  experiencesDetails: Record<TExperienceDetails['id'], TExperienceDetails> | null;
  experiencesAnalytics: Readonly<Record<TExperience['id'], TExperienceAnalytics | null> | null>;
  experiencesContentMaturity: Readonly<Record<number, string | undefined> | null>;
  experiencesCoreContentEligibility: Readonly<Record<
    number,
    UniverseEligibility | undefined
  > | null>;
  experiencesSequestration: Readonly<Record<number, PlaceSafetyFlags> | null>;
  experiencesAgeRecommendation: Readonly<Record<number, number | null> | null>;
  removeExperience: (id: number) => void;
  updateExperience: (id: number, experience: TExperience) => void;
};

const ExperienceContext = createContext<TExperienceContext>({
  experiences: null,
  visibleExperiences: null,
  experiencesDetails: null,
  experiencesAnalytics: null,
  experiencesContentMaturity: null,
  experiencesCoreContentEligibility: null,
  experiencesSequestration: null,
  experiencesAgeRecommendation: null,
  removeExperience: () => new Error('useExperience should be used within a ExperienceProvider'),
  updateExperience: () => new Error('useExperience should be used within a ExperienceProvider'),
});

export const useExperience = () => {
  const {
    experiences,
    visibleExperiences,
    experiencesDetails,
    experiencesAnalytics,
    experiencesContentMaturity,
    experiencesCoreContentEligibility,
    experiencesSequestration,
    experiencesAgeRecommendation,
    removeExperience,
    updateExperience,
  } = useContext(ExperienceContext);
  return {
    experiences,
    visibleExperiences,
    experiencesDetails,
    experiencesAnalytics,
    experiencesContentMaturity,
    experiencesCoreContentEligibility,
    experiencesSequestration,
    experiencesAgeRecommendation,
    removeExperience,
    updateExperience,
  };
};

export type TExperienceProviderProps = {
  context: TCreator;
  window: number;
};

export const ExperienceProvider: FunctionComponent<
  React.PropsWithChildren<TExperienceProviderProps>
> = ({ context, window, children }) => {
  const { client } = useRAQIV2Client(false);
  const translationDependency = useRAQIV2TranslationDependencies();

  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const [experiences, setExperiences] = useState<Record<TExperience['id'], TExperience> | null>(
    null,
  );
  const [experiencesDetails, setExperiencesDetails] = useState<Record<
    TExperienceDetails['id'],
    TExperienceDetails
  > | null>(null);

  const [experiencesAnalytics, setExperiencesAnalytics] = useState<Record<
    TExperience['id'],
    TExperienceAnalytics | null
  > | null>(null);

  const [experiencesContentMaturity, setExperiencesContentMaturity] = useState<Record<
    number,
    string | undefined
  > | null>(null);

  const [experiencesCoreContentEligibility, setExperiencesCoreContentEligibility] = useState<Record<
    number,
    UniverseEligibility | undefined
  > | null>(null);

  const [experiencesSequestration, setExperiencesSequestration] = useState<Record<
    number,
    PlaceSafetyFlags
  > | null>(null);

  const [experiencesAgeRecommendation, setExperiencesAgeRecommendation] = useState<Record<
    number,
    number | null
  > | null>(null);

  const getExperienceAnalytics = useCallback(
    async (universeId: number): Promise<TExperienceAnalytics | null> => {
      const result = await getRAQIV2ExperienceAnalytics(
        universeId,
        window,
        client,
        translationDependency,
      );
      return result.data;
    },
    [client, translationDependency, window],
  );

  const getExperiences = useCallback(
    async (creatorContext: TCreator) => {
      try {
        const creatorType =
          creatorContext.type === CreatorType.User
            ? SearchCreatorType.User
            : SearchCreatorType.Group;

        const searchRequest: V1SearchUniversesRequest = {
          search: undefined,
          creatorType,
          creatorTargetId: Number(creatorContext.id),
          isArchived: false,
          isPublic: undefined,
          sortOrder: SortOrder.Desc,
          sortParam: SearchSortParameter.LastUpdated,
          surface: Surface.CreatorHubHome,
          pageSize: 25,
          needsAssetOptions: true,
        };
        const response = await universesClient.searchUniverses(searchRequest);

        const { data } = response;

        return (
          data?.map((universe: UniverseModel) => ({
            ...universe,
            name: universe.name ?? undefined,
            description: universe.description ?? undefined,
            rootPlaceId: universe.rootPlaceId ?? undefined,
            privacyType: universe.privacyType ?? undefined,
            isFriendsOnly: universe.isFriendsOnly ?? undefined,
            isActive: universe.privacyType?.toLowerCase() === 'public',
            audiences: enableAudiencesReplacement ? (universe.audiences ?? undefined) : undefined,
            id: universe.id ?? 0,
            creatorType: creatorContext.type,
            creatorName: creatorContext.name,
          })) ?? []
        );
      } catch {
        return [];
      }
    },
    [enableAudiencesReplacement],
  );

  const getExperienceDetails = async (universeIds: number[]) => {
    try {
      const { data = [] } = await gamesClient.getDetails(universeIds);
      const result: Record<TExperienceDetails['id'], TExperienceDetails> = {};
      for (const curr of data) {
        result[curr.id ?? 0] = { ...curr, id: curr.id ?? 0 };
      }
      return result;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const loadData = async () => {
      let loadedExperiences: TExperience[] = [];
      setExperiences(null);
      setExperiencesAnalytics(null);
      setExperiencesDetails(null);
      setExperiencesContentMaturity(null);
      setExperiencesCoreContentEligibility(null);
      setExperiencesSequestration(null);
      setExperiencesAgeRecommendation(null);
      try {
        loadedExperiences = await getExperiences(context);
        setExperiences(
          loadedExperiences.reduce<Record<TExperience['id'], TExperience>>((acc, curr) => {
            acc[curr.id || 0] = { ...curr, id: curr.id || 0 };
            return acc;
          }, {}),
        );
      } catch {
        setExperiences([]);
      }

      // Restrict the expensive per-experience fan-out (analytics + place-safety) and the
      // batched lookups to the carousel's visible set so we don't pay for off-screen data.
      const topExperiences = pickVisibleExperiences(loadedExperiences);
      const universeIds = topExperiences
        .map((experience) => experience.id)
        .filter((id) => id !== 0);

      const analyticsPromise = Promise.all(
        topExperiences.map((experience) => getExperienceAnalytics(experience.id)),
      );
      const detailsPromise = getExperienceDetails(universeIds);
      const maturityPromise =
        universeIds.length > 0
          ? experienceGuidelinesServiceApiClient.multiGetAgeRecommendations(universeIds, true)
          : Promise.resolve(null);
      const eligibilityPromise =
        universeIds.length > 0
          ? coreContentClient.coreContentBatchGetUniversePublishEligibility({
              coreContentBatchGetUniversePublishEligibilityRequest: { universeIds },
            })
          : Promise.resolve(null);
      const sequestrationPromise = Promise.all(
        topExperiences.map(async (experience) => {
          if (!experience.rootPlaceId) {
            return { universeId: experience.id, flags: NO_PLACE_SAFETY_FLAGS };
          }
          try {
            const res = await placeSafetyStatusApi.getPlaceSafetyStatusById(experience.rootPlaceId);
            const status = res.placeSafetyStatus;
            const restriction: unknown = status?.userPlayabilityRestrictions;
            const flags: PlaceSafetyFlags = {
              isSequestered:
                restriction === 'RestrictedForAll' || restriction === 'RestrictedToOwner',
              isDiscoveryBlocked: status?.discoveryBlocked === true,
            };
            return { universeId: experience.id, flags };
          } catch {
            return { universeId: experience.id, flags: NO_PLACE_SAFETY_FLAGS };
          }
        }),
      );

      const [
        analyticsResult,
        detailsResult,
        maturityResult,
        eligibilityResult,
        sequestrationResult,
      ] = await Promise.allSettled([
        analyticsPromise,
        detailsPromise,
        maturityPromise,
        eligibilityPromise,
        sequestrationPromise,
      ]);

      if (analyticsResult.status === 'fulfilled') {
        setExperiencesAnalytics(
          topExperiences.reduce<Record<TExperience['id'], TExperienceAnalytics | null>>(
            (acc, curr, index) => {
              acc[curr.id || 0] = analyticsResult.value[index];
              return acc;
            },
            {},
          ),
        );
      } else {
        setExperiencesAnalytics({});
      }

      if (detailsResult.status === 'fulfilled') {
        setExperiencesDetails(detailsResult.value);
      } else {
        setExperiencesDetails({});
      }

      if (maturityResult.status === 'fulfilled' && maturityResult.value) {
        const guidelines = maturityResult.value.ageRecommendationDetailsByUniverse ?? [];
        const contentMaturityByUniverseId: Record<number, string | undefined> = {};
        const ageRecommendationByUniverseId: Record<number, number | null> = {};
        guidelines.forEach((guideline) => {
          if (guideline.universeId) {
            contentMaturityByUniverseId[guideline.universeId] =
              guideline.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation?.contentMaturity;
            const minAge =
              guideline.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation
                ?.minimumAge;
            ageRecommendationByUniverseId[guideline.universeId] = minAge ?? null;
          }
        });
        setExperiencesContentMaturity(contentMaturityByUniverseId);
        setExperiencesAgeRecommendation(ageRecommendationByUniverseId);
      } else {
        setExperiencesContentMaturity({});
        setExperiencesAgeRecommendation({});
      }

      if (eligibilityResult.status === 'fulfilled' && eligibilityResult.value) {
        const eligibilityByUniverseId: Record<number, UniverseEligibility | undefined> = {};
        universeIds.forEach((uid) => {
          eligibilityByUniverseId[uid] = eligibilityResult.value?.universeEligibilities?.[uid];
        });
        setExperiencesCoreContentEligibility(eligibilityByUniverseId);
      } else {
        setExperiencesCoreContentEligibility({});
      }

      if (sequestrationResult.status === 'fulfilled') {
        const byUniverseId: Record<number, PlaceSafetyFlags> = {};
        sequestrationResult.value.forEach(({ universeId, flags }) => {
          byUniverseId[universeId] = flags;
        });
        setExperiencesSequestration(byUniverseId);
      } else {
        setExperiencesSequestration({});
      }
    };
    void loadData();
  }, [context, getExperienceAnalytics, getExperiences, enableAudiencesReplacement]);

  const removeExperience = useCallback((id: number) => {
    setExperiences((prevState) => {
      if (prevState !== null) {
        const newState = { ...prevState };
        delete newState[id];
        return newState;
      }
      return prevState;
    });
  }, []);

  const updateExperience = useCallback((id: number, experience: TExperience) => {
    setExperiences((prevState) => {
      if (prevState !== null) {
        return { ...prevState, [id]: experience };
      }
      return prevState;
    });
  }, []);

  const visibleExperiences = useMemo(
    () => (experiences ? pickVisibleExperiences(Object.values(experiences)) : null),
    [experiences],
  );

  const value = useMemo(
    () => ({
      experiences,
      visibleExperiences,
      experiencesAnalytics,
      experiencesDetails,
      experiencesContentMaturity,
      experiencesCoreContentEligibility,
      experiencesSequestration,
      experiencesAgeRecommendation,
      removeExperience,
      updateExperience,
    }),
    [
      experiences,
      visibleExperiences,
      experiencesAnalytics,
      experiencesDetails,
      experiencesContentMaturity,
      experiencesCoreContentEligibility,
      experiencesSequestration,
      experiencesAgeRecommendation,
      removeExperience,
      updateExperience,
    ],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
};

export default ExperienceProvider;
