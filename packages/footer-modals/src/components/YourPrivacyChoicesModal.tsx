import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@rbx/foundation-ui";
import { useCookieConsentContext } from "@rbx/cookie-banner";
import { GpcComplianceTracker } from "../services/gpcComplianceService";
import * as constants from "../constants/YourPrivacyChoicesModalConstants";
import { getAdsPreferencesUrl } from "../constants/urlConstants";
import {
  useYourPrivacyChoicesModalData,
  type ModalData,
} from "../hooks/useYourPrivacyChoicesModalData";

const EligibleAdsPreferencesLink = ({
  adsPreferencesUrl,
  children,
}: {
  adsPreferencesUrl: string;
  children: React.ReactNode;
}) => (
  <a
    href={adsPreferencesUrl}
    onClick={(e) => {
      if (
        typeof window !== "undefined" &&
        window.location.pathname.includes("/my/account")
      ) {
        e.preventDefault();
        window.location.href = adsPreferencesUrl;
        window.location.reload();
      }
    }}
    className="text-link"
  >
    {children}
  </a>
);

const IneligibleLearnMoreLink = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <a
    href="https://en.help.roblox.com/hc/articles/28943243301780"
    target="_blank"
    rel="noreferrer"
    className="text-link"
  >
    {children}
  </a>
);

export interface YourPrivacyChoicesModalProps {
  showModal: boolean;
  onModalClose: () => void;
  translate: (key: string, parameters?: Record<string, unknown>) => string;
  translateHTML: (
    key: string,
    tags?: Array<{
      opening: string;
      closing: string;
      content: (chunks: React.ReactNode) => React.ReactNode;
    }> | null,
    args?: { [key: string]: string | React.ReactNode }
  ) => React.ReactNode;
  intl: { getRobloxLocale: () => string };
  userSettingsApiBaseUrl: string;
  apiGatewayBaseUrl: string;
  shouldCallEvidon?: boolean;
  isAuthenticated?: () => boolean;
  LoadingComponent?: React.ComponentType;
}

