import { FC, MouseEventHandler, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, makeStyles, Typography, Tooltip, Grid, CloseIcon, IconButton } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useOnboardingTipsStepBundle } from '../../context/OnboardingTipsProvider';
import { getStepIndex, OnboardingTipsConfigs } from '../../constants/onboardingTipsConfigs';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';

const useStyles = makeStyles()((theme) => ({
  tooltipContainer: {
    backgroundColor: theme.palette.surface[300],
    color: theme.palette.content.standard,
    paddingTop: 16,
    paddingBottom: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  content: {
    paddingTop: 0,
    paddingBottom: 4,
    paddingLeft: 12,
    paddingRight: 12,
  },
  onboardingIcon: {
    marginLeft: 6,
    verticalAlign: 'middle',
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.actionV2.primaryBrand.fill,
  },
}));

const OnboardingTipsCarousel: FC<OnboardingTipsConfigs> = ({ featureKey, stepKey, isClosed }) => {
  const {
    classes: { tooltipContainer, buttonContainer, content, onboardingIcon },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const iconRef = useRef<HTMLSpanElement>(null);

  const {
    isEligibleForOnboardingTips,
    revokeOnboardingTipsEligibility,
    totalSteps,
    currentOnboardingStep,
    currentOnboardingTipsItem,
    setPrevStep,
    setNextStep,
    registerComponentRefForScrolling,
    unRegisterComponentRefForScrolling,
  } = useOnboardingTipsStepBundle(featureKey);

  const currentStepIndex = useMemo(
    () => getStepIndex(featureKey, currentOnboardingStep),
    [currentOnboardingStep, featureKey],
  );

  const shouldOpenOnboardingTips = useMemo(
    () => stepKey === currentOnboardingStep && isEligibleForOnboardingTips && !isClosed,
    [currentOnboardingStep, isEligibleForOnboardingTips, isClosed, stepKey],
  );

  const [isTipsVisible, setIsTipsVisible] = useState(false);

  useEffect(() => {
    if (!shouldOpenOnboardingTips) {
      setIsTipsVisible(false);
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setIsTipsVisible(true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [shouldOpenOnboardingTips]);

  const handleClose = useCallback(() => {
    revokeOnboardingTipsEligibility();
  }, [revokeOnboardingTipsEligibility]);

  const handleNext: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (currentStepIndex !== totalSteps - 1) {
      setNextStep();
    } else {
      handleClose();
    }
  }, [currentStepIndex, handleClose, setNextStep, totalSteps]);

  const handlePrev: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    setPrevStep();
  }, [setPrevStep]);

  useEffect(() => {
    registerComponentRefForScrolling(stepKey, iconRef);
    return () => unRegisterComponentRefForScrolling(stepKey);
  }, [stepKey, registerComponentRefForScrolling, unRegisterComponentRefForScrolling]);

  if (!isEligibleForOnboardingTips) {
    return null;
  }

  return (
    <Tooltip
      placement='right-start'
      slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [-8, 0] } }] } }}
      classes={{ tooltip: tooltipContainer }}
      open={isTipsVisible}
      title={
        <Grid direction='column' container classes={{ root: content }}>
          <Grid
            item
            container
            justifyContent={totalSteps > 1 ? 'space-between' : 'flex-end'}
            alignItems='center'>
            {totalSteps > 1 && (
              <Typography variant='caption' color='secondary'>
                {currentStepIndex + 1} / {totalSteps}
              </Typography>
            )}
            <IconButton
              aria-label={translate(translationKey('Action.Close', TranslationNamespace.Analytics))}
              size='small'
              color='default'
              onClick={handleClose}>
              <CloseIcon fontSize='medium' />
            </IconButton>
          </Grid>

          {currentOnboardingTipsItem}

          <Grid item container gap={1} wrap='nowrap' justifyContent='flex-end'>
            {currentStepIndex !== 0 && (
              <Grid item XSmall={6}>
                <Button
                  variant='contained'
                  color='secondary'
                  classes={{ root: buttonContainer }}
                  onClick={handlePrev}>
                  {translate(translationKey('Action.Back', TranslationNamespace.Analytics))}
                </Button>
              </Grid>
            )}
            <Grid item XSmall={6}>
              <Button variant='contained' classes={{ root: buttonContainer }} onClick={handleNext}>
                {translate(
                  translationKey(
                    currentStepIndex !== totalSteps - 1 ? 'Action.Next' : 'Action.Done',
                    TranslationNamespace.Analytics,
                  ),
                )}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      }>
      <span id={stepKey} ref={iconRef} className={onboardingIcon} />
    </Tooltip>
  );
};

export default OnboardingTipsCarousel;
