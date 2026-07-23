import {
  SearchContent,
  ClaimItemDiscoveredFromEnum,
  SearchContentToJSON,
  SearchContentFromJSON,
} from '@rbx/clients/rightsV1';
import { SearchSource } from './SearchEnums';

interface Match {
  searchContent: SearchContent;
  discoveredFrom: ClaimItemDiscoveredFromEnum;
  source: SearchSource;
  originalLink?: string; // Only used for expereince matches.
}

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonValue = JsonPrimitive | JsonArray | JsonObject;

function exists(json: JsonObject, key: string) {
  const value = json[key];
  return value !== null && value !== undefined;
}

export const instanceOfMatch = (value: JsonObject): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  return exists(value, 'searchContent') && exists(value, 'discoveredFrom');
};

export const MatchFromJSON = (json: JsonObject): Match => {
  if (json === undefined || json === null) {
    return json;
  }
  if (!exists(json, 'searchContent') || !exists(json, 'discoveredFrom')) {
    throw new Error('Match is missing required fields');
  }
  return {
    searchContent: SearchContentFromJSON(json.searchContent),
    discoveredFrom: ClaimItemDiscoveredFromEnum[json.discoveredFrom as ClaimItemDiscoveredFromEnum],
    source: SearchSource[json.source as SearchSource],
    originalLink: exists(json, 'originalLink') ? (json.originalLink as string) : undefined,
  };
};

export const MatchToJSON = (value: Match) => {
  if (value === undefined) {
    return undefined;
  }
  return {
    searchContent: SearchContentToJSON(value.searchContent),
    discoveredFrom: value.discoveredFrom,
    originalLink: value.originalLink,
    source: value.source,
  };
};

export default Match;
