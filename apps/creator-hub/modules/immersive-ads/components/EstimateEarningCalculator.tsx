import React, { FC, useState, useEffect, useRef } from 'react';
import {
  Typography,
  Select,
  MenuItem,
  Slider,
  InfoOutlinedIcon,
  Tooltip,
  RobuxIcon,
  LaunchIcon,
} from '@rbx/ui';
import { GetEstimatedAdsEarningsResponse } from '@modules/clients/developerAdsStats';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useEstimateEarningCalculatorStyles from './EstimateEarningCalculator.styles';
import EstimateEarningModal from './EstimateEarningModal';
import useEstimatedEarnings from './useEstimatedEarnings';
import ImmersiveAdsEventName from '../constants/immersiveAdsEventNames';
import {
  CalculatorTitleKey,
  WeeklyPotentialEarningsKey,
  DailyAdViewsPerUserKey,
  DailyAdViewsPerUserTooltipKey,
  AdFormatKey,
  LearnMoreAboutKey,
  HowToKey,
  RewardedVideoAdsKey,
} from '../constants/calculatorTranslationKeys';

// 10 seconds debounce time for slider analytics events
const SLIDER_EVENT_DEBOUNCE_MS = 10000;

interface EstimateEarningCalculatorProps {
  className?: string;
  apiData: GetEstimatedAdsEarningsResponse;
}

