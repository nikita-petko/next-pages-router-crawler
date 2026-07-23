import React, { useContext, useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useRAQIAnalyticsCurrentFilterBundle } from '@modules/experience-analytics-shared/context/AnalyticsCurrentFilterBundleProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MatchmakingConfigurationContext from '../providers/MatchmakingConfigurationContext';
import type { PlaceConfigurationInfo } from '../types/ConfigurationInfo';

const AnalyticsScoringConfigurationNameCard: React.FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { filters } = useRAQIAnalyticsCurrentFilterBundle([RAQIV2Dimension.Place]);
  const matchmakingConfigurationContext = useContext(MatchmakingConfigurationContext);
  const placeId = filters.find((f) => f.dimension === RAQIV2Dimension.Place)?.values?.[0];

  const placeConfigurationInfo = useMemo((): PlaceConfigurationInfo | undefined => {
    if (!placeId || !matchmakingConfigurationContext.placesWithAppliedConfigurations) {
      return undefined;
    }
    return matchmakingConfigurationContext.placesWithAppliedConfigurations?.find(
      (place) => place.placeId === parseInt(placeId, 10),
    );
  }, [placeId, matchmakingConfigurationContext.placesWithAppliedConfigurations]);

  return (
    placeId &&
    placeConfigurationInfo && (
      <div>
        {' '}
        <Typography variant='h3'>
          {translate(
            translationKey('Label.CurrentConfiguration', TranslationNamespace.Matchmaking),
          )}
        </Typography>
        <Typography variant='h3'>: {placeConfigurationInfo?.configurationName}</Typography>
      </div>
    )
  );
};

export default AnalyticsScoringConfigurationNameCard;
