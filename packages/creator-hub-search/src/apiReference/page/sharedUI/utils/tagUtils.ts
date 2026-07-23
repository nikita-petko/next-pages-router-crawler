import {
  APIReferenceMember,
  APIReferenceMemberWithReadWriteSecurityObj,
  memberHasReadWriteSecurityTagObj,
  memberHasSecurityTagList,
  memberHasThreadSafetyTag,
} from '../../../../client';
import {
  ThreadSafetyTag,
  ApiTag,
  SecurityTag,
  EngineTag,
  CloudTag,
  ReferenceClass,
} from '../../../../ui/tags/types';

// Engine Reference Tags
const tagDescriptionKeyMapping: Record<string, `Description.${string}`> = {
  [SecurityTag.PluginSecurity]: 'Description.PluginSecurity',
  [SecurityTag.LocalUserSecurity]: 'Description.LocalUserSecurity',
  [SecurityTag.RobloxScriptSecurity]: 'Description.RobloxScriptSecurity',
  [SecurityTag.RobloxSecurity]: 'Description.RobloxSecurity',
  [SecurityTag.RobloxEngineSecurity]: 'Description.RobloxSecurity',
  [SecurityTag.NotAccessibleSecurity]: 'Description.NotAccessibleSecurity',
  [ThreadSafetyTag.ReadSafe]: 'Description.ReadSafe',
  [ThreadSafetyTag.Safe]: 'Description.Safe',
  [ThreadSafetyTag.Unsafe]: 'Description.Unsafe',
  [ApiTag.Hidden]: 'Description.Hidden',
  [ApiTag.NotReplicated]: 'Description.NotReplicated',
  [ApiTag.ReadOnly]: 'Description.ReadOnly',
  [ApiTag.NotScriptable]: 'Description.NotScriptable',
  [ApiTag.NotBrowsable]: 'Description.NotBrowsable',
  [ApiTag.NotCreatable]: 'Description.NotCreatable',
  [ApiTag.CanYield]: 'Description.CanYield',
  [ApiTag.Yields]: 'Description.Yields',
  [ApiTag.NoYield]: 'Description.NoYield',
  [ApiTag.Service]: 'Description.Service',
  [ApiTag.PlayerReplicated]: 'Description.PlayerReplicated',
  [ApiTag.OpenCloudSecurity]: 'Description.OpenCloudSecurity',
};

export const getTagDescriptionKey = (tag: string): string | null =>
  tagDescriptionKeyMapping[tag] ?? null;

export const formatTagName = (tag: string): string => tag.replace(/_/g, ' ');

// Translation Key Suffix Maps
// - Translation keys are in the format `Label.${tagTranslationKeySuffix}` for
//   labels, and `Description.${tagTranslationKeySuffix}` for descriptions.
const SecurityTagTranslKeySuffixMap: Map<EngineTag, string> = new Map([
  [SecurityTag.PluginSecurity, 'PluginSecurity'],
  [SecurityTag.LocalUserSecurity, 'LocalUserSecurity'],
  [SecurityTag.RobloxScriptSecurity, 'RobloxScriptSecurity'],
  [SecurityTag.RobloxSecurity, 'RobloxSecurity'],
  [SecurityTag.RobloxEngineSecurity, 'RobloxSecurity'],
  [SecurityTag.NotAccessibleSecurity, 'NotAccessibleSecurity'],
]);

const ThreadSafetyTagTranslKeySuffixMap: Map<ThreadSafetyTag, string> = new Map([
  [ThreadSafetyTag.ReadSafe, 'ReadParallel'],
  [ThreadSafetyTag.Safe, 'WriteParallel'],
  // Note: [ThreadSafetyTag.Unsafe] is hidden
]);

const PropertyTagTranslKeySuffixMap: Map<ApiTag, string> = new Map([
  [ApiTag.CanYield, 'CanYield'],
  [ApiTag.CustomLuaState, 'CustomLuaState'],
  [ApiTag.Deprecated, 'Deprecated'],
  [ApiTag.Hidden, 'Hidden'],
  [ApiTag.NotBrowsable, 'NotBrowsable'],
  [ApiTag.NotCreatable, 'NotCreatable'],
  [ApiTag.NotReplicated, 'NotReplicated'],
  [ApiTag.NotScriptable, 'NotScriptable'],
  [ApiTag.NoYield, 'NoYield'],
  [ApiTag.PlayerReplicated, 'PlayerReplicated'],
  // propogated error from above
  [ApiTag.ReadOnly, 'ReadOnly'],
  [ApiTag.Service, 'Service'],
  [ApiTag.Settings, 'Settings'],
  [ApiTag.UserSettings, 'UserSettings'],
  [ApiTag.Yields, 'Yields'],
  [ApiTag.OpenCloudSecurity, 'OpenCloudSecurity'],
  [ApiTag.PluginSecurity, 'PluginSecurity'],
]);

// Open Cloud Reference Tags
const CloudTagTranslKeySuffixMap: Map<CloudTag, string> = new Map([
  [CloudTag.OutputOnly, 'OutputOnly'],
  [CloudTag.InputOnly, 'InputOnly'],
  [CloudTag.Required, 'Required'],
  [CloudTag.Immutable, 'Immutable'],
  [CloudTag.Deprecated, 'Deprecated'],
  [CloudTag.Beta, 'Beta'],
  [CloudTag.Experimental, 'Experimental'],
  [CloudTag.Stable, 'Stable'],
  [CloudTag.RecommendedAlternatives, 'RecommendedAlternatives'],
]);

