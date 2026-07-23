import React from 'react';
import { GenericCreatorSettingType } from '@rbx/clients/creatorSettings';
import { MapRoundedIcon, DescriptionRoundedIcon } from '@rbx/ui';

export type TOnboardingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  IconComponent: React.FunctionComponent<
    React.PropsWithChildren<{
      classes?: { root?: string };
    }>
  >;
  link: string;
  completed?: boolean;
};

export const onboardingStepCards: TOnboardingStep[] = [
  {
    id: 'visitCreatorHub',
    titleKey: 'Heading.VisitCreatorHub',
    descriptionKey: 'Description.VisitCreatorHub',
    IconComponent: MapRoundedIcon,
    link: '/',
    completed: true,
  },
  {
    id: 'readStudioIntro',
    titleKey: 'Heading.ReadIntroStudio',
    descriptionKey: 'Description.ReadIntroStudio',
    IconComponent: DescriptionRoundedIcon,
    link: `${process.env.baseUrl}/docs/tutorials/first-experience`,
  },
];

export const HOMEPAGE_ONBOARDING_BANNER_SETTING_TYPE =
  GenericCreatorSettingType.HomeStudioDocumentationUpsell;
export const HOMEPAGE_ONBOARDING_DISMISS_SETTING_VALUE = 'dimiss';
export const HOMEPAGE_ONBOARDING_RESET_SETTING_VALUE = 'reset';
