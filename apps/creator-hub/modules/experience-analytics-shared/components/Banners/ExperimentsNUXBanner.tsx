import type { FC } from 'react';
import { useMemo } from 'react';
import { BarChartIcon } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useAnalyticsExperiencePermissions } from '../../hooks/useAnalyticsPermissions';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import GenericAnalyticsNUXBanner from './GenericAnalyticsNUXBanner';

const EXPERIMENTS_NUX_NAME = 'ExperimentsNUX';
const EXPERIMENTS_NUX_BANNER_EXPIRATION_TIME = new Date('2025-12-13');

const EXPERIMENTS_NUX_NAME_IN_GAME_EXPERIMENT = 'ExperimentsNUXInGameExperiment';
const EXPERIMENTS_NUX_BANNER_EXPIRATION_TIME_IN_GAME_EXPERIMENT = new Date('2026-03-31');

export const useShouldShowExperimentsNUXBanner = (checkForInGameExperiment: boolean) => {
  const { id: universeId } = useUniverseResource();
  const { experienceHasNoInGameExperiment, experienceHasExperimentationMinDau } =
    useAnalyticsExperiencePermissions(universeId);

  const eligibilityCheck = checkForInGameExperiment
    ? experienceHasNoInGameExperiment
    : experienceHasExperimentationMinDau;

  // If checkForInGameExperiment is true, verify that today's date is after 12/11.
  // Otherwise, no need to check start date
  const startDateCheck = checkForInGameExperiment ? new Date() >= new Date('2025-12-11') : true;

  return eligibilityCheck && startDateCheck;
};

type ExperimentsNUXBannerProps = {
  checkForInGameExperiment: boolean;
  titleKey?: TranslationKey;
  descriptionKey?: TranslationKey;
};

const ExperimentsNUXBanner: FC<ExperimentsNUXBannerProps> = ({
  titleKey: givenTitleKey,
  descriptionKey: givenDescriptionKey,
  checkForInGameExperiment,
}) => {
  const { id: universeId } = useUniverseResource();
  const shouldShowExperimentsNUXBanner =
    useShouldShowExperimentsNUXBanner(checkForInGameExperiment);

  const { titleKey, descriptionKey, primaryButtonLabelKey, closeButtonLabelKey } = useMemo(() => {
    return {
      titleKey:
        givenTitleKey ??
        translationKey('Title.ExperimentsNUXBanner', TranslationNamespace.Analytics),
      descriptionKey:
        givenDescriptionKey ??
        translationKey('Description.ExperimentsNUXBanner', TranslationNamespace.Analytics),
      primaryButtonLabelKey: translationKey(
        'Message.Alert.GoToExperiments',
        TranslationNamespace.Analytics,
      ),
      closeButtonLabelKey: translationKey('Action.Dismiss', TranslationNamespace.Creations),
    };
  }, [givenDescriptionKey, givenTitleKey]);

  const experimentsUrl = useMemo(() => {
    return creatorHub.dashboard.getExperimentsUrl(universeId);
  }, [universeId]);

  if (!shouldShowExperimentsNUXBanner) {
    return null;
  }

  return (
    <GenericAnalyticsNUXBanner
      newUserExperienceName={
        checkForInGameExperiment ? EXPERIMENTS_NUX_NAME_IN_GAME_EXPERIMENT : EXPERIMENTS_NUX_NAME
      }
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      primaryButtonLabelKey={primaryButtonLabelKey}
      closeButtonLabelKey={closeButtonLabelKey}
      linkOnPrimaryButtonClick={experimentsUrl}
      expirationTime={
        checkForInGameExperiment
          ? EXPERIMENTS_NUX_BANNER_EXPIRATION_TIME_IN_GAME_EXPERIMENT
          : EXPERIMENTS_NUX_BANNER_EXPIRATION_TIME
      }
      icon={BarChartIcon}
    />
  );
};

export default ExperimentsNUXBanner;
