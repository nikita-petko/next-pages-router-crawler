import { getGenAiCreativesAgreementStorageKey } from '@constants/aiCreatives';

export const hasAcceptedGenAiCreativesAgreement = (userId: number | undefined): boolean => {
  if (userId == null || typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(getGenAiCreativesAgreementStorageKey(userId)) === 'true';
};

export const setGenAiCreativesAgreementAccepted = (userId: number): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(getGenAiCreativesAgreementStorageKey(userId), 'true');
};
