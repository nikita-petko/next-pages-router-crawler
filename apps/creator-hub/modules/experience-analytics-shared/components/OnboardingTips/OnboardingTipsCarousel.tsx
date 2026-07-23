import type { FC, MouseEventHandler } from 'react';
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Button, makeStyles, Typography, Tooltip, Grid, CloseIcon, IconButton } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { OnboardingTipsConfigs } from '../../constants/onboardingTipsConfigs';
import { getStepIndex, onboardingTipsConfigs } from '../../constants/onboardingTipsConfigs';
import { useOnboardingTipsStepBundle } from '../../context/OnboardingTipsProvider';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import OnboardingTipsCarouselContent from './OnboardingTipsCarouselContent';

const ONBOARDING_TIPS_SHOW_DELAY_MS = 500;

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
  contentCompact: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 8,
    paddingRight: 8,
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

const OnboardingTipsCarousel: FC<OnboardingTipsConfigs> = ({
  featureKey,
  stepKey,
  isClosed,
  isSingleLineStyle = false,
}) => {
  const {
    classes: { tooltipContainer, buttonContainer, content, contentCompact, onboardingIcon },
  } = useStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const iconRef = useRef<HTMLSpanElement>(null);

  const {
    isEligibleForOnboardingTips,
    revokeOnboardingTipsEligibility,
    totalSteps,
    currentOnboardingStep,
    setPrevStep,
    setNextStep,
    registerComponentRefForScrolling,
    unRegisterComponentRefForScrolling,
  } = useOnboardingTipsStepBundle(featureKey);

  const stepIndex = useMemo(() => getStepIndex(featureKey, stepKey), [featureKey, stepKey]);

  const compactStepConfig = onboardingTipsConfigs[stepKey];
  const isSingleLineCompactLayout =
    isSingleLineStyle && totalSteps === 1 && compactStepConfig.contentKey == null;

  const shouldOpenOnboardingTips = useMemo(
    () => stepKey === currentOnboardingStep && isEligibleForOnboardingTips && !isClosed,
    [currentOnboardingStep, isEligibleForOnboardingTips, isClosed, stepKey],
  );

  const [isTipsVisible, setIsTipsVisible] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        setIsTipsVisible(shouldOpenOnboardingTips);
      },
      shouldOpenOnboardingTips ? ONBOARDING_TIPS_SHOW_DELAY_MS : 0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [shouldOpenOnboardingTips]);

  const handleClose = useCallback(() => {
    revokeOnboardingTipsEligibility();
  }, [revokeOnboardingTipsEligibility]);

  const handleNext: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    if (stepIndex !== totalSteps - 1) {
      setNextStep();
    } else {
      handleClose();
    }
  }, [handleClose, setNextStep, stepIndex, totalSteps]);

  const handlePrev: MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    setPrevStep();
  }, [setPrevStep]);

  const stopOnboardingTipPropagation: MouseEventHandler = useCallback((event) => {
    event.stopPropagation();
  }, []);

  useEffect(() => {
    registerComponentRefForScrolling(stepKey, iconRef);
    return () => unRegisterComponentRefForScrolling(stepKey);
  }, [stepKey, registerComponentRefForScrolling, unRegisterComponentRefForScrolling]);

  if (!isEligibleForOnboardingTips) {
    return null;
  }

  const closeButton = (
    <IconButton
      aria-label={translate(translationKey('Action.Close', TranslationNamespace.Analytics))}
      size='small'
      color='default'
      onClick={handleClose}>
      <CloseIcon fontSize='medium' />
    </IconButton>
  );

  return (
    <Tooltip
      placement='right-start'
      slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [-8, 0] } }] } }}
      classes={{ tooltip: tooltipContainer }}
      open={isTipsVisible}
      title={
        <Grid
          direction='column'
          container
          onClick={stopOnboardingTipPropagation}
          onMouseDown={stopOnboardingTipPropagation}
          classes={{ root: isSingleLineCompactLayout ? contentCompact : content }}>
          {isSingleLineCompactLayout ? (
            <Flex alignItems='center' justifyContent='space-between'>
              <Typography component='div' variant='h6' noWrap>
                {translate(compactStepConfig.titleKey)}
              </Typography>
              {closeButton}
            </Flex>
          ) : (
            <>
              <Grid
                item
                container
                justifyContent={totalSteps > 1 ? 'space-between' : 'flex-end'}
                alignItems='center'>
                {totalSteps > 1 && (
                  <Typography variant='caption' color='secondary'>
                    {stepIndex + 1} / {totalSteps}
                  </Typography>
                )}
                {closeButton}
              </Grid>
              <OnboardingTipsCarouselContent
                titleKey={compactStepConfig.titleKey}
                contentKey={compactStepConfig.contentKey}
                contentLink={compactStepConfig.contentLink}
              />
              {!isSingleLineStyle && (
                <Grid item container gap={1} wrap='nowrap' justifyContent='flex-end'>
                  {stepIndex !== 0 && (
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
                    <Button
                      variant='contained'
                      classes={{ root: buttonContainer }}
                      onClick={handleNext}>
                      {translate(
                        translationKey(
                          stepIndex !== totalSteps - 1 ? 'Action.Next' : 'Action.Done',
                          TranslationNamespace.Analytics,
                        ),
                      )}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Grid>
      }>
      <span id={stepKey} ref={iconRef} className={onboardingIcon} />
    </Tooltip>
  );
};

export default OnboardingTipsCarousel;
