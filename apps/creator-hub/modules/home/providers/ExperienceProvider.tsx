import React, {
  FunctionComponent,
  useEffect,
  useState,
  useMemo,
  useContext,
  useCallback,
  createContext,
} from 'react';
import {
  GameDetailResponse,
  gamesClient,
  UniverseResponse,
  V1SearchUniversesRequest,
  universesClient,
} from '@modules/clients';
import {
  SearchCreatorType,
  SearchSortParameter,
  SortOrder,
  Surface,
  UniverseModel,
} from '@rbx/clients/universesApi';
import { CreatorType } from '@modules/miscellaneous/common';
import {
  useRAQIV2Client,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import experienceGuidelinesServiceApiClient from '@modules/clients/experienceGuidelinesService';
import coreContentClient from '@modules/clients/coreContent';
import type { UniverseEligibility } from '@rbx/clients/coreContentApi';
import { TCreator } from './CreatorProvider';
import { getRAQIV2ExperienceAnalytics, TExperienceAnalytics } from './getExperienceAnalytics';

export type TExperience = UniverseResponse & { id: number; isFriendsOnly?: boolean };
export type TExperienceDetails = GameDetailResponse & { id: number };

export type TExperienceContext = {
  experiences: Readonly<Record<TExperience['id'], TExperience> | null>;
  experiencesDetails: Record<TExperienceDetails['id'], TExperienceDetails> | null;
  experiencesAnalytics: Readonly<Record<TExperience['id'], TExperienceAnalytics | null> | null>;
  experiencesContentMaturity: Readonly<Record<number, string | undefined> | null>;
  experiencesCoreContentEligibility: Readonly<Record<
    number,
    UniverseEligibility | undefined
  > | null>;
  removeExperience: (id: number) => void;
  updateExperience: (id: number, experience: TExperience) => void;
};

const ExperienceContext = createContext<TExperienceContext>({
  experiences: null,
  experiencesDetails: null,
  experiencesAnalytics: null,
  experiencesContentMaturity: null,
  experiencesCoreContentEligibility: null,
  removeExperience: () => new Error('useExperience should be used within a ExperienceProvider'),
  updateExperience: () => new Error('useExperience should be used within a ExperienceProvider'),
});

export const useExperience = () => {
  const {
    experiences,
    experiencesDetails,
    experiencesAnalytics,
    experiencesContentMaturity,
    experiencesCoreContentEligibility,
    removeExperience,
    updateExperience,
  } = useContext(ExperienceContext);
  return {
    experiences,
    experiencesDetails,
    experiencesAnalytics,
    experiencesContentMaturity,
    experiencesCoreContentEligibility,
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

  const getExperiences = async (creatorContext: TCreator) => {
    try {
      const creatorType =
        creatorContext.type === CreatorType.User ? SearchCreatorType.User : SearchCreatorType.Group;

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
          id: universe.id || 0,
          creatorType: creatorContext.type,
          creatorName: creatorContext.name,
          privacyType: universe.privacyType ?? undefined,
          isActive: universe.privacyType?.toLowerCase() === 'public',
          isFriendsOnly: universe.isFriendsOnly ?? undefined,
        })) || []
      );
    } catch {
      return [];
    }
  };

  const getExperienceDetails = async (universeIds: number[]) => {
    try {
      const { data = [] } = await gamesClient.getDetails(universeIds);
      return data.reduce<Record<TExperienceDetails['id'], TExperienceDetails>>(
        (acc, curr) => ({ ...acc, [curr.id || 0]: { ...curr, id: curr.id || 0 } }),
        {},
      );
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

      try {
        const loadedAnalytics = await Promise.all(
          loadedExperiences.map((experience) => getExperienceAnalytics(experience.id)),
        );
        setExperiencesAnalytics(
          loadedExperiences.reduce<Record<TExperience['id'], TExperienceAnalytics | null>>(
            (acc, curr, index) => {
              acc[curr.id || 0] = loadedAnalytics[index];
              return acc;
            },
            {},
          ),
        );
      } catch {
        setExperiencesAnalytics({});
      }

      try {
        const loadedDetails = await getExperienceDetails(
          loadedExperiences.map((experience) => experience.id),
        );
        setExperiencesDetails(loadedDetails);
      } catch {
        setExperiencesDetails({});
      }

      try {
        const universeIds = loadedExperiences
          .map((experience) => experience.id)
          .filter((id) => id !== 0);
        if (universeIds.length > 0) {
          const guidelines =
            (
              await experienceGuidelinesServiceApiClient.multiGetAgeRecommendations(
                universeIds,
                true,
              )
            ).ageRecommendationDetailsByUniverse ?? [];
          const contentMaturityByUniverseId: Record<number, string | undefined> = {};
          guidelines.forEach((guideline) => {
            if (guideline.universeId) {
              contentMaturityByUniverseId[guideline.universeId] =
                guideline.ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation?.contentMaturity;
            }
          });
          setExperiencesContentMaturity(contentMaturityByUniverseId);
        } else {
          setExperiencesContentMaturity({});
        }
      } catch {
        // If EGS errors, do not block loading of experiences.
        setExperiencesContentMaturity({});
      }

      try {
        const universeIds = loadedExperiences
          .map((experience) => experience.id)
          .filter((uid) => uid !== 0);
        if (universeIds.length > 0) {
          const response = await coreContentClient.coreContentBatchGetUniversePublishEligibility({
            coreContentBatchGetUniversePublishEligibilityRequest: { universeIds },
          });
          const eligibilityByUniverseId: Record<number, UniverseEligibility | undefined> = {};
          universeIds.forEach((uid) => {
            eligibilityByUniverseId[uid] = response.universeEligibilities?.[uid];
          });
          setExperiencesCoreContentEligibility(eligibilityByUniverseId);
        } else {
          setExperiencesCoreContentEligibility({});
        }
      } catch {
        setExperiencesCoreContentEligibility({});
      }
    };
    loadData();
  }, [context, getExperienceAnalytics]);

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

  const value = useMemo(
    () => ({
      experiences,
      experiencesAnalytics,
      experiencesDetails,
      experiencesContentMaturity,
      experiencesCoreContentEligibility,
      removeExperience,
      updateExperience,
    }),
    [
      experiences,
      experiencesAnalytics,
      experiencesDetails,
      experiencesContentMaturity,
      experiencesCoreContentEligibility,
      removeExperience,
      updateExperience,
    ],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
};

export default ExperienceProvider;
