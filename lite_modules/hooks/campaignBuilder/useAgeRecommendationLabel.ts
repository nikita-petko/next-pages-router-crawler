import { useEffect, useState } from 'react';

import { MATURITY_PLACEHOLDER } from '@constants/campaignBuilder';
import {
  formatAgeRecommendationLabel,
  getAgeRecommendation,
} from '@services/experienceGuidelines/getAgeRecommendationService';
import { CaptureException } from '@utils/error';

/**
 * Resolves the maturity label for the reach creative preview by fetching the
 * universe's age recommendation from experience-guidelines-api. Falls back to
 * {@link MATURITY_PLACEHOLDER} while loading or whenever the fetch fails / the
 * experience has no recommendation yet.
 */
const useAgeRecommendationLabel = (universeId: number | undefined): string => {
  const [label, setLabel] = useState<string>(MATURITY_PLACEHOLDER);

  useEffect(() => {
    if (!universeId || universeId <= 0) {
      setLabel(MATURITY_PLACEHOLDER);
      return undefined;
    }

    let isActive = true;
    setLabel(MATURITY_PLACEHOLDER);

    getAgeRecommendation(universeId)
      .then((recommendation) => {
        if (!isActive) {
          return;
        }
        setLabel(formatAgeRecommendationLabel(recommendation));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        CaptureException(error, { context: 'useAgeRecommendationLabel' });
        setLabel(MATURITY_PLACEHOLDER);
      });

    return () => {
      isActive = false;
    };
  }, [universeId]);

  return label;
};

export default useAgeRecommendationLabel;
