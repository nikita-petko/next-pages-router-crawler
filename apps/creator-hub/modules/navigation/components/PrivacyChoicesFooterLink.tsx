import React, {
  FunctionComponent,
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  Fragment,
} from 'react';
import { useTranslation, useLocalization, toRobloxLocale } from '@rbx/intl';
import { Link, Typography, Grid, makeStyles } from '@rbx/ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  DialogFooter,
} from '@rbx/foundation-ui';
import {
  GpcComplianceTracker,
  getAdsPreferencesUrl,
  useYourPrivacyChoicesModalData,
} from '@rbx/footer-modals';

import { useCookieConsentContext } from '@rbx/cookie-banner';
import { useAuthentication } from '@modules/authentication/providers';
import usePrivacyChoicesFooterLinkStyles from './PrivacyChoicesFooterLink.styles';

// Translation keys for creator-hub (namespace is automatically prepended)
const titleGpcDetectedTranslationKey = 'Title.GpcDetected';
const titleNoGpcDetectedTranslationKey = 'Title.NoGpcDetected';
const bodyGpcDetectedSettingDisabledIneligible = 'Body.GpcDetectedSettingDisabledIneligible';
const bodyGpcDetectedSettingDisabledEligible = 'Body.GpcDetectedSettingDisabledEligible';
const bodyGpcDetectedSettingEnabledIneligible = 'Body.GpcDetectedSettingEnabledIneligible';
const bodyGpcDetectedSettingEnabledEligible = 'Body.GpcDetectedSettingEnabledEligible';
const bodyGpcMissingSettingIneligible = 'Body.GpcMissingSettingIneligible';
const bodyGpcMissingSettingEligible = 'Body.GpcMissingSettingEligible';
const actionOk = 'Action.Ok';
const actionClose = 'Action.Close';
const linkYourPrivacyChoices = 'Label.YourPrivacyChoices';
const descriptionLoading = 'Description.Loading';

const useModalStyles = makeStyles()(() => ({
  modalLink: {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
    '&:focus': {
      textDecoration: 'underline',
    },
  },
  inlineLink: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  inlineIcon: {
    marginLeft: '8px',
    height: '16px',
    width: 'auto',
    verticalAlign: 'middle',
  },
}));

type GpcState = {
  isGpcDetected: boolean;
  initialGpcState: boolean;
  hasUserMadeCookieChanges: boolean;
  scenario: 'no-signal' | 'signal-honored' | 'signal-with-changes';
};

type PrivacyChoicesModalContentProps = {
  gpcState: GpcState;
  modalData?: {
    isAdsSellShareDataEnabled: boolean;
    canUserManageAdsSettings: boolean;
  };
  translate: (key: string, args?: { [key: string]: string }) => string;
  translateHTML: (
    key: string,
    tags?: Array<{
      opening: string;
      closing: string;
      content: (chunks: React.ReactNode) => React.ReactNode;
    }> | null,
    args?: { [key: string]: string | React.ReactNode },
  ) => React.ReactNode;
  handleClose: () => void;
  privacyPreferencesUrl: string;
  modalLinkClass: string;
};

