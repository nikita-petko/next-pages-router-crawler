/**
 * Frontend mirror of the cheap, stable backend universe-regex checks so the
 * create/edit form can reject obviously-bad rules inline instead of waiting for
 * a server round-trip.
 *
 * Scope note: we intentionally only mirror the cheap, stable checks here
 * (empty, length, nested repeating quantifier, leading wildcard, syntax).
 *
 * Keep in sync with the backend (universe-performance-metrics):
 *   - services/log-attribute-http-service/src/Services/LogAttributeService.cs (empty + length checks)
 *   - services/log-attribute-http-service/src/Utils/RegexGuard.cs (nested repeating quantifier, leading wildcard, syntax)
 *
 * The server remains the source of truth; this is a best-effort UX pre-check.
 */

/**
 * Max characters allowed for `pattern` and `output`. Mirrors the backend
 * `Settings.UniverseRegexFieldMaxLength` default. If the backend setting
 * changes, update this constant to match.
 */
export const REGEX_RULE_FIELD_MAX_LENGTH = 1000;

export type RegexRuleDuplicateCandidate = {
  id?: number;
  pattern: string;
};

export type RegexRuleValidationCode =
  | 'empty'
  | 'tooLong'
  | 'nestedRepeatingQuantifier'
  | 'leadingWildcard'
  | 'invalidSyntax';

export type RegexRuleValidationResult =
  | { isValid: true }
  | { isValid: false; code: RegexRuleValidationCode };

const VALID: RegexRuleValidationResult = { isValid: true };

const startsWithWildcard = (pattern: string): boolean =>
  pattern.startsWith('.*') ||
  pattern.startsWith('.+') ||
  pattern.startsWith('(.*)') ||
  pattern.startsWith('(.+)');

const skipCharacterClass = (pattern: string, openBracketIndex: number): number => {
  let index = openBracketIndex + 1;
  if (index < pattern.length && pattern[index] === '^') {
    index += 1;
  }

  if (index < pattern.length && pattern[index] === ']') {
    index += 1;
  }

  while (index < pattern.length) {
    if (pattern[index] === '\\') {
      index += 2;
      continue;
    }

    if (pattern[index] === ']') {
      return index;
    }

    index += 1;
  }

  return pattern.length - 1;
};

const tryConsumeUnboundedRepeatingQuantifier = (pattern: string, index: number): number | null => {
  if (index >= pattern.length) {
    return null;
  }

  const character = pattern[index];
  if (character === '+' || character === '*') {
    return index + 1 < pattern.length && pattern[index + 1] === '?' ? 2 : 1;
  }

  if (character !== '{') {
    return null;
  }

  let cursor = index + 1;
  while (cursor < pattern.length && /\d/.test(pattern[cursor])) {
    cursor += 1;
  }

  if (cursor >= pattern.length || pattern[cursor] !== ',') {
    return null;
  }

  cursor += 1;
  if (cursor < pattern.length && pattern[cursor] === '}') {
    return cursor + 1 < pattern.length && pattern[cursor + 1] === '?'
      ? cursor - index + 2
      : cursor - index + 1;
  }

  return null;
};

const hasNestedRepeatingQuantifiers = (pattern: string): boolean => {
  const groupContainsRepeater = [false];
  let lastTokenWasCloseParen = false;
  let lastClosedGroupHadRepeater = false;

  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern[index] === '\\') {
      if (index + 1 < pattern.length) {
        index += 1;
      }

      lastTokenWasCloseParen = false;
      lastClosedGroupHadRepeater = false;
      continue;
    }

    if (pattern[index] === '[') {
      index = skipCharacterClass(pattern, index);
      lastTokenWasCloseParen = false;
      lastClosedGroupHadRepeater = false;
      continue;
    }

    if (pattern[index] === '(') {
      groupContainsRepeater.push(false);
      lastTokenWasCloseParen = false;
      lastClosedGroupHadRepeater = false;
      continue;
    }

    if (pattern[index] === ')') {
      if (groupContainsRepeater.length <= 1) {
        return true;
      }

      lastClosedGroupHadRepeater = groupContainsRepeater.pop() ?? false;
      if (groupContainsRepeater.length > 0) {
        const parentHadRepeater = groupContainsRepeater.pop() ?? false;
        groupContainsRepeater.push(parentHadRepeater || lastClosedGroupHadRepeater);
      }

      lastTokenWasCloseParen = true;
      continue;
    }

    const consumed = tryConsumeUnboundedRepeatingQuantifier(pattern, index);
    if (consumed !== null) {
      if (lastTokenWasCloseParen && lastClosedGroupHadRepeater) {
        return true;
      }

      if (groupContainsRepeater.length > 1) {
        groupContainsRepeater.pop();
        groupContainsRepeater.push(true);
      }

      index += consumed - 1;
      lastTokenWasCloseParen = false;
      lastClosedGroupHadRepeater = false;
      continue;
    }

    lastTokenWasCloseParen = false;
    lastClosedGroupHadRepeater = false;
  }

  return false;
};

/**
 * Validates a regex rule pattern, mirroring the backend order:
 * empty -> length -> nested repeating quantifier -> leading wildcard -> syntax.
 */
export const validateRegexPattern = (pattern: string): RegexRuleValidationResult => {
  if (!pattern || pattern.trim().length === 0) {
    return { isValid: false, code: 'empty' };
  }

  if (pattern.length > REGEX_RULE_FIELD_MAX_LENGTH) {
    return { isValid: false, code: 'tooLong' };
  }

  if (hasNestedRepeatingQuantifiers(pattern)) {
    return { isValid: false, code: 'nestedRepeatingQuantifier' };
  }

  if (startsWithWildcard(pattern)) {
    return { isValid: false, code: 'leadingWildcard' };
  }

  try {
    // eslint-disable-next-line no-new -- compile-only validity check, mirrors backend `new Regex(...)`
    new RegExp(pattern);
  } catch {
    return { isValid: false, code: 'invalidSyntax' };
  }

  return VALID;
};

/** Validates the (optional) output field, which the backend only length-checks. */
export const validateRuleOutputLength = (output: string): RegexRuleValidationResult => {
  if (output.length > REGEX_RULE_FIELD_MAX_LENGTH) {
    return { isValid: false, code: 'tooLong' };
  }
  return VALID;
};

export const hasDuplicateRegexRule = (
  candidate: RegexRuleDuplicateCandidate,
  existingRules: RegexRuleDuplicateCandidate[],
): boolean => {
  return existingRules.some((rule) => {
    if (candidate.id !== undefined && rule.id === candidate.id) {
      return false;
    }

    return rule.pattern === candidate.pattern;
  });
};
