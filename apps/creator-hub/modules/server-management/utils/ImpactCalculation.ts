import type { ForecastRestartResponse } from '@rbx/clients/serverManagementService';
import type { PlaceSummary, PlaceSummaryV2, ForecastResponse } from '../types/PlaceSummary';

export interface ImpactCalculationResult {
  placesImpacted: number;
  serversImpacted: number;
  playersImpacted: number;
  warning?: string;
}

export interface ImpactCalculationParams {
  apiResponse: ForecastResponse;
  selectedPlaces: number[];
  restartOutdatedOnly: boolean;
  translate: (key: string, params?: Record<string, string>) => string;
}

export interface ImpactCalculationV2Params {
  apiResponse: ForecastRestartResponse;
  selectedPlaces: number[];
  restartOutdatedOnly: boolean;
  translate: (key: string, params?: Record<string, string>) => string;
}

/**
 * Calculates the impact of a server restart operation based on the API response and user selections
 */
export const calculateImpact = ({
  apiResponse,
  selectedPlaces,
  restartOutdatedOnly,
  translate,
}: ImpactCalculationParams): ImpactCalculationResult => {
  let totalServers = 0;
  let totalPlayers = 0;
  let relevantPlaces = 0;
  let warning: string | undefined;

  if (selectedPlaces.length > 0) {
    const selectedPlaceSummaries = apiResponse.placeSummaries.filter(
      (summary: PlaceSummary) =>
        summary.placeId !== undefined && selectedPlaces.includes(summary.placeId),
    );

    if (restartOutdatedOnly) {
      totalServers = selectedPlaceSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.instancesToBeClosed || 0),
        0,
      );
      totalPlayers = selectedPlaceSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.playersToBeKicked || 0),
        0,
      );
    } else {
      totalServers = selectedPlaceSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.totalInstances || 0),
        0,
      );
      totalPlayers = selectedPlaceSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.totalPlayers || 0),
        0,
      );
    }

    relevantPlaces = selectedPlaceSummaries.length;
    const placesWithNoOutdatedServers = selectedPlaceSummaries.filter(
      (summary: PlaceSummary) => (summary.instancesToBeClosed || 0) === 0,
    );

    if (placesWithNoOutdatedServers.length > 0) {
      const placeCount = placesWithNoOutdatedServers.length;
      warning = translate('Warning.MultiplePlacesText', { placeCount: placeCount.toString() });
    }
  } else {
    if (restartOutdatedOnly) {
      totalServers = apiResponse.placeSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.instancesToBeClosed || 0),
        0,
      );
      totalPlayers = apiResponse.placeSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.playersToBeKicked || 0),
        0,
      );
    } else {
      totalServers = apiResponse.placeSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.totalInstances || 0),
        0,
      );
      totalPlayers = apiResponse.placeSummaries.reduce(
        (sum: number, summary: PlaceSummary) => sum + (summary.totalPlayers || 0),
        0,
      );
    }

    relevantPlaces = apiResponse.placeSummaries.length;

    const placesWithNoOutdatedServers = apiResponse.placeSummaries.filter(
      (summary: PlaceSummary) => summary.instancesToBeClosed === 0,
    );

    if (
      placesWithNoOutdatedServers.length === apiResponse.placeSummaries.length &&
      apiResponse.placeSummaries.length > 0
    ) {
      warning = translate('Warning.AllPlacesUpdated');
    }
  }

  return {
    placesImpacted: relevantPlaces,
    serversImpacted: totalServers,
    playersImpacted: totalPlayers,
    warning,
  };
};

/**
 * Calculates the impact of a server restart operation based on the V2 forecast response and user selections
 */
export const calculateImpactV2 = ({
  apiResponse,
  selectedPlaces,
  restartOutdatedOnly,
  translate,
}: ImpactCalculationV2Params): ImpactCalculationResult => {
  let totalServers = 0;
  let totalPlayers = 0;
  let relevantPlaces = 0;
  let warning: string | undefined;

  const forecasts = apiResponse.placeForecasts ?? {};

  if (selectedPlaces.length > 0) {
    const selectedSummaries = selectedPlaces
      .map((id) => forecasts[id.toString()])
      .filter((s): s is PlaceSummaryV2 => !!s);

    if (restartOutdatedOnly) {
      totalServers = selectedSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.instancesImpacted ?? 0),
        0,
      );
      totalPlayers = selectedSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.playersImpacted ?? 0),
        0,
      );
    } else {
      totalServers = selectedSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.totalInstances ?? 0),
        0,
      );
      totalPlayers = selectedSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.totalPlayers ?? 0),
        0,
      );
    }

    relevantPlaces = selectedSummaries.length;
    const placesWithNoOutdatedServers = selectedSummaries.filter(
      (summary: PlaceSummaryV2) => (summary.instancesImpacted ?? 0) === 0,
    );

    if (placesWithNoOutdatedServers.length > 0) {
      const placeCount = placesWithNoOutdatedServers.length;
      if (placeCount === 1) {
        warning = translate('Warning.OnePlaceText', { placeCount: placeCount.toString() });
      } else {
        warning = translate('Warning.MultiplePlacesText', { placeCount: placeCount.toString() });
      }
    }
  } else {
    const allSummaries = Object.values(forecasts);

    if (restartOutdatedOnly) {
      totalServers = allSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.instancesImpacted ?? 0),
        0,
      );
      totalPlayers = allSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.playersImpacted ?? 0),
        0,
      );
    } else {
      totalServers = allSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.totalInstances ?? 0),
        0,
      );
      totalPlayers = allSummaries.reduce(
        (sum: number, summary: PlaceSummaryV2) => sum + (summary.totalPlayers ?? 0),
        0,
      );
    }

    relevantPlaces = allSummaries.length;

    const placesWithNoOutdatedServers = allSummaries.filter(
      (summary: PlaceSummaryV2) => (summary.instancesImpacted ?? 0) === 0,
    );

    if (placesWithNoOutdatedServers.length === allSummaries.length && allSummaries.length > 0) {
      warning = translate('Warning.AllPlacesUpdated');
    }
  }

  return {
    placesImpacted: relevantPlaces,
    serversImpacted: totalServers,
    playersImpacted: totalPlayers,
    warning,
  };
};
