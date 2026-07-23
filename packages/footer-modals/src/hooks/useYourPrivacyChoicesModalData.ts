import { useQuery } from "@tanstack/react-query";
import { GpcComplianceTracker } from "../services/gpcComplianceService";
import { setGlobalPrivacyControlAsync, getUserSettingsAsync } from "../services/userSettingsApi";
import { featureCheckAsync } from "../services/accessManagementService";

export type ModalData = {
  isGpcDetected: boolean;
  canUserManageAdsSettings: boolean;
  isAdsSellShareDataEnabled: boolean;
  scenario: "no-signal" | "signal-honored" | "signal-with-changes";
};

export type UseYourPrivacyChoicesModalDataOptions = {
  showModal: boolean;
  gpcTrackerRef: React.MutableRefObject<GpcComplianceTracker | null>;
  userSettingsApiBaseUrl: string;
  apiGatewayBaseUrl: string;
  isAuthenticated?: () => boolean;
};

export const useYourPrivacyChoicesModalData = ({
  showModal,
  gpcTrackerRef,
  userSettingsApiBaseUrl,
  apiGatewayBaseUrl,
  isAuthenticated,
}: UseYourPrivacyChoicesModalDataOptions) => {
  return useQuery<ModalData>({
    queryKey: ["yourPrivacyChoicesModal", showModal],
    queryFn: async (): Promise<ModalData> => {
      const authenticated = isAuthenticated?.() ?? false;

      const gpcState = gpcTrackerRef.current?.getGpcState() ?? {
        isGpcDetected: false,
        initialGpcState: false,
        hasUserMadeCookieChanges: false,
        scenario: "no-signal" as const,
      };

      const { isGpcDetected } = gpcState;

      if (authenticated && isGpcDetected) {
        await setGlobalPrivacyControlAsync(userSettingsApiBaseUrl);
      }

      let canUserManageAdsSettings = false;
      if (authenticated) {
        try {
          const featureCheckResponse = await featureCheckAsync(
            apiGatewayBaseUrl,
            "ShouldShowAdsSettings",
            "account_management/UserSettingsPolicy"
          );
          const { access } = featureCheckResponse;
          canUserManageAdsSettings = access === "Granted";
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to check feature access:", error);
        }
      }

      let isAdsSellShareDataEnabled = false;
      if (authenticated) {
        try {
          const settingsResponse = await getUserSettingsAsync<{ allowSellShareData?: string }>(
            userSettingsApiBaseUrl
          );
          isAdsSellShareDataEnabled = settingsResponse.allowSellShareData === "Enabled";
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to get user settings:", error);
        }
      } else if (typeof document !== 'undefined') {
        const cookie = document.cookie.split('; ').find(row => row.trim().startsWith('RBXcb='));
        if (cookie) {
          const cookieValue = cookie.substring('RBXcb='.length);
          let decoded = cookieValue;
          try {
            decoded = decodeURIComponent(cookieValue);
          } catch {
            // If decode fails, use original
          }
          const preferences = decoded.split('&');
          const hasGoogleAnalytics = preferences.some(pair => {
            const [key, value] = pair.split('=');
            return key === 'GoogleAnalytics' && value === 'true';
          });
          const hasRBXSource = preferences.some(pair => {
            const [key, value] = pair.split('=');
            return key === 'RBXSource' && value === 'true';
          });
          if (hasGoogleAnalytics || hasRBXSource) {
            isAdsSellShareDataEnabled = true;
          }
        }
      }

      return {
        isGpcDetected,
        canUserManageAdsSettings,
        isAdsSellShareDataEnabled,
        scenario: gpcState.scenario,
      };
    },
    enabled: showModal,
    gcTime: 0,
  });
};

