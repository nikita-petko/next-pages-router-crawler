import { AgreementType } from '@rbx/clients/userAgreementsService/v1';
import type { useTranslation } from '@rbx/intl';
import { agreementsTranslationMap } from './constants';

type TTranslate = ReturnType<typeof useTranslation>['translate'];

// eslint-disable-next-line import/prefer-default-export
export const getAgreementName = (agreementType: AgreementType, translate: TTranslate) => {
  const translationKey = agreementsTranslationMap[agreementType];
  if (translationKey === undefined) {
    return translate(translationKey);
  }
  return agreementType.toString();
};