const YourPrivacyChoicesModal = ({
  showModal,
  onModalClose,
  translate,
  translateHTML,
  intl,
  userSettingsApiBaseUrl,
  apiGatewayBaseUrl,
  shouldCallEvidon = false,
  isAuthenticated,
  LoadingComponent,
}: YourPrivacyChoicesModalProps): React.ReactElement => {
  const { preferences: cookiePreferences } = useCookieConsentContext();
  const gpcTrackerRef = useRef<GpcComplianceTracker | null>(null);

  // Initialize GPC tracker once on mount - empty deps array ensures this only runs once
  // We intentionally don't include cookiePreferences or shouldCallEvidon in deps to avoid re-initializing
  useEffect(() => {
    if (!gpcTrackerRef.current) {
      const initialPreferences = { ...cookiePreferences };
      gpcTrackerRef.current = new GpcComplianceTracker(initialPreferences);

      if (shouldCallEvidon) {
        gpcTrackerRef.current.initializeEvidon(shouldCallEvidon);
      }
    }

    return () => {
      if (gpcTrackerRef.current) {
        gpcTrackerRef.current.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gpcTrackerRef.current) {
      gpcTrackerRef.current.updateCookiePreferences(cookiePreferences);
    }
  }, [cookiePreferences]);

  const { data, isLoading, isError } = useYourPrivacyChoicesModalData({
    showModal,
    gpcTrackerRef,
    userSettingsApiBaseUrl,
    apiGatewayBaseUrl,
    isAuthenticated,
  }) as { data: ModalData | undefined; isLoading: boolean; isError: boolean };

  const adsPreferencesUrl = useMemo(
    () => getAdsPreferencesUrl(intl.getRobloxLocale()),
    [intl]
  );

  const eligibleAdsPreferencesLinkContent = useCallback(
    (chunks: React.ReactNode) => (
      <EligibleAdsPreferencesLink adsPreferencesUrl={adsPreferencesUrl}>
        {chunks}
      </EligibleAdsPreferencesLink>
    ),
    [adsPreferencesUrl]
  );

  const getEligibleTranslateHTMLConfig = useMemo(
    () => ({
      tags: [
        {
          opening: "aTagWithHref",
          closing: "aTagEnd",
          content: eligibleAdsPreferencesLinkContent,
        },
      ],
      args: {
        lineBreak: <br />,
        link: adsPreferencesUrl,
      },
    }),
    [adsPreferencesUrl, eligibleAdsPreferencesLinkContent]
  );

  const ineligibleLearnMoreLinkContent = useCallback(
    (chunks: React.ReactNode) => (
      <IneligibleLearnMoreLink>{chunks}</IneligibleLearnMoreLink>
    ),
    []
  );

  const getIneligibleTranslateHTMLConfig = useMemo(
    () => ({
      tags: [
        {
          opening: "aTagStart",
          closing: "aTagEnd",
          content: ineligibleLearnMoreLinkContent,
        },
      ],
      args: {
        lineBreak: <br />,
      },
    }),
    [ineligibleLearnMoreLinkContent]
  );

  const getModalTitle = (): React.ReactElement =>
    isLoading ? (
      <DialogTitle hidden className="text-heading-small">
        {translate(constants.descriptionLoading)}
      </DialogTitle>
    ) : (
      <DialogTitle className="text-heading-small">
        {isError
          ? translate(constants.titleErrorTranslationKey)
          : (() => {
              if (data?.scenario === "no-signal") {
                return translate(constants.titleNoGpcDetectedTranslationKey);
              }
              return translate(constants.titleGpcDetectedTranslationKey);
            })()}
      </DialogTitle>
    );

  const getModalDescription = (): React.ReactElement => {
    if (isLoading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <div className="text-body-medium">
          {translate(constants.descriptionLoading)}
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className="text-body-medium">
          {translateHTML(constants.bodyErrorTranslationKey)}
        </div>
      );
    }

    const { scenario, isAdsSellShareDataEnabled, canUserManageAdsSettings } =
      data;
    const authenticated = isAuthenticated?.() ?? false;

    if (!authenticated) {
      const config = getIneligibleTranslateHTMLConfig;
      if (scenario === "no-signal") {
        return (
          <div className="text-body-medium">
            {translateHTML(
              constants.bodyGpcMissingSettingIneligible,
              config.tags,
              config.args
            )}
          </div>
        );
      }
      return (
        <div className="text-body-medium">
          {translateHTML(
            constants.bodyGpcDetectedSettingDisabledIneligible,
            config.tags,
            config.args
          )}
        </div>
      );
    }

    const config =
      authenticated && canUserManageAdsSettings
        ? getEligibleTranslateHTMLConfig
        : getIneligibleTranslateHTMLConfig;

    if (scenario === "no-signal") {
      const translationKey =
        authenticated && canUserManageAdsSettings
          ? constants.bodyGpcMissingSettingEligible
          : constants.bodyGpcMissingSettingIneligible;
      return (
        <div className="text-body-medium">
          {translateHTML(translationKey, config.tags, config.args)}
        </div>
      );
    }

    if (scenario === "signal-honored") {
      if (isAdsSellShareDataEnabled) {
        const translationKey =
          authenticated && canUserManageAdsSettings
            ? constants.bodyGpcDetectedSettingEnabledEligible
            : constants.bodyGpcDetectedSettingEnabledIneligible;
        return (
          <div className="text-body-medium">
            {translateHTML(translationKey, config.tags, config.args)}
          </div>
        );
      }
      const translationKey =
        authenticated && canUserManageAdsSettings
          ? constants.bodyGpcDetectedSettingDisabledEligible
          : constants.bodyGpcDetectedSettingDisabledIneligible;
      return (
        <div className="text-body-medium">
          {translateHTML(translationKey, config.tags, config.args)}
        </div>
      );
    }

    if (isAdsSellShareDataEnabled) {
      const translationKey =
        authenticated && canUserManageAdsSettings
          ? constants.bodyGpcDetectedSettingEnabledEligible
          : constants.bodyGpcDetectedSettingEnabledIneligible;
      return (
        <div className="text-body-medium">
          {translateHTML(translationKey, config.tags, config.args)}
        </div>
      );
    }

    const translationKey =
      authenticated && canUserManageAdsSettings
        ? constants.bodyGpcDetectedSettingDisabledEligible
        : constants.bodyGpcDetectedSettingDisabledIneligible;
    return (
      <div className="text-body-medium">
        {translateHTML(translationKey, config.tags, config.args)}
      </div>
    );
  };

  const getModalContent = (): React.ReactElement => (
    <React.Fragment>
      <DialogBody>
        {getModalTitle()}
        {getModalDescription()}
      </DialogBody>
      {!isLoading && (
        <DialogFooter className="width-full">
          <Button
            className="width-full"
            size="Large"
            variant="Emphasis"
            onClick={onModalClose}
          >
            {translate(constants.actionOk)}
          </Button>
        </DialogFooter>
      )}
    </React.Fragment>
  );

  return (
    <Dialog
      open={showModal}
      onOpenChange={onModalClose}
      size="Small"
      isModal
      hasCloseAffordance
      closeLabel={constants.actionClose}
    >
      <DialogContent>{getModalContent()}</DialogContent>
    </Dialog>
  );
};

export default YourPrivacyChoicesModal;
