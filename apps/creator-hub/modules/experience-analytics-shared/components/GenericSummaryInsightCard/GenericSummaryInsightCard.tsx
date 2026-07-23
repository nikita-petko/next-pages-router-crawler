import React, { useCallback, useMemo, useRef } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { Card, Typography, Grid, Button } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import {
  logAnalyticsImpressionEvent,
  logAnalyticsClickEvent,
} from '../../utils/analyticsEventLogger';
import GenericActionMenu from '../GenericActionMenu';
import useGenericSummaryInsightCardStyles from './GenericSummaryInsightCard.styles';

export type GenericSummaryInsightCardProps = {
  header: {
    text: FormattedText;
    adornment?: React.ReactNode;
  };
  body: {
    content: React.ReactNode;
    fixedHeight?: number | string;
    enableFade?: boolean;
  };
  primaryAction: {
    label: FormattedText;
    onClick: () => void;
  };
  disclaimer?: FormattedText;
  logging?: {
    impressionEventName: string;
    clickEventName: string;
    parameters: Record<string, string | number | boolean | Date>;
  };
  snoozeAction?: {
    label: FormattedText;
    onSnooze: () => void;
  };
};

const GenericSummaryInsightCard: React.FC<GenericSummaryInsightCardProps> = ({
  header,
  body,
  primaryAction,
  disclaimer,
  logging,
  snoozeAction,
}) => {
  const {
    classes: {
      card,
      iconContainer,
      contentContainer,
      headerContainer,
      headerContent,
      headerText,
      bodyContainer,
      bodyWithFade,
      footerContainer,
      ctaButton,
    },
    cx,
  } = useGenericSummaryInsightCardStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const cardRef = useRef<HTMLDivElement>(null);

  const logImpression = useCallback(() => {
    if (logging) {
      logAnalyticsImpressionEvent(unifiedLogger, logging.impressionEventName, logging.parameters);
    }
  }, [unifiedLogger, logging]);

  useImpressionObserver(cardRef, logImpression);

  const handlePrimaryActionClick = useCallback(() => {
    if (logging) {
      logAnalyticsClickEvent(unifiedLogger, logging.clickEventName, logging.parameters);
    }
    primaryAction.onClick();
  }, [unifiedLogger, logging, primaryAction]);

  const actionMenuItems = useMemo(() => {
    if (!snoozeAction) {
      return [];
    }
    return [
      {
        text: snoozeAction.label,
        onClick: snoozeAction.onSnooze,
      },
    ];
  }, [snoozeAction]);

  const bodyStyle: React.CSSProperties = body.fixedHeight ? { height: body.fixedHeight } : {};

  return (
    <Card ref={cardRef} variant='outlined'>
      <Grid className={card} container>
        <Grid className={iconContainer} item>
          <Icon name='icon-regular-nebula' />
        </Grid>
        <Grid className={contentContainer} item>
          <div className={headerContainer}>
            <div className={headerContent}>
              <Typography className={headerText} variant='h5'>
                {header.text}
              </Typography>
              {header.adornment}
            </div>
            {snoozeAction && <GenericActionMenu actions={actionMenuItems} useVerticalIcon />}
          </div>

          <div className={cx(bodyContainer, body.enableFade && bodyWithFade)} style={bodyStyle}>
            {body.content}
          </div>

          <div className={footerContainer}>
            <Button
              className={ctaButton}
              variant='contained'
              color='secondary'
              onClick={handlePrimaryActionClick}>
              {primaryAction.label}
            </Button>
            {disclaimer && (
              <Typography variant='captionBody' color='secondary'>
                {disclaimer}
              </Typography>
            )}
          </div>
        </Grid>
      </Grid>
    </Card>
  );
};

export default GenericSummaryInsightCard;