export const engineTagTranslKeySuffixMap: Map<CloudTag | EngineTag, string> = new Map([
  ...SecurityTagTranslKeySuffixMap,
  ...ThreadSafetyTagTranslKeySuffixMap,
  ...PropertyTagTranslKeySuffixMap,
]);

// Translating Tags
export const getTagLabelTranslKey = (
  tag: EngineTag | CloudTag,
  referenceClass: ReferenceClass,
): string | undefined => {
  const translSuffixMap =
    referenceClass === 'cloud' ? CloudTagTranslKeySuffixMap : engineTagTranslKeySuffixMap;
  return translSuffixMap.get(tag) && `Label.${translSuffixMap.get(tag)}`;
};

export const getTagDescriptionTranslKey = (
  tag: EngineTag | CloudTag,
  referenceClass: ReferenceClass,
): string | undefined => {
  const translSuffixMap =
    referenceClass === 'cloud' ? CloudTagTranslKeySuffixMap : engineTagTranslKeySuffixMap;
  return translSuffixMap.get(tag) && `Description.${translSuffixMap.get(tag)}`;
};

export const threadSafetyTagLink = '/scripting/multithreading';

// tags to hide in API reference pages
const hiddenTags: EngineTag[] = [
  ThreadSafetyTag.Unsafe,

  SecurityTag.None,

  ApiTag.CustomLuaState,
  ApiTag.Settings,
  ApiTag.UserSettings,
];

const getReadWriteSecurityTags = (member: APIReferenceMemberWithReadWriteSecurityObj): string[] => {
  const result: string[] = [];
  if (!member.security) return result;
  if (member.security.write) result.push(member.security.write);
  if (member.security.read) result.push(member.security.read);
  return result;
};

export const getVisibleReferenceTags = (
  member: (APIReferenceMember | Partial<APIReferenceMember>) & {
    capabilities?: ApiTag[] | null;
    writeCapabilities?: ApiTag[] | null;
  },
) => {
  const readWriteSecurityTags = memberHasReadWriteSecurityTagObj(member)
    ? getReadWriteSecurityTags(member)
    : [];
  const otherSecurityTags =
    (memberHasSecurityTagList(member) && Array.isArray(member.security) ? member.security : []) ||
    [];
  const threadSafetyTags =
    (memberHasThreadSafetyTag(member) && !!member.threadSafety && [member.threadSafety]) || [];
  const capabilitiesTags = [...(member.capabilities || []), ...(member.writeCapabilities || [])];
  const fullTagsList: string[] = (member.tags as string[]) || [];
  fullTagsList.push(
    ...readWriteSecurityTags,
    ...otherSecurityTags,
    ...threadSafetyTags,
    ...capabilitiesTags,
  );
  const tags: Set<string> = new Set(fullTagsList); // removes any duplicates
  hiddenTags.forEach((tagToHide) => tags.delete(tagToHide as string));
  return Array.from(tags) as EngineTag[];
};

export function securityTagToInt(securityTag: SecurityTag) {
  switch (securityTag) {
    case SecurityTag.None:
      return 0;
    case SecurityTag.PluginSecurity:
      return 2;
    case SecurityTag.LocalUserSecurity:
      return 4;
    case SecurityTag.RobloxScriptSecurity:
      return 8;
    case SecurityTag.RobloxSecurity || SecurityTag.RobloxEngineSecurity:
      return 10;
    case SecurityTag.NotAccessibleSecurity:
      return 12;
    default: {
      // never
      return 999;
    }
  }
}
export const isDeprecatedTag = (tag: EngineTag | CloudTag | string): boolean => {
  // case-insensitive comparison of a value from any of several tag types
  const iTag = String(tag).toLowerCase();
  return (
    iTag === String(ApiTag.Deprecated).toLowerCase() ||
    iTag === String(CloudTag.Deprecated).toLowerCase()
  );
};

export const hasDeprecatedTag = (tags: Array<EngineTag | CloudTag> | null) =>
  tags?.some(isDeprecatedTag);

/**
 * Splits tags into deprecated and non-deprecated tags
 * @param tags - Array of tags to split (can be null or undefined)
 * @returns Object with hasDeprecatedTags boolean and nonDeprecatedTags array
 */
export const splitDeprecatedTags = (
  tags: Array<EngineTag | CloudTag> | null | undefined,
): {
  hasDeprecatedTag: boolean;
  nonDeprecatedTags: Array<EngineTag | CloudTag>;
} => {
  if (!tags || tags.length === 0) {
    return { hasDeprecatedTag: false, nonDeprecatedTags: [] };
  }

  let hasDeprecated: boolean = false;
  const nonDeprecatedTags: Array<EngineTag | CloudTag> = [];

  tags.forEach((tag) => {
    if (isDeprecatedTag(tag)) {
      hasDeprecated = true;
    } else {
      nonDeprecatedTags.push(tag);
    }
  });

  return { hasDeprecatedTag: hasDeprecated, nonDeprecatedTags };
};
