import type { ReactNode } from 'react';
import React, { useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, AlertTitle, Typography, Button, Link, IconButton, CloseIcon } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import { useAuthentication } from '@modules/authentication/providers';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import Flex from '@modules/miscellaneous/components/Flex';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

interface GenericAnalyticsBreakglassBannerProps {
  titleText: FormattedText;
  contentText: FormattedText | ReactNode;
  severity?: 'error' | 'warning' | 'info' | 'success';
  primaryActionConfig?: {
    text: FormattedText;
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
}

const GenericAnalyticsBreakglassBanner: React.FC<GenericAnalyticsBreakglassBannerProps> = ({
  titleText,
  contentText,
  severity = 'warning',
  primaryActionConfig,
  dismissalKey,
  logKey,
}) => {
  const { user } = useAuthentication();
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const cardRef = useRef<HTMLDivElement>(null);

  const [hasUserDismissed, setHasUserDismissed] = useLocalStorage(
    dismissalKey ? `${dismissalKey}-${user?.id}` : `genericAnalyticsBanner-${user?.id}`,
    false,
  );

  const handleDismiss = useCallback(() => {
    setHasUserDismissed(true);
    if (logKey) {
      unifiedLogger.logClickEvent({
        eventName: 'analytics/banner/breakglassDismiss',
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
          if (logKey) {
            unifiedLogger.logClickEvent({
              eventName: 'analytics/banner/breakglassPrimaryActionClick',
              parameters: { name: logKey, universe_id: `${universeId}` },
            });
          }
        }}>
        <Button size='small' color='inherit'>
          {primaryActionConfig.text}
        </Button>
      </Link>
    );
  }, [primaryActionConfig, logKey, unifiedLogger, universeId]);

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
    if (!logKey) {
      return;
    }
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/banner/breakglassImpression',
      parameters: { name: logKey, universe_id: `${universeId}` },
    });
  }, [unifiedLogger, logKey, universeId]);
  useImpressionObserver(cardRef, sendImpressionEvent);

  if (hasUserDismissed) {
    return null;
  }

  return (
    <Alert severity={severity} variant='standard' action={actionsBar} ref={cardRef}>
      <AlertTitle sx={{ paddingBottom: '4px' }}>{titleText}</AlertTitle>
      <Typography variant='body2'>{contentText}</Typography>
    </Alert>
  );
};

export default GenericAnalyticsBreakglassBanner;
