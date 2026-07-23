import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { deleteCookie } from '@rbx/core';
import type {
  CookiePolicyResponse,
  EssentialCookie,
  NonEssentialCookieNameType,
} from "../types";
import getBaseDomain from "../utils/getBaseDomain";

const COOKIE_CONSENT_COOKIE_NAME = "RBXcb";
const COOKIE_CONSENT_EXPIRY_DAYS = 180;
const COOKIE_CONSENT_API_ENDPOINT =
  "/guac-v2/v1/bundles/cookie-policy";

const COOKIE_CONSENT_DEFAULT_PREFERENCES: Record<
  NonEssentialCookieNameType,
  boolean
> = {
  RBXViralAcquisition: true,
  RBXSource: true,
  GoogleAnalytics: true,
};

export interface CookiePolicy {
  ShouldDisplayCookieBannerV3: boolean;
  NonEssentialCookieList: NonEssentialCookieNameType[];
  EssentialCookieList: EssentialCookie[];
}

export type CookiePreferences = Record<NonEssentialCookieNameType, boolean>;

interface CookieConsentContextType {
  cookiePolicy: CookiePolicy | null;
  preferences: CookiePreferences;
  updatePreference: (cookieName: string, value: boolean) => void;
  acceptAll: () => void;
  declineAll: () => void;
  isLoading: boolean;
  error: Error | null;
  hasAcceptedAnalyticsCookie: boolean;
  shouldShowBanner: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(
  null
);

export const useCookieConsentContext = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      "useCookieConsentContext must be used within a CookieConsentProvider"
    );
  }
  return context;
};

const hasExistingCookie = () => {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`));
};


const savePreferencesToCookie = (preferences: CookiePreferences) => {
  const preferencesString = Object.entries(preferences)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  Object.entries(preferences).forEach(([cookieName, value]) => {
    if (!value) {
      deleteCookie(cookieName);
    }
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_CONSENT_EXPIRY_DAYS);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${preferencesString}; expires=${expiryDate.toUTCString()}; path=/; domain=${getBaseDomain()}`;
};

const loadPreferencesFromCookie = (): CookiePreferences => {
  if (typeof document === "undefined")
    return COOKIE_CONSENT_DEFAULT_PREFERENCES;
  const savedPreferences = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`));

  if (!savedPreferences) {
    return COOKIE_CONSENT_DEFAULT_PREFERENCES;
  }
  const preferencesString = savedPreferences.substring(
    COOKIE_CONSENT_COOKIE_NAME.length + 1
  ); // get the value of the cookie
  return preferencesString.split("&").reduce((acc, curr) => {
    const [key, value] = curr.split("=");
    acc[key as NonEssentialCookieNameType] = value === "true";
    return acc;
  }, {} as CookiePreferences);
};

interface CookieConsentProviderProps {
  children?: React.ReactNode;
  robloxSiteDomain: string;
  initialCookiePolicy?: CookiePolicy; // For testing purposes
  initialPreferences?: CookiePreferences; // For testing purposes
  forceShowBanner?: boolean; // For testing purposes
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({
  children,
  robloxSiteDomain,
  initialCookiePolicy,
  initialPreferences,
  forceShowBanner = false,
}) => {
  const [cookiePolicy, setCookiePolicy] = useState<CookiePolicy | null>(
    initialCookiePolicy || null
  );
  const [preferences, setPreferences] = useState<CookiePreferences>(
    initialPreferences || loadPreferencesFromCookie()
  );
  const [isLoading, setIsLoading] = useState(!initialCookiePolicy);
  const [error, setError] = useState<Error | null>(null);

  const shouldShowBanner = useMemo(() => {
    if (forceShowBanner) return true;
    if (!cookiePolicy?.ShouldDisplayCookieBannerV3) return false;
    return !hasExistingCookie();
  }, [cookiePolicy?.ShouldDisplayCookieBannerV3, forceShowBanner]);

  useEffect(() => {
    if (initialCookiePolicy) return;

    const fetchCookiePolicy = async () => {
      try {
        const response = await fetch(
          `https://apis.${robloxSiteDomain}${COOKIE_CONSENT_API_ENDPOINT}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch cookie policy");
        }
        const data: CookiePolicyResponse = await response.json();
        setCookiePolicy({
          ShouldDisplayCookieBannerV3:
            data.ShouldDisplayCookieBannerV3 ?? false,
          NonEssentialCookieList: data.NonEssentialCookieList ?? [],
          EssentialCookieList: data.EssentialCookieList ?? [],
        });
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };

    fetchCookiePolicy();
  }, [robloxSiteDomain, initialCookiePolicy]);

  const updatePreference = useCallback((cookieName: string, value: boolean) => {
    setPreferences((prev) => {
      const newPreferences = {
        ...prev,
        [cookieName as NonEssentialCookieNameType]: value,
      };
      savePreferencesToCookie(newPreferences);
      return newPreferences;
    });
  }, []);

  const acceptAll = useCallback(() => {
    if (!cookiePolicy) return;
    const allAccepted =
      cookiePolicy.NonEssentialCookieList.reduce<CookiePreferences>(
        (acc, cookie) => ({
          ...acc,
          [cookie]: true,
        }),
        COOKIE_CONSENT_DEFAULT_PREFERENCES
      );
    savePreferencesToCookie(allAccepted);
    setPreferences(allAccepted);
  }, [cookiePolicy]);

  const declineAll = useCallback(() => {
    if (!cookiePolicy) return;
    const allDeclined =
      cookiePolicy.NonEssentialCookieList.reduce<CookiePreferences>(
        (acc, cookie) => ({
          ...acc,
          [cookie]: false,
        }),
        COOKIE_CONSENT_DEFAULT_PREFERENCES
      );
    savePreferencesToCookie(allDeclined);
    setPreferences(allDeclined);
  }, [cookiePolicy]);

  const hasAcceptedAnalyticsCookie = useMemo(() => {
    return Object.values(preferences).some((value) => value === true);
  }, [preferences]);

  const contextValue = useMemo(
    () => ({
      cookiePolicy,
      preferences,
      updatePreference,
      acceptAll,
      declineAll,
      isLoading,
      error,
      hasAcceptedAnalyticsCookie,
      shouldShowBanner,
    }),
    [
      cookiePolicy,
      preferences,
      isLoading,
      error,
      acceptAll,
      declineAll,
      updatePreference,
      hasAcceptedAnalyticsCookie,
      shouldShowBanner,
    ]
  );

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
    </CookieConsentContext.Provider>
  );
};
