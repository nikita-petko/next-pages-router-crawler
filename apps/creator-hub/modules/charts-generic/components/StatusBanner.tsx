import { useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, makeStyles, Button, Link, IconButton, CloseIcon } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { useAuthentication } from '@modules/authentication/providers';
import Flex from '@modules/miscellaneous/components/Flex';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useImpressionObserver from '../charts/hooks/useImpressionObserver';

const useStyles = makeStyles()(() => ({
  bannerContainer: {
    display: 'flex',
    width: '100%',
    marginBottom: 20,
  },
}));

export enum BannerSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export enum BannerCategory {
  ExperienceStatus = 'ExperienceStatus',
  Geogating = 'Geogating',
  DataIssue = 'DataIssue',
}

export type BannerConfigurationWithoutKey = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  severity: BannerSeverity;
  category?: BannerCategory;

  /**
   * If provided, a primary action will be displayed.
   */
  primaryActionConfig?: {
    text: TranslationKey;
    link: string;
  };

  /**
   * If provided, logs impression and click events with this key.
   */
  logKey?: string;

  /**
   * If provided, the banner can be dismissed by the user.
   * The key is used to store the dismissal state in local storage.
   */
  dismissalKey?: string;
};

export type BannerConfigurationWithoutKeyAndCategory = Omit<
  BannerConfigurationWithoutKey,
  'category'
>;

export type BannerConfiguration<T extends string> = { key: T } & BannerConfigurationWithoutKey;

export const SingleStatusBanner = <T extends string>({
  bannerConfig,
  bannerClassNameOverride,
  universeId,
}: {
  bannerConfig: BannerConfiguration<T>;
  bannerClassNameOverride?: string;
  universeId?: number;
}) => {
  const {
    classes: { bannerContainer },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const { user } = useAuthentication();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const cardRef = useRef<HTMLDivElement>(null);

  const { titleKey, descriptionKey, severity, primaryActionConfig, dismissalKey, logKey } =
    bannerConfig;

  const [hasUserDismissed, setHasUserDismissed] = useLocalStorage(
    dismissalKey ? `${dismissalKey}-${user?.id}` : `statusBanner-${bannerConfig.key}-${user?.id}`,
    false,
  );

  const handleDismiss = useCallback(() => {
    setHasUserDismissed(true);
    if (logKey && universeId) {
      unifiedLogger.logClickEvent({
        eventName: 'analytics/banner/statusBannerDismiss',
        parameters: { name: logKey, universe_id: `${universeId}` },
      });
    }
  }, [setHasUserDismissed, logKey, unifiedLogger, universeId]);

  const primaryAction = useMemo(() => {
    if (!primaryActionConfig) {
      return null;
    }

    return (
      <Link
        href={primaryActionConfig.link}
        underline='none'
        color='inherit'
        onClick={() => {
          if (logKey && universeId) {
            unifiedLogger.logClickEvent({
              eventName: 'analytics/banner/statusBannerPrimaryActionClick',
              parameters: { name: logKey, universe_id: `${universeId}` },
            });
          }
        }}>
        <Button size='small' color='inherit'>
          {translate(primaryActionConfig.text)}
        </Button>
      </Link>
    );
  }, [primaryActionConfig, logKey, unifiedLogger, universeId, translate]);

  const dismissAction = useMemo(
    () =>
      dismissalKey ? (
        <IconButton aria-label='dismiss' color='inherit' onClick={handleDismiss} size='small'>
          <CloseIcon color='inherit' fontSize='small' />
        </IconButton>
      ) : null,
    [handleDismiss, dismissalKey],
  );

  const actionsBar = useMemo(() => {
    const actions = [];

    if (primaryAction) {
      actions.push(primaryAction);
    }

    if (dismissalKey) {
      actions.push(dismissAction);
    }

    if (actions.length === 0) {
      return undefined;
    }

    return (
      <Flex alignItems='center' gap={8}>
        {actions}
      </Flex>
    );
  }, [primaryAction, dismissAction, dismissalKey]);

  const sendImpressionEvent = useCallback(() => {
    if (!logKey || !universeId) {
      return;
    }
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/statusBannerImpression',
      parameters: { name: logKey, universe_id: `${universeId}` },
    });
  }, [unifiedLogger, logKey, universeId]);

  useImpressionObserver(cardRef, sendImpressionEvent);

  if (hasUserDismissed) {
    return null;
  }

  return (
    <Alert
      severity={severity}
      variant='filled'
      className={bannerClassNameOverride ?? bannerContainer}
      action={actionsBar}
      ref={cardRef}>
      <AlertTitle>{translate(titleKey)}</AlertTitle>
      {translate(descriptionKey)}
    </Alert>
  );
};

export const StatusBanners = <T extends string>({
  bannerConfigs,
  bannerClassNameOverride,
  universeId,
}: {
  bannerConfigs: BannerConfiguration<T>[];
  bannerClassNameOverride?: string;
  universeId?: number;
}) => {
  return bannerConfigs.map((bannerConfig) => (
    <SingleStatusBanner
      key={bannerConfig.key}
      bannerConfig={bannerConfig}
      bannerClassNameOverride={bannerClassNameOverride}
      universeId={universeId}
    />
  ));
};