const EstimateEarningCalculator: FC<EstimateEarningCalculatorProps> = ({ className, apiData }) => {
  const { classes, cx } = useEstimateEarningCalculatorStyles();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  // Ref to track debounce timer for slider analytics events
  const sliderDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    selectedAdFormat,
    dailyAdViews,
    adFormats,
    formattedEarnings,
    handleAdFormatChange,
    handleSliderChange,
  } = useEstimatedEarnings({ apiData, translate, RewardedVideoAdsKey });

  // Log impression when calculator component mounts
  useEffect(() => {
    unifiedLoggerClient.logImpressionEvent({
      eventName: ImmersiveAdsEventName.RvCalculatorImpression,
      parameters: {
        component: 'EstimateEarningCalculator',
      },
    });
  }, []);

  // Analytics tracking handlers
  const trackModalOpen = () => {
    unifiedLoggerClient.logClickEvent({
      eventName: ImmersiveAdsEventName.RvCalculatorModalOpen,
      parameters: {
        component: 'EstimateEarningCalculator',
        action: 'openModal',
      },
    });
    setIsModalOpen(true);
  };

  const trackDocumentationLinkClick = () => {
    unifiedLoggerClient.logClickEvent({
      eventName: ImmersiveAdsEventName.RvCalculatorDocumentationClick,
      parameters: {
        component: 'EstimateEarningCalculator',
        action: 'clickDocumentationLink',
        linkType: 'implementRewardedVideoAds',
      },
    });
  };

  const trackSliderChange = (event: Event, value: number | number[]) => {
    const sliderValue = Array.isArray(value) ? value[0] : value;

    // Clear existing timer
    if (sliderDebounceTimerRef.current) {
      clearTimeout(sliderDebounceTimerRef.current);
    }

    // Set new timer to fire analytics event after 10 seconds of inactivity
    sliderDebounceTimerRef.current = setTimeout(() => {
      unifiedLoggerClient.logClickEvent({
        eventName: ImmersiveAdsEventName.RvCalculatorSliderChange,
        parameters: {
          component: 'EstimateEarningCalculator',
          action: 'changeSlider',
          value: sliderValue.toString(),
        },
      });
    }, SLIDER_EVENT_DEBOUNCE_MS);

    // Always call the actual slider change handler to update the UI
    handleSliderChange(event, value);
  };

  const trackAdFormatChange = (event: React.ChangeEvent<{ value: string }>) => {
    const selectedValue = event.target.value;
    unifiedLoggerClient.logClickEvent({
      eventName: ImmersiveAdsEventName.RvCalculatorAdFormatChange,
      parameters: {
        component: 'EstimateEarningCalculator',
        action: 'changeAdFormat',
        adFormat: selectedValue,
      },
    });
    handleAdFormatChange(event);
  };

  return (
    <div className={cx(classes.calculatorContainer, className)}>
      <Typography className={classes.calculatorTitle}>{translate(CalculatorTitleKey)}</Typography>

      <div className={classes.mainFrame}>
        {/* Controls Block - Left side with dropdown and slider */}
        <div className={classes.controlsBlock}>
          {/* Ad Format Dropdown */}
          <div className={classes.dropdownContainer}>
            <div className={classes.selectWrapper}>
              <Typography className={classes.inputLabel}>{translate(AdFormatKey)}</Typography>
              <Select
                className={classes.selectContainer}
                value={selectedAdFormat}
                onChange={trackAdFormatChange}
                fullWidth
                size='medium'
                disabled={adFormats.length === 0}>
                {adFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    {format.label}
                  </MenuItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Slider */}
          <div className={classes.sliderContainer}>
            <div className={classes.sliderLabelContainer}>
              <Typography className={classes.sliderLabel}>
                {`${dailyAdViews.toFixed(1)} ${translate(DailyAdViewsPerUserKey)}`}
              </Typography>
              <Tooltip title={translate(DailyAdViewsPerUserTooltipKey)} arrow>
                <InfoOutlinedIcon className={classes.infoIcon} />
              </Tooltip>
            </div>

            <Slider
              className={classes.slider}
              value={dailyAdViews}
              onChange={trackSliderChange}
              min={0.0}
              max={3.0}
              step={0.1}
              aria-label={`${dailyAdViews.toFixed(1)} ${translate(DailyAdViewsPerUserKey)}`}
            />

            <Typography className={classes.helperText}>
              <Typography component='div'>
                {translateHTML(LearnMoreAboutKey, [
                  {
                    opening: 'estimateLinkStart',
                    closing: 'estimateLinkEnd',
                    content: (chunks) => (
                      <Typography
                        component='span'
                        onClick={trackModalOpen}
                        className={classes.helperLink}
                        sx={{
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}>
                        {chunks}
                      </Typography>
                    ),
                  },
                ])}
              </Typography>
              <Typography component='div'>
                {translateHTML(HowToKey, [
                  {
                    opening: 'implementLinkStart',
                    closing: 'implementLinkEnd',
                    content: (chunks) => (
                      <Typography
                        component='a'
                        href='https://create.roblox.com/docs/en-us/production/promotion/rewarded-video-ads'
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={trackDocumentationLinkClick}
                        className={classes.helperLink}
                        sx={{
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}>
                        {chunks}
                        <LaunchIcon sx={{ fontSize: '1rem' }} />
                      </Typography>
                    ),
                  },
                ])}
              </Typography>
            </Typography>
          </div>
        </div>

        {/* Earnings Block - Right side showing weekly potential earnings */}
        <div className={classes.earningsBlock}>
          <div className={classes.earningsContainer}>
            <Typography className={classes.earningsLabel}>
              {translate(WeeklyPotentialEarningsKey)}
            </Typography>

            <div className={classes.robuxIconAndValue}>
              <div className={classes.robuxIcon}>
                <RobuxIcon />
              </div>
              <Typography className={classes.earningsValue}>{formattedEarnings}</Typography>
            </div>

            <Typography className={classes.adViewsLabel}>
              {`${dailyAdViews.toFixed(1)} ${translate(DailyAdViewsPerUserKey)}`}
            </Typography>
          </div>
        </div>
      </div>

      <EstimateEarningModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        estimatedEarnings={formattedEarnings}
        adsPerUser={dailyAdViews}
      />
    </div>
  );
};

export default withTranslation(EstimateEarningCalculator, [
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
