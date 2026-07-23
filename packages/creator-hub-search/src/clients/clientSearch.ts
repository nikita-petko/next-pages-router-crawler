// eslint-disable-next-line import/no-extraneous-dependencies
import MiniSearch from 'minisearch';
import type {
  SearchApi,
  SearchUniversesResponse as V1SearchUniversesResponse,
} from '@rbx/client-universes-api/v1';
import type { GroupsApi } from '@rbx/client-creator-home-api/v1';
import { getCurrentPlatform, Platform } from '@rbx/core';
import { v4 as uuidv4 } from 'uuid';
import { TUser } from '../search/types/types';
import { DocSiteResult, parseDocumentationSubType } from './docSiteSearchType';
import fetchIndexDocuments, {
  IndexDocument,
  isExperiencePage,
  clearIndexDocumentsCache,
} from './indexDocumentsClient';
import type { ExperiencePermissions } from './permissionTypes';
import type { PermissionClient, GroupPermissionsMap, GroupUniverseMap } from './permissionClient';
import {
  getSearchIndexCache,
  setSearchIndexCache,
  clearSearchIndexCache,
  computeExperienceFingerprint,
} from './searchIndexCache';

/**
 * Template utility function to replace variables like {experienceId}, {experienceName}
 */
const applyTemplate = (template: string, vars: Record<string, string>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] || match);
};

/**
 * Context variables for dynamic document generation.
 */
type ContextVariables = {
  experienceId: string;
  experienceName: string;
  placeId: string;
  placeName: string;
  creatorName: string;
  userName: string;
};

/**
 * Slimmed document stored in the MiniSearch index.
 * Only fields needed for search matching and result reconstruction are kept.
 * Fields like summary, description, views, locale, and reference are hardcoded
 * at output time to reduce per-document memory footprint (~45% smaller).
 */
interface SearchableDocument {
  id: string;
  identifier: string;
  title: string;
  breadcrumb: string;
  documentationSubType: string;
  resultTargetReference: string;
  experienceId?: string;
  experienceName?: string;
  creatorName?: string;
}

/**
 * Converts an IndexDocument to a SearchableDocument format.
 * Only produces fields needed for search indexing and result display.
 */
const convertToSearchableDocument = (
  doc: IndexDocument,
  vars: ContextVariables,
): SearchableDocument => {
  const applyVars = (text: string) => (vars ? applyTemplate(text, vars) : text);

  const title = doc.title ?? (vars ? applyVars(doc.titleDynamic || doc.title) : '');
  const breadcrumbsDynamic = doc?.breadcrumbsDynamic?.join(' / ') || '';
  const breadcrumbs = vars ? `${applyVars(breadcrumbsDynamic)}` : doc.breadcrumbs.join(' / ');
  const resultTargetReference = vars
    ? applyVars(doc.resultTargetReferenceDynamic || doc.resultTargetReference)
    : doc.resultTargetReference;

  return {
    id: uuidv4(),
    identifier: doc.identifier,
    title,
    breadcrumb: breadcrumbs,
    documentationSubType: doc.documentationSubType,
    resultTargetReference,
    experienceId: vars?.experienceId,
    experienceName: vars?.experienceName,
    creatorName: vars?.creatorName || undefined,
  };
};

let cachedMiniSearch: MiniSearch<SearchableDocument> | null = null;
let cachedUserId: number | null = null;

/**
 * Experience caps tuned per device class to balance coverage vs memory.
 * Desktop 800 ≈ 33 MB runtime, mobile 270 ≈ 13 MB — both within browser tab budgets.
 * Detection uses maxTouchPoints heuristic; can be refined later.
 */
export const MAX_EXPERIENCES_DESKTOP = 800;
export const MAX_EXPERIENCES_MOBILE = 400;

export const getMaxSearchableExperiences = (): number => {
  const currentPlatform = getCurrentPlatform();
  const isMobile = currentPlatform === Platform.Android || currentPlatform === Platform.iOS;
  return isMobile ? MAX_EXPERIENCES_MOBILE : MAX_EXPERIENCES_DESKTOP;
};

const GROUP_FETCH_CONCURRENCY = 6;

/**
 * Cap on results returned by searchClientDocuments.
 * MiniSearch can match thousands of documents for broad queries (e.g. "game"),
 * but the UI only displays a handful at a time. Processing and re-ranking
 * thousands of results blocks the main thread, so we truncate early.
 * MiniSearch returns results pre-sorted by relevance, so the top N are the best.
 */
const MAX_CLIENT_SEARCH_RESULTS = 1000;

/**
 * Fetches group experiences in batches with a concurrency limit and early-stop.
 * Uses allSettled so one group failure doesn't lose other groups' results.
 */
