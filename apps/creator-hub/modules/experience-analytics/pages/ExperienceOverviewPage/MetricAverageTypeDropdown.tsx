import type { FC } from 'react';
import React, { useCallback, useState } from 'react';
import { Chip } from '@rbx/foundation-ui';
import { Button, makeStyles, Menu, MenuItem, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import OnboardingTipsCarousel from '@modules/experience-analytics-shared/components/OnboardingTips/OnboardingTipsCarousel';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MetricAverageType, useMetricAverageType } from './MetricAverageTypeContext';

const useStyles = makeStyles()({
  menuPaper: {
    marginTop: '4px',
    width: 'auto',
  },
  button: {
    padding: 0,
    minWidth: 'auto',
    minHeight: 'auto',
  },
  dropdownContainer: {
    display: 'inline-flex',
    alignItems: 'baseline',
  },
});

/**
 * Dropdown component for switching between 7-day average and daily metrics.
 * Uses Foundation UI Chip component with a dropdown menu.
 */
const MetricAverageTypeDropdown: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { metricAverageType, setMetricAverageType } = useMetricAverageType();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = !!anchorEl;
  const {
    classes: { menuPaper, button, dropdownContainer },
  } = useStyles();

  const getDisplayName = useCallback(
    (type: MetricAverageType) => {
      switch (type) {
        case MetricAverageType.L7Average:
          return translate(translationKey('Label.7DayAverage', TranslationNamespace.Insights));
        case MetricAverageType.Daily:
          return translate(translationKey('Label.Daily', TranslationNamespace.Insights));
        default:
          return '';
      }
    },
    [translate],
  );

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleOptionSelect = useCallback(
    (type: MetricAverageType) => {
      setMetricAverageType(type);
      handleMenuClose();
    },
    [setMetricAverageType, handleMenuClose],
  );

  return (
    <>
      <span className={dropdownContainer}>
        <Button
          onClick={handleButtonClick}
          className={button}
          variant='text'
          color='inherit'
          disableRipple
          aria-haspopup='listbox'
          {...(open && { 'aria-expanded': true })}
          aria-label='Select metric average type'>
          <Chip
            variant='Utility'
            size='Medium'
            text={getDisplayName(metricAverageType)}
            isChecked={false}
            trailingIconName='icon-filled-chevron-large-down'
            className='pointer-events-none'
            tabIndex={-1}
          />
        </Button>
        <OnboardingTipsCarousel
          featureKey={OnboardingFeatureKey.CreatorHubAnalyticsOverviewL7Metrics}
          stepKey={OnboardingStepKey.OverviewL7DailyBenchmarkSwitching}
        />
      </span>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            className: menuPaper,
            style: {
              minWidth: anchorEl?.offsetWidth ?? 'auto',
            },
          },
        }}>
        <MenuItem
          onClick={() => handleOptionSelect(MetricAverageType.L7Average)}
          selected={metricAverageType === MetricAverageType.L7Average}
          disableRipple>
          <Typography variant='body2'>{getDisplayName(MetricAverageType.L7Average)}</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleOptionSelect(MetricAverageType.Daily)}
          selected={metricAverageType === MetricAverageType.Daily}
          disableRipple>
          <Typography variant='body2'>{getDisplayName(MetricAverageType.Daily)}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default MetricAverageTypeDropdown;
