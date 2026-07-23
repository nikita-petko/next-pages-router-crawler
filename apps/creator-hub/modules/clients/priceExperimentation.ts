import {
  PriceExperimentationApiApi,
  PriceExperimentationApiV2Api,
} from '@rbx/client-price-experimentation-api/v1';
import type {
  PriceExperimentationApiAcceptProductRecommendationsOperationRequest,
  PriceExperimentationApiAddProductsToExperimentOperationRequest,
  PriceExperimentationApiCancelExperimentRequest,
  PriceExperimentationApiCompleteExperimentRequest,
  PriceExperimentationApiCreateExperimentRequest,
  PriceExperimentationApiGetExperimentEligibilityRequest,
  PriceExperimentationApiGetExperimentResultsRequest,
  PriceExperimentationApiGetProductTransactionVolumesOperationRequest,
  PriceExperimentationApiListExperimentMetricsRequest,
  PriceExperimentationApiListExperimentProductRecommendationsRequest,
  PriceExperimentationApiListExperimentProductsRequest,
  PriceExperimentationApiListExperimentsRequest,
  PriceExperimentationApiListHoldoutMetricsRequest,
  PriceExperimentationApiRejectProductRecommendationsOperationRequest,
  PriceExperimentationApiRestorePricesRequest,
  PriceExperimentationApiStartExperimentRequest,
  PriceExperimentationApiStartHoldoutRequest,
  PriceExperimentationApiStopHoldoutOperationRequest,
  PriceExperimentationApiV2GetExperimentSummaryRequest,
  PriceExperimentationApiV2ListExperimentProductDetailsRequest,
} from '@rbx/client-price-experimentation-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

/**
 * Facade over the generated price-experimentation V1 + V2 singletons. Exposes friendly
 * method names so callers stay decoupled from the generated class surface and from the
 * V1/V2 split.
 */
export class PriceExperimentationApiClient {
  private api: PriceExperimentationApiApi;

  private apiV2: PriceExperimentationApiV2Api;

  constructor() {
    const configuration = createClientConfiguration('price-experimentation-api', 'bedev2');
    this.api = new PriceExperimentationApiApi(configuration);
    this.apiV2 = new PriceExperimentationApiV2Api(configuration);
  }

  acceptProductRecommendations(
    request: PriceExperimentationApiAcceptProductRecommendationsOperationRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiAcceptProductRecommendations(request, options);
  }

  addProductsToExperiment(
    request: PriceExperimentationApiAddProductsToExperimentOperationRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiAddProductsToExperiment(request, options);
  }

  cancelExperiment(
    request: PriceExperimentationApiCancelExperimentRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiCancelExperiment(request, options);
  }

  completeExperiment(
    request: PriceExperimentationApiCompleteExperimentRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiCompleteExperiment(request, options);
  }

  createExperiment(
    request: PriceExperimentationApiCreateExperimentRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiCreateExperiment(request, options);
  }

  getExperimentationMetadata(options: RequestInit = {}) {
    return this.api.priceExperimentationApiGetExperimentationMetadata(options);
  }

  getExperimentEligibility(
    request: PriceExperimentationApiGetExperimentEligibilityRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiGetExperimentEligibility(request, options);
  }

  getExperimentResults(
    request: PriceExperimentationApiGetExperimentResultsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiGetExperimentResults(request, options);
  }

  getProductTransactionVolumes(
    request: PriceExperimentationApiGetProductTransactionVolumesOperationRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiGetProductTransactionVolumes(request, options);
  }

  listExperimentMetrics(
    request: PriceExperimentationApiListExperimentMetricsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiListExperimentMetrics(request, options);
  }

  listExperimentProductRecommendations(
    request: PriceExperimentationApiListExperimentProductRecommendationsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiListExperimentProductRecommendations(request, options);
  }

  listExperimentProducts(
    request: PriceExperimentationApiListExperimentProductsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiListExperimentProducts(request, options);
  }

  listExperiments(
    request: PriceExperimentationApiListExperimentsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiListExperiments(request, options);
  }

  listHoldoutMetrics(
    request: PriceExperimentationApiListHoldoutMetricsRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiListHoldoutMetrics(request, options);
  }

  rejectProductRecommendations(
    request: PriceExperimentationApiRejectProductRecommendationsOperationRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiRejectProductRecommendations(request, options);
  }

  restorePrices(request: PriceExperimentationApiRestorePricesRequest, options: RequestInit = {}) {
    return this.api.priceExperimentationApiRestorePrices(request, options);
  }

  startExperiment(
    request: PriceExperimentationApiStartExperimentRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiStartExperiment(request, options);
  }

  startHoldout(request: PriceExperimentationApiStartHoldoutRequest, options: RequestInit = {}) {
    return this.api.priceExperimentationApiStartHoldout(request, options);
  }

  stopHoldout(
    request: PriceExperimentationApiStopHoldoutOperationRequest,
    options: RequestInit = {},
  ) {
    return this.api.priceExperimentationApiStopHoldout(request, options);
  }

  listExperimentProductDetails(
    request: PriceExperimentationApiV2ListExperimentProductDetailsRequest,
    options: RequestInit = {},
  ) {
    return this.apiV2.priceExperimentationApiV2ListExperimentProductDetails(request, options);
  }

  getExperimentSummary(
    request: PriceExperimentationApiV2GetExperimentSummaryRequest,
    options: RequestInit = {},
  ) {
    return this.apiV2.priceExperimentationApiV2GetExperimentSummary(request, options);
  }
}

const priceExperimentationApi = new PriceExperimentationApiClient();
export default priceExperimentationApi;