const fetchGroupExperiences = async (
  groups: { id: number }[],
  searchApi: SearchApi,
  cap: number,
  personalCount: number,
): Promise<NonNullable<V1SearchUniversesResponse['data']>> => {
  const accumulated: NonNullable<V1SearchUniversesResponse['data']> = [];

  for (let i = 0; i < groups.length; i += GROUP_FETCH_CONCURRENCY) {
    if (personalCount + accumulated.length >= cap) break;

    const chunk = groups.slice(i, i + GROUP_FETCH_CONCURRENCY);
    // eslint-disable-next-line no-await-in-loop
    const settled = await Promise.allSettled(
      chunk.map((group) =>
        searchApi.searchSearchUniverses({
          surface: 'CreatorHubCreations',
          search: undefined,
          creatorType: 'Group',
          creatorTargetId: group.id,
          isArchived: false,
          sortOrder: 'Desc',
          sortParam: 'LastUpdated',
          pageSize: cap,
        }),
      ),
    );

    settled
      .filter(
        (r): r is PromiseFulfilledResult<V1SearchUniversesResponse> =>
          r.status === 'fulfilled' && !!r.value.data,
      )
      .forEach((r) => accumulated.push(...(r.value.data ?? [])));
  }

  return accumulated;
};

/**
 * Configuration for API calls in buildDataset.
 * Matches SearchClients from SearchConfigContext — consumers pass `clients` directly.
 */
export interface BuildDatasetConfig {
  /** SearchApi client for universes (from SearchConfigProvider) */
  universesSearchApi: SearchApi;
  /** GroupsApi client (from SearchConfigProvider) */
  groupsApi: GroupsApi;
  /** Permission client bundling fetch, cache, and page-level checks */
  permissionClient: PermissionClient;
}

/**
 * Builds the search dataset from index documents.
 * For logged-in users, includes personalized dynamic documents based on their experiences.
 *
 * The flow:
 * 1. Fetch all experiences (personal + per group, sorted by LastUpdated)
 * 2. Merge all, sort globally by lastUpdated, take top MAX_SEARCHABLE_EXPERIENCES
 * 3. Extract unique groups from top experiences, fetch permissions in parallel
 * 4. Build dataset — for each experience, check permissions before adding dynamic docs
 *
 * @param user - The authenticated user (or null/undefined for anonymous)
 * @param config - Configuration for API calls and permissions
 */
