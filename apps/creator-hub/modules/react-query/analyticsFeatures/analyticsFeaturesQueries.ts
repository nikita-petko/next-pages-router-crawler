import { useQuery } from '@tanstack/react-query';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { logAnalyticsError } from '@modules/charts-generic';
import { useCallback } from 'react';
import { GetUniverseFeaturesResponse } from '@rbx/clients/analyticsFeaturesApi';
import getAnalyticsFeatures from './analyticsFeaturesRequests';
import {
  AnalyticsFeatureName,
  AnalyticsFeatureValues,
  BooleanValues,
  TBooleanValues,
} from './Features';

const buildRecommendableStatusValues = (values: { [key: string]: string }) => {
  const recommendableStatusValues: AnalyticsFeatureValues & {
    name: AnalyticsFeatureName.QualityStatus;
  } = {
    name: AnalyticsFeatureName.QualityStatus,
    status: null,
  };

  Object.entries(values).forEach(([key, value]) => {
    switch (key) {
      case 'is_consolidated_cq_compliant_prod_v1':
        if (BooleanValues.includes(value as TBooleanValues)) {
          recommendableStatusValues.status = value as TBooleanValues;
        } else {
          logAnalyticsError(
            `Invalid recommendable status value received for ${AnalyticsFeatureName.QualityStatus}`,
          );
          recommendableStatusValues.status = null;
        }
        break;
      default:
        break;
    }
  });

  return recommendableStatusValues;
};

const buildRegionalPricingValues = (values: { [key: string]: string }) => {
  const regionalPricingValues: AnalyticsFeatureValues & {
    name: AnalyticsFeatureName.RegionalPricing;
  } = {
    name: AnalyticsFeatureName.RegionalPricing,
    adopted: null,
    eligible: null,
  };

  Object.entries(values).forEach(([key, value]) => {
    switch (key) {
      case 'regional_pricing_adopted':
        if (BooleanValues.includes(value as TBooleanValues)) {
          regionalPricingValues.adopted = value as TBooleanValues;
        } else {
          logAnalyticsError(
            `Invalid adopted value received for ${AnalyticsFeatureName.RegionalPricing}`,
          );
          regionalPricingValues.adopted = null;
        }
        break;
      case 'regional_pricing_eligible':
        if (BooleanValues.includes(value as TBooleanValues)) {
          regionalPricingValues.eligible = value as TBooleanValues;
        } else {
          logAnalyticsError(
            `Invalid eligible value received for ${AnalyticsFeatureName.RegionalPricing}`,
          );
          regionalPricingValues.eligible = null;
        }
        break;
      default:
        break;
    }
  });

  return regionalPricingValues;
};

const useGetAnalyticsFeatures = (universeId: number, featureNames: Array<AnalyticsFeatureName>) => {
  const select = useCallback(({ features }: GetUniverseFeaturesResponse) => {
    const featureValues = new Map<AnalyticsFeatureName, AnalyticsFeatureValues>();
    features?.forEach(({ name, values }) => {
      if (!values) {
        return;
      }

      switch (name) {
        case AnalyticsFeatureName.QualityStatus:
          featureValues.set(name, buildRecommendableStatusValues(values));
          break;
        case AnalyticsFeatureName.RegionalPricing:
          featureValues.set(name, buildRegionalPricingValues(values));
          break;
        default:
          break;
      }
    });
    return featureValues;
  }, []);

  return useQuery({
    queryKey: ['analyticsFeaturesApi', universeId, [...featureNames].sort()],
    queryFn: async () => getAnalyticsFeatures({ universeId, featureNames }),
    select,
    enabled: universeId !== uninitializedUniverseId,
  });
};

export default useGetAnalyticsFeatures;
