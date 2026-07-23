import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, clsx, FeedbackBanner, Icon, IconButton } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useMediaQuery } from '@rbx/ui';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { UnifiedAlertItem } from '../types';

export interface UnifiedAlertBannerProps {
  /** Array of alerts to display */
  alerts: UnifiedAlertItem[];
  /** Page identifier for tracking events (e.g. 'home', 'overview') */
  trackingPage?: string;
}

/**
 * UnifiedAlertBanner displays alerts in a consistent format.
 *
 * - Single alert: Uses foundation-ui's FeedbackBanner directly
 * - Multiple alerts: Custom container matching FeedbackBanner styling with stacked alert rows
 * - Supports optional modals that open when CTA is clicked
 */
const UnifiedAlertBanner: FC<UnifiedAlertBannerProps> = ({ alerts, trackingPage }) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => !dismissedAlerts.has(alert.id)),
    [alerts, dismissedAlerts],
  );

  const getTrackingParams = useCallback(
    (alert: UnifiedAlertItem, action?: string) => ({
      ...alert.trackingParams,
      alertId: alert.id,
      ...(action && { action }),
      alertCount: String(visibleAlerts.length),
      ...(trackingPage && { page: trackingPage }),
    }),
    [trackingPage, visibleAlerts.length],
  );

  const handleDismiss = useCallback(
    (alert: UnifiedAlertItem) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.UnifiedAlertClick,
        parameters: getTrackingParams(alert, 'dismiss'),
      });
      alert.onDismiss?.();
      setDismissedAlerts((prev) => new Set(prev).add(alert.id));
    },
    [unifiedLogger, getTrackingParams],
  );

  const handleCtaClick = useCallback(
    (alert: UnifiedAlertItem) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.UnifiedAlertClick,
        parameters: getTrackingParams(alert, 'cta'),
      });
      if (alert.Modal) {
        setActiveModalId(alert.id);
      } else {
        alert.ctaOnClick?.();
      }
    },
    [unifiedLogger, getTrackingParams],
  );

  const handleModalClose = useCallback(() => {
    setActiveModalId(null);
  }, []);

  const handleLearnMoreClick = useCallback(
    (alert: UnifiedAlertItem) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.UnifiedAlertClick,
        parameters: getTrackingParams(alert, 'learnMore'),
      });
    },
    [unifiedLogger, getTrackingParams],
  );

  const sendImpressionEvent = useCallback(() => {
    visibleAlerts.forEach((alert) => {
      unifiedLogger.logImpressionEvent({
        eventName: CreatorDashboardEventType.UnifiedAlertImpression,
        parameters: getTrackingParams(alert),
      });
    });
  }, [visibleAlerts, unifiedLogger, getTrackingParams]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  if (visibleAlerts.length === 0) {
    return null;
  }

  // Single alert
  if (visibleAlerts.length === 1) {
    const alert = visibleAlerts[0];

    return (
      <div ref={bannerRef} className='margin-bottom-medium'>
        <FeedbackBanner
          title={alert.title}
          description={alert.description}
          severity={alert.severity ?? 'Warning'}
          layout={isSmallScreen ? 'Stacked' : 'Inline'}
          linkLabel={
            alert.learnMoreLink ? alert.learnMoreText || translate('Action.LearnMore') : undefined
          }
          linkHref={alert.learnMoreLink}
          onLinkClick={alert.learnMoreLink ? () => handleLearnMoreClick(alert) : undefined}
          primaryActionLabel={alert.ctaText}
          onPrimaryAction={alert.ctaText ? () => handleCtaClick(alert) : undefined}
          onDismiss={alert.dismissible !== false ? () => handleDismiss(alert) : undefined}
        />
        {alert.Modal && (
          <alert.Modal open={activeModalId === alert.id} onClose={handleModalClose} />
        )}
      </div>
    );
  }

  // Multiple alerts
  return (
    <div ref={bannerRef} className='margin-bottom-medium'>
      <div className='radius-medium padding-large stroke-standard bg-shift-100 stroke-default'>
        <div className='flex flex-col gap-medium'>
          {visibleAlerts.map((alert) => {
            const iconElement = (
              <Icon
                name='icon-filled-triangle-exclamation'
                size='Large'
                className='shrink-0'
                style={{ color: 'var(--inverse-system-warning)' }}
              />
            );

            const linkElement = alert.learnMoreLink ? (
              <>
                <span> · </span>
                <a
                  href={alert.learnMoreLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() => handleLearnMoreClick(alert)}>
                  <span
                    className='inline-flex items-center gap-xsmall text-body-medium content-default'
                    style={{ textDecoration: 'underline' }}>
                    {alert.learnMoreText || translate('Action.LearnMore')}
                  </span>
                </a>
              </>
            ) : null;

            const ctaElement =
              alert.ctaText && (alert.ctaOnClick || alert.Modal) ? (
                <Button variant='Standard' size='Small' onClick={() => handleCtaClick(alert)}>
                  {alert.ctaText}
                </Button>
              ) : null;

            return (
              <div
                key={alert.id}
                className={clsx('flex gap-medium', isSmallScreen ? 'items-start' : 'items-center')}>
                {iconElement}
                <div
                  className={clsx(
                    'flex grow-1 min-width-0 basis-0 gap-medium',
                    isSmallScreen ? 'flex-col' : 'items-center',
                  )}>
                  <div className='grow-1 min-width-0 basis-0'>
                    <span className='text-label-medium content-emphasis'>{alert.title}</span>
                    {alert.description && (
                      <span className='text-body-medium content-default'>{alert.description}</span>
                    )}
                    {linkElement}
                  </div>
                  {(ctaElement || alert.dismissible !== false) && (
                    <div className='flex items-center gap-small'>
                      {ctaElement}
                      {alert.dismissible !== false && (
                        <IconButton
                          size='Small'
                          variant='Utility'
                          icon='icon-regular-x'
                          ariaLabel='Dismiss alert'
                          onClick={() => handleDismiss(alert)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Render modals for alerts that have them */}
      {visibleAlerts.map(
        (alert) =>
          alert.Modal && (
            <alert.Modal
              key={`modal-${alert.id}`}
              open={activeModalId === alert.id}
              onClose={handleModalClose}
            />
          ),
      )}
    </div>
  );
};

export default withTranslation(UnifiedAlertBanner, [TranslationNamespace.Home]);
