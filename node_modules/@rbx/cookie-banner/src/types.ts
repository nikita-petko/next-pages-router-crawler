export enum NonEssentialCookieName {
  RBXViralAcquisition = 'RBXViralAcquisition',
  RBXSource = 'RBXSource',
  GoogleAnalytics = 'GoogleAnalytics',
}
export type NonEssentialCookieNameType = `${NonEssentialCookieName}`;

export type EssentialCookie = {
  cookieName: string;
  description: string;
};

export interface CookiePolicyResponse {
  ShouldCallEvidon: boolean;
  ShouldDisplayCookieBannerV3: boolean;
  NonEssentialCookieList: NonEssentialCookieNameType[];
  EssentialCookieList: EssentialCookie[];
}