const PrivacyChoicesModalContent: FunctionComponent<PrivacyChoicesModalContentProps> = ({
  gpcState,
  modalData,
  translate,
  translateHTML,
  handleClose,
  privacyPreferencesUrl,
  modalLinkClass,
}) => {
  const { user } = useAuthentication();
  const authenticated = !!user;
  const isAdsSellShareDataEnabled = modalData?.isAdsSellShareDataEnabled ?? false;
  const canUserManageAdsSettings = modalData?.canUserManageAdsSettings ?? false;

  const getModalTitle = (): string => {
    if (!gpcState.isGpcDetected) {
      return translate(titleNoGpcDetectedTranslationKey) || '';
    }
    return translate(titleGpcDetectedTranslationKey) || '';
  };

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (typeof window !== 'undefined' && window.location.pathname.includes('/my/account')) {
        e.preventDefault();
        window.location.href = privacyPreferencesUrl;
      }
    },
    [privacyPreferencesUrl],
  );

  const learnMoreLinkComponent = useCallback(
    (chunks: React.ReactNode) => (
      <Link
        href='https://en.help.roblox.com/hc/articles/28943243301780'
        target='_blank'
        rel='noreferrer'
        className={modalLinkClass}>
        {chunks}
      </Link>
    ),
    [modalLinkClass],
  );

  const adsPreferencesLinkComponent = useCallback(
    (chunks: React.ReactNode) => (
      <Link href={privacyPreferencesUrl} className={modalLinkClass} onClick={handleLinkClick}>
        {chunks}
      </Link>
    ),
    [privacyPreferencesUrl, modalLinkClass, handleLinkClick],
  );

  const lineBreakElement = useMemo(() => <br />, []);

  // Helper function to manually process translations with problematic {link} and {hrefEnd} tokens
  const processTranslationWithLink = useCallback(
    (
      translationKey: string,
      linkComponent: (chunks: React.ReactNode) => React.ReactNode,
    ): React.ReactNode => {
      // First, get the translation WITHOUT lineBreak replacement to process it manually
      // We need to handle lineBreak separately because it's a React element
      const rawTranslation =
        translate(translationKey, {
          link: '',
          hrefEnd: '',
        }) || '';

      // Remove any remaining {link} and {hrefEnd} tokens that weren't replaced
      const cleanedTranslation = rawTranslation.replace(/{link}/g, '').replace(/{hrefEnd}/g, '');

      // Split by the link tags
      const parts = cleanedTranslation.split(/{aTagWithHref}|{aTagEnd}/);

      // Helper to process line breaks in text
      const processLineBreaks = (text: string): React.ReactNode => {
        const lineBreakParts = text.split(/{lineBreak}/);
        if (lineBreakParts.length === 1) {
          return text;
        }
        return (
          <Fragment>
            {lineBreakParts.map((part, index) => {
              const key = `linebreak-${index}-${part.substring(0, 10)}`;
              return (
                <Fragment key={key}>
                  {part}
                  {index < lineBreakParts.length - 1 && lineBreakElement}
                </Fragment>
              );
            })}
          </Fragment>
        );
      };

      if (parts.length === 3) {
        // We have: [text before link, link text, text after link]
        return (
          <Fragment>
            {processLineBreaks(parts[0])}
            {linkComponent(parts[1])}
            {processLineBreaks(parts[2])}
          </Fragment>
        );
      }

      // If format doesn't match expected pattern, return the cleaned translation with line breaks processed
      return processLineBreaks(cleanedTranslation);
    },
    [translate, lineBreakElement],
  );

  const getModalDescription = (): React.ReactNode => {
    if (!authenticated) {
      const translationConfig = {
        tags: [
          {
            opening: 'aTagStart',
            closing: 'aTagEnd',
            content: learnMoreLinkComponent,
          },
        ],
        args: {
          lineBreak: lineBreakElement,
        },
      };

      if (!gpcState.isGpcDetected) {
        return translateHTML(
          bodyGpcMissingSettingIneligible,
          translationConfig.tags,
          translationConfig.args,
        );
      }

      if (isAdsSellShareDataEnabled) {
        return translateHTML(
          bodyGpcDetectedSettingEnabledIneligible,
          translationConfig.tags,
          translationConfig.args,
        );
      }

      return translateHTML(
        bodyGpcDetectedSettingDisabledIneligible,
        translationConfig.tags,
        translationConfig.args,
      );
    }

    if (!gpcState.isGpcDetected) {
      if (canUserManageAdsSettings) {
        return processTranslationWithLink(
          bodyGpcMissingSettingEligible,
          adsPreferencesLinkComponent,
        );
      }

      return translateHTML(
        bodyGpcMissingSettingIneligible,
        [
          {
            opening: 'aTagStart',
            closing: 'aTagEnd',
            content: learnMoreLinkComponent,
          },
        ],
        {
          lineBreak: lineBreakElement,
        },
      );
    }

    if (isAdsSellShareDataEnabled) {
      if (canUserManageAdsSettings) {
        return processTranslationWithLink(
          bodyGpcDetectedSettingEnabledEligible,
          adsPreferencesLinkComponent,
        );
      }

      return translateHTML(
        bodyGpcDetectedSettingEnabledIneligible,
        [
          {
            opening: 'aTagStart',
            closing: 'aTagEnd',
            content: learnMoreLinkComponent,
          },
        ],
        {
          lineBreak: lineBreakElement,
        },
      );
    }

    const translationConfig = canUserManageAdsSettings
      ? {
          tags: [
            {
              opening: 'aTagWithHref',
              closing: 'aTagEnd',
              content: adsPreferencesLinkComponent,
            },
          ],
          args: {
            lineBreak: lineBreakElement,
          },
        }
      : {
          tags: [
            {
              opening: 'aTagStart',
              closing: 'aTagEnd',
              content: learnMoreLinkComponent,
            },
          ],
          args: {
            lineBreak: lineBreakElement,
          },
        };

    // Check if scenario is signal-with-changes (user made cookie changes after GPC detected)
    if (gpcState.scenario === 'signal-with-changes') {
      if (canUserManageAdsSettings) {
        return processTranslationWithLink(
          bodyGpcDetectedSettingDisabledEligible,
          adsPreferencesLinkComponent,
        );
      }
      return translateHTML(
        bodyGpcDetectedSettingDisabledIneligible,
        translationConfig.tags,
        translationConfig.args,
      );
    }

    const translationKey = canUserManageAdsSettings
      ? bodyGpcDetectedSettingDisabledEligible
      : bodyGpcDetectedSettingDisabledIneligible;

    if (canUserManageAdsSettings) {
      return processTranslationWithLink(translationKey, adsPreferencesLinkComponent);
    }

    return translateHTML(translationKey, translationConfig.tags, translationConfig.args);
  };

  return (
    <React.Fragment>
      <DialogBody>
        <DialogTitle className='text-heading-small'>{getModalTitle()}</DialogTitle>
        <div className='text-body-medium'>{getModalDescription()}</div>
      </DialogBody>
      <DialogFooter className='width-full'>
        <Button className='width-full' size='Large' variant='Emphasis' onClick={handleClose}>
          {translate(actionOk) || ''}
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
};