const buildDataset = async (
  user: TUser,
  config: BuildDatasetConfig,
): Promise<SearchableDocument[]> => {
  const documents: SearchableDocument[] = [];

  // Fetch index documents from the client
  const indexDocuments = await fetchIndexDocuments();

  const contextVariablesUserLevel: ContextVariables = {
    experienceId: '',
    experienceName: '',
    placeId: '',
    placeName: '',
    creatorName: '',
    userName: user?.name || '',
  };
  const userLevelDocuments = indexDocuments.filter((doc) => !isExperiencePage(doc));
  const experienceLevelDocuments = indexDocuments.filter((doc) => isExperiencePage(doc));

  // Add user-level documents (static pages + user-scoped dynamic pages like {userName})
  userLevelDocuments.forEach((doc) => {
    documents.push(convertToSearchableDocument(doc, contextVariablesUserLevel));
  });

  // If user is not logged in, return only static documents
  if (!user?.id) {
    return documents;
  }

  // Fetch user's experiences for dynamic document generation
  let experiences: V1SearchUniversesResponse['data'] = [];

  try {
    // ── Step 1: Fetch all experiences (personal + group) ──
    const { groups } = await config.groupsApi.groupsListGroups({
      surface: 'CreatorHub',
    });

    const personalResponse: V1SearchUniversesResponse =
      await config.universesSearchApi.searchSearchUniverses({
        surface: 'CreatorHubCreations',
        search: undefined,
        creatorType: 'User',
        creatorTargetId: user.id,
        isArchived: false,
        sortOrder: 'Desc',
        sortParam: 'LastUpdated',
        pageSize: getMaxSearchableExperiences(),
      });

    const cap = getMaxSearchableExperiences();
    const allGroupExperiences = await fetchGroupExperiences(
      groups,
      config.universesSearchApi,
      cap,
      personalResponse.data?.length ?? 0,
    );

    experiences = [...(personalResponse.data || []), ...allGroupExperiences];
  } catch {
    // If API calls fail, continue with static documents only
  }

  if (experiences.length > getMaxSearchableExperiences()) {
    return documents;
  }

  // ── Step 2: Merge, sort by lastUpdated globally, take top N ──
  const sortedExperiences = experiences
    .sort((a, b) => {
      const dateA = a.updated ? new Date(a.updated).getTime() : 0;
      const dateB = b.updated ? new Date(b.updated).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, getMaxSearchableExperiences());

  // ── Step 3: Extract unique groups from top experiences, fetch permissions ──
  let groupPermissionsMap: GroupPermissionsMap = new Map();

  try {
    // Build map: groupId → sampleUniverseId (first experience found for that group)
    const groupUniverseMap: GroupUniverseMap = new Map();
    sortedExperiences.forEach((exp) => {
      if (exp.creatorType === 'Group' && exp.creatorTargetId && exp.id) {
        const groupId = String(exp.creatorTargetId);
        if (!groupUniverseMap.has(groupId)) {
          groupUniverseMap.set(groupId, String(exp.id));
        }
      }
    });

    // Fetch permissions for all unique groups in parallel
    if (groupUniverseMap.size > 0) {
      groupPermissionsMap =
        await config.permissionClient.fetchPermissionsForGroups(groupUniverseMap);
    }
  } catch {
    // If permission fetch fails, continue without filtering (fail-open)
    groupPermissionsMap = new Map();
  }

  // ── Step 4: Build dataset with permission filtering ──
  sortedExperiences.forEach((experience) => {
    const experienceId = experience.id?.toString() || '';
    const experienceName = experience.name || 'Unnamed Experience';
    const placeId = experience.rootPlaceId?.toString() || '';
    const creatorName = experience.creatorName || '';
    const userName = user.name || '';

    const contextVariablesForExperience: ContextVariables = {
      experienceId,
      experienceName,
      placeId,
      placeName: experienceName,
      creatorName,
      userName,
    };

    // Determine permissions: personal = owner (full), group = fetched permissions
    const isPersonal = experience.creatorType === 'User';
    const permissions: ExperiencePermissions | null = isPersonal
      ? config.permissionClient.OWNER_PERMISSIONS
      : (groupPermissionsMap.get(String(experience.creatorTargetId)) ?? null);

    // Generate a document for each experience-level template + experience combination
    experienceLevelDocuments.forEach((doc) => {
      // Permission check: skip if user lacks required permission
      // If permissions is null (not fetched), allow all (fail-open)
      if (permissions && !config.permissionClient.shouldShowPage(doc.identifier, permissions)) {
        return;
      }
      documents.push(convertToSearchableDocument(doc, contextVariablesForExperience));
    });
  });
  return documents;
};

const MINISEARCH_OPTIONS = {
  fields: ['title', 'breadcrumb'],
  storeFields: [
    'id',
    'identifier',
    'title',
    'breadcrumb',
    'documentationSubType',
    'resultTargetReference',
    'experienceId',
    'experienceName',
    'creatorName',
  ],
  searchOptions: {
    boost: { title: 4, breadcrumb: 2 },
    fuzzy: 0.2,
    prefix: true,
  },
};

const getExperienceFingerprint = (documents: SearchableDocument[]): string => {
  const ids = documents.filter((d) => d.experienceId).map((d) => d.experienceId as string);
  return computeExperienceFingerprint([...new Set(ids)]);
};

/**
 * Builds a MiniSearch index from documents, updates the in-memory cache,
 * and persists the serialized index to IndexedDB.
 */
const indexAndCache = async (
  documents: SearchableDocument[],
  user: TUser,
): Promise<MiniSearch<SearchableDocument>> => {
  const miniSearch = new MiniSearch<SearchableDocument>(MINISEARCH_OPTIONS);
  await miniSearch.addAllAsync(documents, { chunkSize: 500 });

  cachedMiniSearch = miniSearch;
  cachedUserId = user?.id ?? null;

  if (user?.id) {
    setSearchIndexCache(user.id, {
      serializedIndex: JSON.stringify(miniSearch),
      experienceFingerprint: getExperienceFingerprint(documents),
      createdAt: Date.now(),
    }).catch(() => {
      // IndexedDB write failed — search still works, just no persistent cache
    });
  }

  return miniSearch;
};

/**
 * Builds the search dataset then indexes and caches the result.
 */
const buildAndCacheIndex = async (
  user: TUser,
  config: BuildDatasetConfig,
): Promise<MiniSearch<SearchableDocument>> => {
  const documents = await buildDataset(user, config);
  return indexAndCache(documents, user);
};

/**
 * Kicks off a background revalidation: fetches the current experience list,
 * compares its fingerprint to the cached one, and rebuilds if they differ.
 */
const backgroundRevalidate = (
  user: TUser,
  config: BuildDatasetConfig,
  cachedFingerprint: string,
): void => {
  (async () => {
    try {
      const documents = await buildDataset(user, config);
      if (getExperienceFingerprint(documents) === cachedFingerprint) return;
      await indexAndCache(documents, user);
    } catch {
      // Background refresh failed — stale cache is still usable
    }
  })();
};

/**
 * Gets or creates a MiniSearch instance with the user's documents.
 *
 * Flow:
 * 1. In-memory cache hit → return immediately
 * 2. IndexedDB cache hit (not expired) → load async, serve, background-revalidate
 * 3. Cache miss → full build (async), persist to IndexedDB in background
 */
const getMiniSearchInstance = async (
  user: TUser,
  config: BuildDatasetConfig,
): Promise<MiniSearch<SearchableDocument>> => {
  if (cachedMiniSearch && cachedUserId === user?.id) {
    return cachedMiniSearch;
  }

  if (user?.id) {
    const cached = await getSearchIndexCache(user.id);
    if (cached) {
      try {
        const miniSearch = await MiniSearch.loadJSONAsync<SearchableDocument>(
          cached.serializedIndex,
          MINISEARCH_OPTIONS,
        );
        cachedMiniSearch = miniSearch;
        cachedUserId = user.id;

        backgroundRevalidate(user, config, cached.experienceFingerprint);

        return miniSearch;
      } catch {
        // Corrupted cache — fall through to full rebuild
      }
    }
  }

  const miniSearch = await buildAndCacheIndex(user, config);
  return miniSearch;
};

/**
 * Pre-warms the MiniSearch index so the first search query is instant.
 * Routes through getMiniSearchInstance to benefit from all caching layers.
 */
export const warmUpSearchIndex = async (user: TUser, config: BuildDatasetConfig): Promise<void> => {
  await getMiniSearchInstance(user, config);
};

/**
 * Searches client documents using MiniSearch.
 * Returns ALL matching results (no page size limit).
 * Pagination/limiting is handled at the UI layer.
 *
 * @param keyword - The search query
 * @param user - The current user (for personalized results)
 * @param config - Configuration for API calls and permissions
 * @returns Array of search results
 */
export const searchClientDocuments = async (
  keyword: string,
  user: TUser,
  config: BuildDatasetConfig,
): Promise<DocSiteResult[]> => {
  if (!keyword || !user?.id) {
    return [];
  }

  try {
    const miniSearch = await getMiniSearchInstance(user, config);

    // Count unique query terms for term coverage calculation
    const queryTerms = keyword
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    const totalQueryTerms = queryTerms.length;

    const rawResults = miniSearch
      .search(keyword, { combineWith: 'OR' })
      .slice(0, MAX_CLIENT_SEARCH_RESULTS);

    const resultsWithAdjustedScore = rawResults.map((result) => {
      // result.terms contains the unique terms that matched this document
      const matchedTermsCount = result.terms?.length || 0;

      // Calculate term coverage: what percentage of query terms matched
      // 2/2 terms = 100% coverage = 2x boost
      // 1/2 terms = 50% coverage = 1.5x boost
      const termCoverageBoost = totalQueryTerms > 1 ? 1 + matchedTermsCount / totalQueryTerms : 1;

      return {
        result,
        adjustedScore: result.score * termCoverageBoost,
      };
    });

    // Sort by adjusted score (term coverage boosted)
    resultsWithAdjustedScore.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return resultsWithAdjustedScore.map(({ result }) => ({
      elasticsearchDocumentId: result.id,
      identifier: result.identifier,
      title: result.title,
      summary: '',
      displayedSummary: '',
      breadcrumb: result.breadcrumb,
      description: '',
      documentationContentType: 'CreatorHub',
      documentationSubType: parseDocumentationSubType(result.documentationSubType || ''),
      documentationThirdType: null,
      reference: result.resultTargetReference ? [result.resultTargetReference] : [],
      resultTargetReference: result.resultTargetReference,
      url: result.resultTargetReference,
      locale: 'en-us',
      views: 0,
      clicks: 0,
      engagementScore: 0,
      tags: [],
      entityId: result.experienceId,
      experienceName: result.experienceName,
      creatorName: result.creatorName,
    }));
  } catch (error) {
    // Silently handle client search errors
    return [];
  }
};

/**
 * Clears all client search caches (in-memory + IndexedDB).
 * Call this when documents need to be refreshed.
 * Note: permission cache is now per-PermissionClient instance (managed by context).
 */
export const clearClientSearchCache = () => {
  cachedMiniSearch = null;
  cachedUserId = null;
  clearIndexDocumentsCache();
  clearSearchIndexCache().catch(() => {
    // IndexedDB clear failed — in-memory cache is already cleared
  });
};

export default buildDataset;
