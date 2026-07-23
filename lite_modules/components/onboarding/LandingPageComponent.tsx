/* eslint-disable require-explicit-generics/require-explicit-generics */
import { Button } from '@rbx/foundation-ui';
import { memo } from 'react';

import LandingHeaderComponent from '@components/onboarding/LandingHeaderComponent';
import { useLandingPageStyles } from '@components/onboarding/LandingPageComponent.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface LandingPageComponentInputProps {
  buttonDisabled: boolean;
  buttonOnClick: () => void;
  buttonText: string;
  isForecastEstimatorEnabled?: boolean;
  onForecastEstimatorClick?: () => void;
}

const resourceData = [
  {
    href: 'https://create.roblox.com/docs/production/promotion/ads-manager',
    textKey: 'Description.AdsManagerGuide',
  },
  {
    href: 'https://create.roblox.com/docs/production/monetization/immersive-ads',
    textKey: 'Description.ImmersiveAdPayouts',
  },
  {
    href: 'https://create.roblox.com/docs/production/promotion/complying-with-advertising-standards',
    textKey: 'Description.AdStandards',
  },
];

const LandingPageComponent = memo(
  ({
    buttonDisabled,
    buttonOnClick,
    buttonText,
    isForecastEstimatorEnabled = false,
    onForecastEstimatorClick,
  }: LandingPageComponentInputProps) => {
    const { translate: translateNavigation } = useNamespacedTranslation(
      TranslationNamespace.Navigation,
    );
    const { translate: translateLanding } = useNamespacedTranslation(TranslationNamespace.Landing);
    const {
      classes: {
        resourceButton,
        resourceCard,
        resourceCardContainer,
        resourceContainer,
        resourceText,
        resourceTitleContainer,
      },
    } = useLandingPageStyles();

    return (
      <>
        <LandingHeaderComponent
          buttonDisabled={buttonDisabled}
          buttonOnClick={buttonOnClick}
          buttonText={buttonText}
          isForecastEstimatorEnabled={isForecastEstimatorEnabled}
          onForecastEstimatorClick={onForecastEstimatorClick}
        />
        <div className={resourceContainer}>
          <div className={resourceTitleContainer}>
            <span className='text-heading-medium'>{translateNavigation('Label.Resources')}</span>
          </div>
          <div className={resourceCardContainer}>
            {resourceData.map((resource) => (
              <div className={resourceCard} key={resource.href}>
                <span className={`text-body-large ${resourceText}`}>
                  {translateLanding(resource.textKey)}
                </span>
                <Button
                  as='a'
                  className={resourceButton}
                  href={resource.href}
                  rel='noopener noreferrer'
                  size='Medium'
                  variant='Utility'>
                  {translateLanding('Action.LearnMore')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
);

export default LandingPageComponent;
