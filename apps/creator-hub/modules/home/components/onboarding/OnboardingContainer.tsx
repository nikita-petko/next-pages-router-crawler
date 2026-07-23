import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { makeStyles } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useGetGenericCreatorSetting,
  useCreateOrUpdateGenericCreatorSettings,
} from '@modules/react-query/creatorSettings';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  StarterPlaceParameterResults,
  StarterPlaceParameters,
} from '@modules/clients/ixpExperiments';
import Section from '../common/Section';
import {
  HOMEPAGE_ONBOARDING_DISMISS_SETTING_VALUE,
  HOMEPAGE_ONBOARDING_RESET_SETTING_VALUE,
  HOMEPAGE_ONBOARDING_BANNER_SETTING_TYPE,
} from '../../constants/onboardingStepsConstants';
import VideoOnboarding from './VideoOnboarding';

const useStyles = makeStyles()({
  section: {
    opacity: 1,
    transition: '400ms',
  },
  dismissedSection: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
});

interface OnboardingContainerProps {
  shouldResetOnboardingBanner: boolean;
  starterPlaceTemplateId: StarterPlaceParameterResults[StarterPlaceParameters.StarterPlaceTemplateId];
  isFetchedStarterPlaceCreation: boolean;
  isCreatePlaceEnabled: boolean;
}

const OnboardingContainer: FunctionComponent<React.PropsWithChildren<OnboardingContainerProps>> = ({
  shouldResetOnboardingBanner,
  starterPlaceTemplateId,
  isFetchedStarterPlaceCreation,
  isCreatePlaceEnabled,
}) => {
  const { user } = useAuthentication();
  const {
    classes: { section, dismissedSection },
    cx,
  } = useStyles();
  const [dismissed, setDismiss] = useState(false);
  const { data: onboardingSetting, isFetched: isFetchedOnboardingSetting } =
    useGetGenericCreatorSetting(user?.id, HOMEPAGE_ONBOARDING_BANNER_SETTING_TYPE);

  const shouldReturnNull = useMemo(() => {
    return (
      !isFetchedOnboardingSetting ||
      (onboardingSetting === HOMEPAGE_ONBOARDING_DISMISS_SETTING_VALUE &&
        !shouldResetOnboardingBanner)
    );
  }, [isFetchedOnboardingSetting, onboardingSetting, shouldResetOnboardingBanner]);

  const { mutateAsync: updateSettings } = useCreateOrUpdateGenericCreatorSettings();

  useEffect(() => {
    if (user?.id && shouldResetOnboardingBanner === true) {
      updateSettings({
        userId: user?.id,
        setting: HOMEPAGE_ONBOARDING_BANNER_SETTING_TYPE,
        settingValue: HOMEPAGE_ONBOARDING_RESET_SETTING_VALUE,
      });
      unifiedLoggerClient.logImpressionEvent({
        eventName: 'resetOnboardingBanner',
        parameters: {
          starterPlaceTemplateId: starterPlaceTemplateId?.toString() ?? '',
        },
      });
    }
  }, [shouldResetOnboardingBanner, updateSettings, user?.id, starterPlaceTemplateId]);

  const onDismiss = async () => {
    setDismiss(true);
    await updateSettings({
      userId: user?.id,
      setting: HOMEPAGE_ONBOARDING_BANNER_SETTING_TYPE,
      settingValue: HOMEPAGE_ONBOARDING_DISMISS_SETTING_VALUE,
    });
    unifiedLoggerClient.logClickEvent({
      eventName: 'dismissOnboardingBanner',
      parameters: {
        starterPlaceTemplateId: starterPlaceTemplateId?.toString() ?? '',
      },
    });
  };

  if (shouldReturnNull) {
    return null;
  }

  return (
    <Section classes={{ root: cx(section, { [dismissedSection]: dismissed }) }}>
      <VideoOnboarding
        onDismiss={onDismiss}
        starterPlaceTemplateId={starterPlaceTemplateId}
        isFetchedStarterPlaceCreation={isFetchedStarterPlaceCreation}
        isCreatePlaceEnabled={isCreatePlaceEnabled}
      />
    </Section>
  );
};

export default withTranslation(OnboardingContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Home,
]);
