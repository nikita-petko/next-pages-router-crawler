import type { AgreementType } from '@rbx/client-user-agreements-service/v1';
import type { UseTranslationResult } from '@rbx/intl';
import { agreementsTranslationMap } from './constants';

type TTranslate = UseTranslationResult['translate'];

export const getAgreementName = (agreementType: AgreementType, translate: TTranslate) => {
  const translationKey = agreementsTranslationMap[agreementType];
  if (translationKey === undefined) {
    return translate(translationKey);
  }
  return agreementType;
};
