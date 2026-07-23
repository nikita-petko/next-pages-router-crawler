// type reference
// https://github.rbx.com/Roblox/snd-domain/tree/master/services/domain-documents/src/DomainDocuments.CreatorResources/Models/Elasticsearch/Documentation
import {
  DocumentationContentType as DocsSearchDocumentationContentType,
  DocumentationSubType as DocsSearchDocumentationSubType,
  DocumentationThirdType as DocsSearchDocumentationThirdType,
} from '@rbx/creator-docs-search';
import type { DocSiteResult as DocSiteResultRaw } from '@rbx/client-creator-resources-search-api/v1';
import {
  classesBasePath,
  datatypesBasePath,
  enumsBasePath,
  globalsBasePath,
  librariesBasePath,
} from '../apiReference/page/constants/apiReferenceConstants';
import { validate } from '../utilities/utils/enum';

/**
 * Using const objects instead of enums because TypeScript doesn't allow mixing
 * string literals (like All = '') with computed values from imported packages
 * (like LuaAPI = DocsSearchDocumentationContentType.LuaAPI) in the same enum.
 *
 * Const objects with 'as const' provide the same type safety as enums while
 * allowing us to use the actual values from the external @rbx/creator-docs-search package.
 * This ensures compatibility with the validate() function which expects Record<string, any>.
 */
export const DocumentationContentType = {
  All: '',
  LuaAPI: DocsSearchDocumentationContentType.LuaAPI,
  Article: DocsSearchDocumentationContentType.Article,
  CloudAPI: DocsSearchDocumentationContentType.CloudAPI,
  Video: DocsSearchDocumentationContentType.Video,
  DevForum: DocsSearchDocumentationContentType.DevForum,
  CreatorHub: 'CreatorHub',
} as const;

/**
 * High-level display categories for search results.
 * - Hub: CreatorHub pages (from clientSearch/MiniSearch)
 * - Learn: Documentation content (Engine API, Cloud API, Articles, Videos, DevForum)
 *
 * NOTE(@neoxu, 2026-02-06): In the future, consider adding `documentationScopeType: "Hub" | "Learn"` to
 * IndexDocument for explicit data-level categorization. This would:
 * - Make scope explicit at data level (self-documenting)
 * - Easier to add new Hub content types (beyond CreatorHub)
 * - Allow backend to filter by scope directly
 */
export const SearchDisplayCategory = {
  All: '',
  Hub: 'Hub',
  Learn: 'Learn',
} as const;

export type SearchDisplayCategory =
  (typeof SearchDisplayCategory)[keyof typeof SearchDisplayCategory];

/**
 * Maps a DocumentationContentType to its SearchDisplayCategory.
 * CreatorHub -> Hub, everything else -> Learn
 */
export const getDisplayCategory = (
  contentType: DocumentationContentType | null,
): SearchDisplayCategory => {
  if (contentType === DocumentationContentType.CreatorHub) {
    return SearchDisplayCategory.Hub;
  }
  return SearchDisplayCategory.Learn;
};

export type DocumentationContentType =
  (typeof DocumentationContentType)[keyof typeof DocumentationContentType];

export const DocumentationArticleSubType = {
  Guide: DocsSearchDocumentationSubType.Guide,
  Education: DocsSearchDocumentationSubType.Education,
} as const;

export type DocumentationArticleSubType =
  (typeof DocumentationArticleSubType)[keyof typeof DocumentationArticleSubType];

export const DocumentationLuaType = {
  Class: DocsSearchDocumentationSubType.Class,
  DataType: DocsSearchDocumentationSubType.DataType,
  Enum: DocsSearchDocumentationSubType.Enum,
  Global: DocsSearchDocumentationSubType.Global,
  Library: DocsSearchDocumentationSubType.Library,
} as const;

export type DocumentationLuaType = (typeof DocumentationLuaType)[keyof typeof DocumentationLuaType];

export const luaTypeToPathMapping: Record<DocumentationLuaType, string> = {
  [DocumentationLuaType.Class]: classesBasePath,
  [DocumentationLuaType.DataType]: datatypesBasePath,
  [DocumentationLuaType.Enum]: enumsBasePath,
  [DocumentationLuaType.Global]: globalsBasePath,
  [DocumentationLuaType.Library]: librariesBasePath,
};

export const DocumentationCloudApiType = {
  CloudApi: DocsSearchDocumentationSubType.CloudAPI,
  Legacy: DocsSearchDocumentationSubType.Legacy,
  V1: DocsSearchDocumentationSubType.V1,
  V2: DocsSearchDocumentationSubType.V2,
  Features: DocsSearchDocumentationSubType.Features,
  Instruction: 'Instruction',
} as const;

