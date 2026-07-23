import { AgreementType } from '@rbx/clients/userAgreementsService/v1';

export const agreementsTranslationMap: Record<AgreementType, string> = {
  [AgreementType.ChildrenPrivacyPolicy]: 'Label.ChildrenPrivacyPolicy',
  [AgreementType.ConsentFlow]: 'Label.ConsentFlow',
  [AgreementType.LuobuThirdPartyDataUse]: 'Label.LuobuThirdPartyDataUse',
  [AgreementType.PersonalInformationPolicy]: 'Label.PersonalInformationPolicy',
  [AgreementType.PrivacyPolicy]: 'Label.PrivacyPolicy',
  [AgreementType.RefundTerms]: 'Label.RefundTerms',
  [AgreementType.RiderTerms]: 'Label.RiderTerms',
  [AgreementType.TermsOfService]: 'Label.TermsOfService',
};
export const maxUpdateRetryCount = 3;
export const dontShowAgreementPaths = ['/v1-studio-login'];
