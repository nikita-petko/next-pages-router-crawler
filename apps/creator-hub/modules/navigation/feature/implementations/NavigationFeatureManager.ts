import { ParsedUrlQuery } from 'querystring';
import type Feature from '../interfaces/Feature';
import type FeatureManager from '../interfaces/FeatureManager';
import { TCombinedSettings } from '../../constants';

export default class NavigationFeatureManager<T = TCombinedSettings> implements FeatureManager<T> {
  private allFeatures: Feature<T>[];

  constructor(private basePath = '') {
    this.allFeatures = [];
  }

  getMainFeature(settings: T): Feature<T> | null {
    if (this.allFeatures.length === 0) {
      return null;
    }

    const mainFeature = this.allFeatures.find(
      (feature) => feature.isEnabledOnSettings?.(settings) ?? true,
    );
    return mainFeature ?? null;
  }

  getAllFeatures(): Feature<T>[] {
    return this.allFeatures;
  }

  getAllFeaturesFlatten(): Feature<T>[] {
    return NavigationFeatureManager.flattenFeatures(this.allFeatures);
  }

  filterDisabledFeatures(features: Feature<T>[], settings?: T): Feature<T>[] {
    return features.reduce((acc, currentFeature) => {
      const enabledOnSettings = currentFeature.isEnabledOnSettings?.(settings);
      const enabledNotSpecified = enabledOnSettings === undefined;

      if (enabledOnSettings || enabledNotSpecified) {
        let feature: Feature<T> = currentFeature;

        if (currentFeature.subFeatures) {
          feature = {
            ...currentFeature,
            subFeatures: this.filterDisabledFeatures([...currentFeature.subFeatures], settings),
          };
        }
        acc.push(feature);
      }

      return acc;
    }, [] as Feature<T>[]);
  }

  overrideFeatures(features: Feature<T>[], groupId?: number) {
    return features.reduce((acc, currentFeature) => {
      let feature = currentFeature;
      if (currentFeature.subFeatures) {
        feature = {
          ...currentFeature,
          subFeatures: this.overrideFeatures(currentFeature.subFeatures, groupId),
        };
      }
      if (currentFeature.getQuery) {
        feature = {
          ...currentFeature,
          getQuery: () => (currentFeature.getQuery ? currentFeature.getQuery(groupId || 0) : {}),
        };
      } else if (currentFeature.getExternalPath) {
        feature = {
          ...currentFeature,
          getExternalPath: () =>
            currentFeature.getExternalPath ? currentFeature.getExternalPath(groupId || 0) : '',
        };
      }
      acc.push(feature);
      return acc;
    }, [] as Feature<T>[]);
  }

  static matchFeaturePath = <X = TCombinedSettings>(
    feature: Feature<X>,
    pathname: string,
    query?: ParsedUrlQuery,
  ): boolean => {
    const { path: featurePath, query: featureQuery = {} } = feature;

    const matchPath = featurePath && pathname.endsWith(featurePath);
    const matchAltPaths = feature.altMatchPaths?.some((altPath) => {
      if (typeof altPath === 'string') {
        return pathname.endsWith(altPath);
      }
      if (altPath instanceof RegExp) {
        return altPath.test(pathname);
      }
      return false;
    });
    const matchQuery = Object.keys(featureQuery).every((key) =>
      Boolean(query && query[key] === featureQuery[key]),
    );
    return Boolean((matchPath || matchAltPaths) && matchQuery);
  };

  static flattenFeatures = <X = TCombinedSettings>(features: Feature<X>[]): Feature<X>[] =>
    features.reduce((acc, feature) => {
      acc.push(feature);
      if (feature.subFeatures && feature.subFeatures.length > 0) {
        return acc.concat(this.flattenFeatures(feature.subFeatures));
      }
      return acc;
    }, [] as Feature<X>[]);

  addFeature(feature: Feature<T>): void {
    if (typeof feature.subFeatures !== 'undefined') {
      feature.subFeatures.forEach((subFeature) => {
        if (subFeature.subFeatures != null) {
          subFeature.subFeatures.forEach((nestedSubFeature) => {
            return Object.assign(nestedSubFeature, {
              path: nestedSubFeature.path ? this.basePath + nestedSubFeature.path : undefined,
            });
          });
        }
        return Object.assign(subFeature, {
          path: subFeature.path ? this.basePath + subFeature.path : undefined,
        });
      });
    }
    this.allFeatures.push({
      ...feature,
      path: feature.path ? this.basePath + feature.path : undefined,
    });
  }
}