export type DocumentationCloudApiType =
  (typeof DocumentationCloudApiType)[keyof typeof DocumentationCloudApiType];

export const DocumentationDevForumSubType = {
  Announcements: DocsSearchDocumentationSubType.Announcements,
  RobloxStaff: DocsSearchDocumentationSubType.RobloxStaff,
  CommunityResources: DocsSearchDocumentationSubType.CommunityResources,
  CommunityTutorials: DocsSearchDocumentationSubType.CommunityTutorials,
} as const;

export type DocumentationDevForumSubType =
  (typeof DocumentationDevForumSubType)[keyof typeof DocumentationDevForumSubType];

const DocumentationSubType = {
  ...DocumentationArticleSubType,
  ...DocumentationLuaType,
  ...DocumentationCloudApiType,
};

export type DocumentationSubType =
  | DocumentationArticleSubType
  | DocumentationLuaType
  | DocumentationCloudApiType
  | DocumentationDevForumSubType; // Allow for future extensions or custom types

export const DocumentationCloudApiSubType = {
  Endpoint: DocsSearchDocumentationThirdType.Endpoint,
  API: DocsSearchDocumentationThirdType.API,
  Resource: DocsSearchDocumentationThirdType.Resource,
} as const;

export type DocumentationCloudApiSubType =
  (typeof DocumentationCloudApiSubType)[keyof typeof DocumentationCloudApiSubType];

export const DocumentationLuaSubType = {
  Property: DocsSearchDocumentationThirdType.Property,
  Event: DocsSearchDocumentationThirdType.Event,
  Method: DocsSearchDocumentationThirdType.Method,
  Function: DocsSearchDocumentationThirdType.Function,
  Callback: DocsSearchDocumentationThirdType.Callback,
  Constant: DocsSearchDocumentationThirdType.Constant,
  Constructor: DocsSearchDocumentationThirdType.Constructor,
  MathOperation: DocsSearchDocumentationThirdType.MathOperation,
  EnumItem: DocsSearchDocumentationThirdType.EnumItem,
  CodeSample: DocsSearchDocumentationThirdType.CodeSample,
} as const;

export type DocumentationLuaSubType =
  (typeof DocumentationLuaSubType)[keyof typeof DocumentationLuaSubType];

// https://stackoverflow.com/questions/48478361/how-to-merge-two-enums-in-typescript
export const DocumentationThirdType = {
  ...DocumentationCloudApiSubType,
  ...DocumentationLuaSubType,
};
export type DocumentationThirdType = DocumentationCloudApiSubType | DocumentationLuaSubType;

export type DocSiteResult = Omit<
  DocSiteResultRaw,
  'documentationContentType' | 'documentationSubType' | 'documentationThirdType'
> & {
  documentationContentType: DocumentationContentType | null;
  documentationSubType: DocumentationSubType | null;
  documentationThirdType: DocumentationThirdType | null;
  url: string | null;
  highlightedTitle?: string | null;
  highlightedDisplayedSummary?: string | null;
  /** Universe ID for experience pages (from client search). */
  entityId?: string;
  /** Full breadcrumb path for Creator Hub pages (from client search). */
  breadcrumb?: string;
  /** Experience name for experience-scoped pages (from client search). */
  experienceName?: string;
  /** Creator/owner name for experience-scoped pages (from client search). */
  creatorName?: string;
};

export function parseDocumentationContentType(str: string): DocumentationContentType | null {
  if (validate(DocumentationContentType, str)) {
    return str as DocumentationContentType;
  }
  return null;
}

export function parseDocumentationSubType(str: string): DocumentationSubType | null {
  if (validate(DocumentationArticleSubType, str)) {
    return str as DocumentationArticleSubType;
  }
  if (validate(DocumentationLuaType, str)) {
    return str as DocumentationLuaType;
  }
  if (validate(DocumentationCloudApiType, str)) {
    return str as DocumentationCloudApiType;
  }
  if (validate(DocumentationDevForumSubType, str)) {
    return str as DocumentationDevForumSubType;
  }
  return null;
}

export function parseDocumentationThirdType(str: string): DocumentationThirdType | null {
  if (validate(DocumentationCloudApiSubType, str)) {
    return str as DocumentationCloudApiSubType;
  }
  if (validate(DocumentationLuaSubType, str)) {
    return str as DocumentationLuaSubType;
  }
  return null;
}