const PrivacyChoicesFooterLinkContent: FunctionComponent<{ inline?: boolean }> = ({
  inline = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const localization = useLocalization();
  const cookieContext = useCookieConsentContext();
  const cookiePreferences = cookieContext.preferences;
  const gpcTrackerRef = useRef<InstanceType<typeof GpcComplianceTracker> | null>(null);
  const hasInitializedRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const {
    classes: { container },
  } = usePrivacyChoicesFooterLinkStyles();
  const { classes: modalClasses } = useModalStyles();

  // Helper to load preferences directly from cookie (in case context doesn't update)
  const loadPreferencesFromCookie = useCallback((): Record<string, boolean> => {
    if (typeof document === 'undefined') return {};
    const savedPreferences = document.cookie.split('; ').find((row) => row.startsWith('RBXcb='));

    if (!savedPreferences) return {};

    const preferencesString = savedPreferences.substring('RBXcb='.length);
    // Try decoding in case it's URL-encoded
    let decoded = preferencesString;
    try {
      decoded = decodeURIComponent(preferencesString);
    } catch {
      // If decode fails, use original
    }

    const preferences: Record<string, boolean> = {};
    decoded.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        preferences[key] = value === 'true';
      }
    });
    return preferences;
  }, []);

  const [gpcState, setGpcState] = useState<GpcState>({
    isGpcDetected: false,
    initialGpcState: false,
    hasUserMadeCookieChanges: false,
    scenario: 'no-signal',
  });

  useEffect(() => {
    return () => {
      if (gpcTrackerRef.current) {
        gpcTrackerRef.current.cleanup();
      }
    };
  }, []);

  // Initialize tracker when modal first opens (captures initial state at that moment)
  useEffect(() => {
    if (showModal && !hasInitializedRef.current) {
      // Capture initial preferences from cookie when modal first opens
      const initialPrefs = loadPreferencesFromCookie();
      const effectiveInitialPrefs =
        Object.keys(initialPrefs).length > 0 ? initialPrefs : cookiePreferences;
      gpcTrackerRef.current = new GpcComplianceTracker(effectiveInitialPrefs);
      hasInitializedRef.current = true;

      const initialState = gpcTrackerRef.current.getGpcState();
      setGpcState(initialState);
    }
  }, [showModal, cookiePreferences, loadPreferencesFromCookie]);

  useEffect(() => {
    if (gpcTrackerRef.current) {
      // Use cookiePreferences from context, but also check cookie directly as fallback
      const cookiePrefs = loadPreferencesFromCookie();
      const effectivePreferences =
        Object.keys(cookiePrefs).length > 0 ? cookiePrefs : cookiePreferences;

      gpcTrackerRef.current.updateCookiePreferences(effectivePreferences);
      const newState = gpcTrackerRef.current.getGpcState();
      setGpcState((prevState) => {
        if (
          prevState.scenario !== newState.scenario ||
          prevState.isGpcDetected !== newState.isGpcDetected ||
          prevState.hasUserMadeCookieChanges !== newState.hasUserMadeCookieChanges
        ) {
          return newState;
        }
        return prevState;
      });
    }
  }, [cookiePreferences, loadPreferencesFromCookie]);

  useEffect(() => {
    if (!gpcTrackerRef.current) {
      return undefined;
    }

    const POLL_INTERVAL_MS = 2000;
    const intervalId = setInterval(() => {
      if (gpcTrackerRef.current) {
        // Poll for both GPC signal changes and cookie preference changes
        const cookiePrefs = loadPreferencesFromCookie();
        const effectivePreferences =
          Object.keys(cookiePrefs).length > 0 ? cookiePrefs : cookiePreferences;
        gpcTrackerRef.current.updateCookiePreferences(effectivePreferences);

        const newState = gpcTrackerRef.current.getGpcState();
        setGpcState((prevState) => {
          if (
            prevState.scenario !== newState.scenario ||
            prevState.isGpcDetected !== newState.isGpcDetected ||
            prevState.hasUserMadeCookieChanges !== newState.hasUserMadeCookieChanges
          ) {
            return newState;
          }
          return prevState;
        });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [cookiePreferences, loadPreferencesFromCookie]);

  const { user } = useAuthentication();
  const authenticated = !!user;

  const userSettingsApiBaseUrl = useMemo(() => {
    const bedev2BaseUrl = process.env.bedev2BaseUrl ?? 'https://apis.sitetest3.robloxlabs.com';
    return `${bedev2BaseUrl}/user-settings-api`;
  }, []);

  const apiGatewayBaseUrl = useMemo(() => {
    return process.env.bedev2BaseUrl ?? 'https://apis.sitetest3.robloxlabs.com';
  }, []);

  const { data: modalData, isLoading: isModalDataLoading } = useYourPrivacyChoicesModalData({
    showModal,
    gpcTrackerRef,
    userSettingsApiBaseUrl,
    apiGatewayBaseUrl,
    isAuthenticated: () => authenticated,
  });

  const robloxLocale = useMemo(() => {
    if (localization.locale) {
      return toRobloxLocale(localization.locale);
    }
    return 'en_us';
  }, [localization.locale]);

  const privacyPreferencesUrl = useMemo(() => {
    const relativePath = getAdsPreferencesUrl(robloxLocale);
    return `https://www.roblox.com${relativePath}`;
  }, [robloxLocale]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const linkText = translate(linkYourPrivacyChoices) || '';
  const privacyIconPath = `${process.env.assetPathPrefix}/navigation/privacy_icon.png`;

  const linkElement = (
    <button
      type='button'
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
      }}>
      <Typography variant='footer' color='secondary' component='span'>
        {linkText}
        <img
          src={privacyIconPath}
          alt=''
          style={{ marginLeft: '8px', height: '16px', width: 'auto', verticalAlign: 'middle' }}
        />
      </Typography>
    </button>
  );

  return (
    <React.Fragment>
      {inline ? (
        linkElement
      ) : (
        <Grid classes={{ root: container }} container justifyContent='center' item>
          {linkElement}
        </Grid>
      )}
      <Dialog
        open={showModal}
        onOpenChange={handleClose}
        size='Small'
        isModal
        hasCloseAffordance
        closeLabel={translate(actionClose)}>
        <DialogContent>
          {isModalDataLoading ? (
            <DialogBody>
              <DialogTitle className='text-heading-small'>
                {translate(titleGpcDetectedTranslationKey) || ''}
              </DialogTitle>
              <div className='text-body-medium'>{translate(descriptionLoading) || ''}</div>
            </DialogBody>
          ) : (
            <PrivacyChoicesModalContent
              gpcState={gpcState}
              modalData={modalData}
              translate={translate}
              translateHTML={translateHTML}
              handleClose={handleClose}
              privacyPreferencesUrl={privacyPreferencesUrl}
              modalLinkClass={modalClasses.modalLink}
            />
          )}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

const PrivacyChoicesFooterLink: FunctionComponent<{ inline?: boolean }> = ({ inline = false }) => {
  try {
    return <PrivacyChoicesFooterLinkContent inline={inline} />;
  } catch (error) {
    // eslint-disable-next-line no-console -- Error logging for component rendering failures
    console.error('Error rendering PrivacyChoicesFooterLink:', error);
    return null;
  }
};

export default PrivacyChoicesFooterLink;
