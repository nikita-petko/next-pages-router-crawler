// Parses and normalizes current revenue-share action and perspective query parameters.
export const REV_SHARE_QUERY_KEYS = ['targetType', 'targetId', 'action', 'perspective'] as const;

type RevShareAction = 'create' | 'propose' | 'cancel';
export type RevSharePerspective = 'managed' | 'recipient';
type RevShareSurface = 'user' | 'group';
type RevShareQueryValue = string | string[] | null | undefined;

const isRevShareQueryScalar = (value: RevShareQueryValue): value is string =>
  typeof value === 'string';

const parseRevShareAction = (value: RevShareQueryValue): RevShareAction | null => {
  if (!isRevShareQueryScalar(value)) {
    return null;
  }

  switch (value) {
    case 'create':
    case 'propose':
    case 'cancel':
      return value;
    default:
      return null;
  }
};

const parseRevSharePerspective = (value: RevShareQueryValue): RevSharePerspective | null => {
  if (!isRevShareQueryScalar(value)) {
    return null;
  }

  switch (value) {
    case 'managed':
    case 'recipient':
      return value;
    default:
      return null;
  }
};

export const resolveRevSharePerspective = (
  perspective: RevShareQueryValue,
  surface: RevShareSurface,
): RevSharePerspective => {
  if (surface === 'user') {
    return 'recipient';
  }
  return parseRevSharePerspective(perspective) ?? 'managed';
};

type RevShareRouteQueryInput = {
  action?: RevShareQueryValue;
  perspective?: RevShareQueryValue;
};

type RevShareRouteNormalization = {
  action: RevShareAction | null;
  perspective: RevSharePerspective | null;
};

export const normalizeRevShareRouteQuery = (
  query: RevShareRouteQueryInput,
): RevShareRouteNormalization => ({
  action: parseRevShareAction(query.action),
  perspective: parseRevSharePerspective(query.perspective),
});
