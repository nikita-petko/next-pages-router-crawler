import type { TErrorFieldTranslation } from '../constants/errorTranslationKeyConstants';
import errorCodeTranslationKeys from '../constants/errorTranslationKeyConstants';

const operationDescriptionPrefix = 'OperationDescription.';
const read = 'Read';

// Look-ups are keyed by raw strings from the error response body, so use Maps to
// stay type-safe (value-or-undefined) without unsafe key assertions.
const errorCodeTranslationMap = new Map<string, TErrorFieldTranslation>(
  Object.entries(errorCodeTranslationKeys),
);

export function getOidcScopeOperationDescriptionTranslationKey(scope: string) {
  return `${operationDescriptionPrefix}${scope}${read}`;
}

export async function getErrorTranslationKey(errorResponse: Response): Promise<string | undefined> {
  let translationKey: string | undefined;

  try {
    const responseBody: unknown = await errorResponse.json();
    const isErrorBody = typeof responseBody === 'object' && responseBody !== null;

    const code =
      isErrorBody && 'code' in responseBody && typeof responseBody.code === 'string'
        ? responseBody.code
        : undefined;
    const field =
      isErrorBody && 'field' in responseBody && typeof responseBody.field === 'string'
        ? responseBody.field
        : undefined;

    const translationValue = code != null ? errorCodeTranslationMap.get(code) : undefined;

    if (translationValue != null) {
      if (typeof translationValue === 'string') {
        // error response code is unique (no field)
        translationKey = translationValue;
      } else if (field != null) {
        // error response is uniquely identified by both code and field
        translationKey = new Map<string, string>(Object.entries(translationValue)).get(field);
      }
    }
    return translationKey;
  } catch (e) {
    console.warn('there was an error parsing the translation key', e);
    return undefined;
  }
}
