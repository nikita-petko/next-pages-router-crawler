import type { RobloxGameInternationalizationApiFailedNameDescription } from '@rbx/client-gameinternationalization/v1';
import { textFilterErrorCode, textFilterErrorMessage } from '../../common/constants';

export default function errorParser(
  responses: RobloxGameInternationalizationApiFailedNameDescription[],
): Error {
  const isTextFiltered = responses.some((response) => response.errorCode === textFilterErrorCode);
  return new Error(isTextFiltered ? textFilterErrorMessage : '');
}
