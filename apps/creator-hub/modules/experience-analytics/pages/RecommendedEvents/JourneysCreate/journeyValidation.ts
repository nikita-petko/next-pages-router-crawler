// Matches DraftValidationHelper.cs AllowedKeyCharactersRegex — entry key rules
const JOURNEY_NAME_ALLOWED = /^[a-zA-Z0-9._-]+$/;
export const JOURNEY_NAME_MAX_LENGTH = 250;

// Matches journeys_config.proto JourneyNode.node_name field constraints
export const NODE_NAME_MAX_LENGTH = 50;
const NODE_NAME_FORBIDDEN = /[,"'\r\n]/;
export const NODES_PER_STAGE_MAX = 10;
export const STAGES_PER_JOURNEY_MIN = 2;
// Matches journeys_config.proto — stage_index is 1-based (1–10)
export const STAGES_PER_JOURNEY_MAX = 10;

export type JourneyNameError = 'required' | 'leadingUnderscore' | 'invalidChars' | 'tooLong';
export type NodeNameError =
  | 'required'
  | 'whitespaceOnly'
  | 'reservedPrefix'
  | 'forbiddenChars'
  | 'tooLong'
  | 'duplicate';

export function getJourneyNameError(name: string): JourneyNameError | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'required';
  }
  if (trimmed.startsWith('_')) {
    return 'leadingUnderscore';
  }
  if (!JOURNEY_NAME_ALLOWED.test(trimmed)) {
    return 'invalidChars';
  }
  if (trimmed.length > JOURNEY_NAME_MAX_LENGTH) {
    return 'tooLong';
  }
  return null;
}

export function getNodeNameError(name: string): Exclude<NodeNameError, 'duplicate'> | null {
  if (name.length === 0) {
    return 'required';
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'whitespaceOnly';
  }
  if (trimmed.startsWith('__')) {
    return 'reservedPrefix';
  }
  if (NODE_NAME_FORBIDDEN.test(trimmed)) {
    return 'forbiddenChars';
  }
  if (trimmed.length > NODE_NAME_MAX_LENGTH) {
    return 'tooLong';
  }
  return null;
}

// Returns IDs of nodes whose trimmed name appears more than once in the list.
export function getDuplicateNodeIds(
  nodes: ReadonlyArray<{ readonly id: string; readonly eventName: string }>,
): ReadonlySet<string> {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const node of nodes) {
    const trimmed = node.eventName.trim();
    if (!trimmed) {
      continue;
    }
    const firstId = seen.get(trimmed);
    if (firstId !== undefined) {
      duplicates.add(firstId);
      duplicates.add(node.id);
    } else {
      seen.set(trimmed, node.id);
    }
  }
  return duplicates;
}
