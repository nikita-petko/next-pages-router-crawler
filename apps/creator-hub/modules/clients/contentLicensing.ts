import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  AgreementCandidatesApi,
  AgreementsApi,
  CreatorMetricsResponse,
  LicensesApi,
  LicensingDocumentsApi,
  ListingsApi,
  SettingsApi,
  ListListingsResponse,
  ListingResponse,
  LicenseResponse,
  ListLicensesResponse,
  PublicListingResponse,
  LLMModerationApi,
  ModerationResponse,
  AgreementResponse,
  LLMModerationModerateMessageRequest,
  ListAgreementsResponse,
  ListHydratedAgreementsResponse,
  ListEligibleContentsByLicenseResponse,
  ContentType,
  CreatorType,
  DisputeReason,
  LicensesCreateLicenseRequest,
  LicensesUpdateLicenseRequest,
  LicensingDocumentResponse,
  ChangeRequestResponse,
  ListingsCreateListingRequest,
  ListingsUpdateListingRequest,
  ListAgreementCandidatesResponse,
  AgreementStatus,
  GetAgreementCountByStatusResponse,
  RequestedScanCandidatesApi,
  RequestedScanCandidatesCreateRequestedScanCandidateRequest,
  RequestedScanCandidateResponse,
  ValidateRequestedScanResponse,
  AgreementCandidateType,
  ListRequestedScanCandidatesByAccountResponse,
  RequestedScanCandidatesValidateRequestedScanRequest,
  AgreementsCancelAgreementRequest,
  ValidateIpFamilyResponse,
  ListPublicListingsResponse,
  ListPublicLicensesResponse,
  LicensesListPublicLicensesByListing200Response,
  ListingResponseFromJSON,
  LicenseResponseFromJSON,
  PublicLicenseResponse,
  CancellationReason,
} from '@rbx/clients/contentLicensingApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Client for the Content Licensing API service
 * Provides the backend endpoints for the IP Licensing Platform
 */
export class ContentLicensingApiClient {
  private moderationApi: LLMModerationApi;

  private agreementsApi: AgreementsApi;

  private agreementCandidatesApi: AgreementCandidatesApi;

  private listingsApi: ListingsApi;

  private licensesApi: LicensesApi;

  private licensingDocumentsApi: LicensingDocumentsApi;

  private settingsApi: SettingsApi;

  private requestedScansCandidatesApi: RequestedScanCandidatesApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('content-licensing-api')) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.moderationApi = new LLMModerationApi(defaultConfiguration);
    this.agreementsApi = new AgreementsApi(defaultConfiguration);
    this.agreementCandidatesApi = new AgreementCandidatesApi(defaultConfiguration);
    this.listingsApi = new ListingsApi(defaultConfiguration);
    this.licensesApi = new LicensesApi(defaultConfiguration);
    this.licensingDocumentsApi = new LicensingDocumentsApi(defaultConfiguration);
    this.settingsApi = new SettingsApi(defaultConfiguration);
    this.licensesApi = new LicensesApi(defaultConfiguration);
    this.requestedScansCandidatesApi = new RequestedScanCandidatesApi(defaultConfiguration);
  }

  /**
   * Moderates a message between IPH and Creator using LLM analysis
   */
  async moderateMessage(message: string): Promise<ModerationResponse> {
    if (!message || message.trim().length === 0) {
      throw new Error('Message is required for moderation');
    }

    const request: LLMModerationModerateMessageRequest = {
      message: message.trim(),
    };

    return this.moderationApi.lLMModerationModerateMessage({
      lLMModerationModerateMessageRequest: request,
    });
  }

  /**
   * Fetches the Creator lifetime metrics for an agreement
   */
  async getCreatorLifetimeMetricsForAgreement(
    accountId: string,
    agreementId: string,
  ): Promise<CreatorMetricsResponse> {
    return this.agreementsApi.agreementsGetCreatorLifetimeMetricsForAgreement({
      accountId,
      agreementId,
    });
  }

  /**
   * Fetches a single agreement by ID with hydrated data.
   */
  async getAgreement(accountId: string, agreementId: string) {
    if (!agreementId || agreementId.trim().length === 0) {
      throw new Error('Agreement ID is required');
    }

    return this.agreementsApi.agreementsGetAgreement({
      accountId,
      agreementId: agreementId.trim(),
    });
  }

  /**
   * Fetches public IP listings for displaying on the Explore Licenses page.
   * Uses the raw API to work around a Grasshopper codegen bug where the union
   * type deserializer (ListListingsResponse | ListPublicListingsResponse) merges
   * both types via spread, causing PublicListingResponseFromJSON to overwrite the
   * listings array and strip fields like responseTimeMetrics.
   * This call is used for authenticated users (aka logged-in users) and returns
   * the fully hydrated response.
   */
  async listPublicIpListings(pageSize?: number, pageToken?: string): Promise<ListListingsResponse> {
    const rawResponse = await this.listingsApi.listingsListPublicListingsRaw({
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    });
    const json = await rawResponse.raw.json();

    return {
      listings:
        json.listings?.map((listing: ListingResponse | PublicListingResponse) =>
          ListingResponseFromJSON(listing),
        ) ?? [],
      nextPageToken: json.nextPageToken ?? undefined,
    };
  }

  /**
   * Fetches public IP listings for displaying on the Explore Licenses page.
   * This call is used for unauthenticated users (aka not logged-in users) and returns
   * a stripped down response.
   */
  async listPublicIpListingsUnauthenticated(
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListPublicListingsResponse> {
    return this.listingsApi.listingsListPublicListingsUnauthenticated({
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    });
  }

  /**
   * Fetches IP listings by account
   */
  async listIpListingsByAccount(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListListingsResponse> {
    return this.listingsApi.listingsListListingsByAccount({
      accountId,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    });
  }

  /**
   * Fetches a single IP listing
   */
  async getIpListing(accountId: string, listingId: string): Promise<ListingResponse> {
    return this.listingsApi.listingsGetListing({
      accountId,
      listingId,
    });
  }

  /**
   * Fetches licenses by IP listing
   */
  async listLicensesByIpListing(
    accountId: string,
    listingId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListLicensesResponse> {
    return this.licensesApi.licensesListLicensesByListing({
      accountId,
      listingId,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    });
  }

  /**
   * Fetches agreements by license
   */
  async listAgreementsByLicense(
    accountId: string,
    licenseId: string,
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<ListAgreementsResponse> {
    return this.agreementsApi.agreementsListAgreementsByLicense({
      accountId,
      licenseId,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
      filter,
    });
  }

  /**
   * Fetches a single public IP listing by ID.
   * Uses the raw API to work around the same Grasshopper union type codegen bug
   * (ListingResponse | PublicListingResponse spread merge).
   * This call is used for authenticated users (aka logged-in users) and returns
   * the fully hydrated response.
   */
  async getPublicListing(listingId: string): Promise<ListingResponse> {
    if (!listingId || listingId.trim().length === 0) {
      throw new Error('Listing ID is required');
    }

    const rawResponse = await this.listingsApi.listingsGetPublicListingRaw({
      listingId: listingId.trim(),
    });
    const json: ListingResponse | PublicListingResponse = await rawResponse.raw.json();

    return ListingResponseFromJSON(json);
  }

  /**
   * Fetches a single public IP listing by ID.
   * This call is used for unauthenticated users (aka not logged-in users) and returns
   * a stripped down response.
   */
  async getPublicListingUnauthenticated(listingId: string): Promise<PublicListingResponse> {
    if (!listingId || listingId.trim().length === 0) {
      throw new Error('Listing ID is required');
    }

    return this.listingsApi.listingsGetPublicListingUnauthenticated({
      listingId: listingId.trim(),
    });
  }

  /**
   * Fetches a single public license by ID.
   */
  async getPublicLicense(licenseId: string): Promise<LicenseResponse> {
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesGetPublicLicense({
      licenseId: licenseId.trim(),
    });
  }

  /**
   * Fetches public licenses for a listing.
   * Uses the raw API to work around a Grasshopper codegen bug where the union
   * type deserializer (ListLicensesResponse | ListPublicLicensesResponse) merges
   * both types via spread, causing PublicLicenseResponseFromJSON to overwrite the
   * licenses array and strip fields like royaltyRate.
   * This call is used for authenticated users (aka logged-in users) and returns
   * the fully hydrated response.
   */
  async listPublicLicensesByListing(
    listingId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListLicensesResponse> {
    if (!listingId || listingId.trim().length === 0) {
      throw new Error('Listing ID is required');
    }

    const rawResponse = await this.licensesApi.licensesListPublicLicensesByListingRaw({
      listingId: listingId.trim(),
      pageSize,
      pageToken,
    });
    const json = await rawResponse.raw.json();

    return {
      licenses:
        json.licenses?.map((license: LicenseResponse | PublicLicenseResponse) =>
          LicenseResponseFromJSON(license),
        ) ?? [],
      nextPageToken: json.nextPageToken ?? undefined,
    };
  }

  /**
   * Fetches public licenses for a listing.
   * This call is used for unauthenticated users (aka not logged-in users) and returns
   * a stripped down response.
   */
  async listPublicLicensesByListingUnauthenticated(
    listingId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListPublicLicensesResponse> {
    if (!listingId || listingId.trim().length === 0) {
      throw new Error('Listing ID is required');
    }

    return this.licensesApi.licensesListPublicLicensesByListingUnauthenticated({
      listingId: listingId.trim(),
      pageSize,
      pageToken,
    });
  }

  /**
   * Lists all public catalog licenses.
   * This call is used for authenticated users (aka logged-in users) and returns
   * the fully hydrated response.
   */
  async listPublicLicenses(
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<LicensesListPublicLicensesByListing200Response> {
    return this.licensesApi.licensesListPublicLicenses({
      pageSize,
      pageToken,
      filter,
    });
  }

  /**
   * Lists all public catalog licenses.
   * This call is used for unauthenticated users (aka not logged-in users) and returns
   * a stripped down response.
   */
  async listPublicLicensesUnauthenticated(
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<ListPublicLicensesResponse> {
    return this.licensesApi.licensesListPublicLicensesUnauthenticated({
      pageSize,
      pageToken,
      filter,
    });
  }

  /**
   * Fetches settings from the content licensing settings API.
   */
  async getSettings(): Promise<{ [key: string]: boolean }> {
    return this.settingsApi.settingsGetFlags();
  }

  /**
   * Applies to a public license with the specified universe, pitch, and monetization settings.
   */
  async applyToLicense(
    licenseId: string,
    universeId: number,
    enableMonetization: boolean,
    pitch: string,
    startTime: Date | null,
    endTime: Date | null,
  ): Promise<AgreementResponse> {
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesApplyToLicense({
      licenseId: licenseId.trim(),
      licensesApplyToLicenseRequest: {
        enableMonetization,
        pitch,
        startTime,
        endTime,
        targets: [
          {
            contentId: universeId.toString(),
            contentType: 'Universe',
          },
        ],
      },
    });
  }

  /**
   * Fetches agreements associated with a specified Rights Account ID.
   */
  async listAgreementsByTargetAccount(
    accountId: string,
    filter?: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListHydratedAgreementsResponse> {
    return this.agreementsApi.agreementsListAgreementsByTargetAccount({
      accountId,
      pageSize,
      pageToken,
      filter,
    });
  }

  /**
   * Fetches hydrated agreements owned by a specified IP Holder account.
   */
  async listAgreementsByAccount(
    accountId: string,
    filter?: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListHydratedAgreementsResponse> {
    return this.agreementsApi.agreementsListAgreementsByAccount({
      accountId,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
      filter,
    });
  }

  /**
   * Disputes a specific agreement offer from an IP holder.
   */
  async disputeAgreementOffer(
    accountId: string,
    agreementId: string,
    disputeReason: DisputeReason,
  ): Promise<void> {
    return this.agreementsApi.agreementsDisputeAgreementOffer({
      accountId,
      agreementId,
      agreementsDisputeAgreementOfferRequest: {
        disputeReason,
      },
    });
  }

  /**
   * Lists eligible contents for a license.
   */
  async listEligibleContentsByLicense(
    licenseId: string,
    contentType: ContentType,
    pageSize?: number,
    pageToken?: string,
    creatorId?: string,
    creatorType?: CreatorType,
  ): Promise<ListEligibleContentsByLicenseResponse> {
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesListEligibleContentsByLicense({
      licenseId: licenseId.trim(),
      contentType,
      pageSize,
      pageToken,
      creatorId,
      creatorType,
    });
  }

  /**
   * As an IP Holder this initiates a Change Request for the given agreement.
   */
  async initiateChangeRequest(
    accountId: string,
    agreementId: string,
    feedback: string,
  ): Promise<ChangeRequestResponse> {
    return this.agreementsApi.agreementsInitiateChangeRequest({
      accountId,
      agreementId,
      agreementsInitiateChangeRequestRequest: {
        changeRequestReason: feedback,
      },
    });
  }

  /**
   * Creates a new license for an IP listing.
   */
  async createLicense(
    accountId: string,
    license: LicensesCreateLicenseRequest,
  ): Promise<LicenseResponse> {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('Account ID is required');
    }

    return this.licensesApi.licensesCreateLicense({
      accountId: accountId.trim(),
      licensesCreateLicenseRequest: license,
    });
  }

  /**
   * Updates an existing license.
   */
  async updateLicense(
    accountId: string,
    licenseId: string,
    license: LicensesUpdateLicenseRequest,
  ): Promise<LicenseResponse> {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('Account ID is required');
    }
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesUpdateLicense({
      accountId: accountId.trim(),
      licenseId: licenseId.trim(),
      licensesUpdateLicenseRequest: license,
    });
  }

  /**
   * Gets a license by ID for an IP holder.
   */
  async getLicense(accountId: string, licenseId: string): Promise<LicenseResponse> {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('Account ID is required');
    }
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesGetLicense({
      accountId: accountId.trim(),
      licenseId: licenseId.trim(),
    });
  }

  /**
   * Archives a license.
   */
  async archiveLicense(accountId: string, licenseId: string): Promise<void> {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('Account ID is required');
    }
    if (!licenseId || licenseId.trim().length === 0) {
      throw new Error('License ID is required');
    }

    return this.licensesApi.licensesArchiveLicense({
      accountId: accountId.trim(),
      licenseId: licenseId.trim(),
    });
  }

  /**
   * Uploads a licensing document (e.g., content standards document) for a license.
   */
  async uploadLicensingDocument(accountId: string, file: Blob): Promise<LicensingDocumentResponse> {
    if (!accountId || accountId.trim().length === 0) {
      throw new Error('Account ID is required');
    }
    if (!file) {
      throw new Error('File is required');
    }

    return this.licensingDocumentsApi.licensingDocumentsUploadLicensingDocument({
      accountId: accountId.trim(),
      file,
    });
  }

  /**
   * Creator-side action to confirm that an IP Holder's Change Request has been
   * implemented in the experience.
   */
  async completeChangeRequest(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsCompleteChangeRequest({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this will mark a Change Request as completed.
   *
   * After this point the Change Request is resolved and an IP Holder can submit
   * a new one by initiating the same flow.
   */
  async acknowledgeCompletedChangeRequest(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsAcknowledgeCompletedChangeRequest({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this promotes a specific agreement candidate.
   */
  async promoteAgreementCandidate(
    accountId: string,
    agreementCandidateId: string,
    licenseId: string,
    enableMonetization?: boolean,
  ): Promise<AgreementResponse> {
    return this.agreementCandidatesApi.agreementCandidatesPromoteAgreementCandidate({
      accountId,
      agreementCandidateId,
      agreementCandidatesPromoteAgreementCandidateRequest: {
        licenseId,
        enableMonetization,
      },
    });
  }

  /**
   * As an IP Holder this rejects a Creator-initiated license application.
   */
  async rejectLicenseApplication(
    accountId: string,
    agreementId: string,
    feedback: string | undefined,
  ): Promise<void> {
    return this.agreementsApi.agreementsRejectLicenseApplication({
      accountId,
      agreementId,
      agreementsRejectLicenseApplicationRequest: {
        feedback,
      },
    });
  }

  /**
   * As an IP Holder this approves a Creator-initiated license application.
   */
  async approveLicenseApplication(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsApproveLicenseApplication({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this accepts a Creator's dispute for a license the IP holder previously offered.
   */
  async acceptAgreementDispute(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsAcceptAgreementDispute({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this rejects a Creator's dispute for a license agreement the IP holder previously offered.
   */
  async rejectAgreementDispute(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsRejectAgreementDispute({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this archives an Unsuccessful license agreement.
   */
  async archiveUnsuccessfulOffer(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsArchiveUnsuccessfulOffer({
      accountId,
      agreementId,
    });
  }

  /**
   * As an IP Holder this enables monetization on an active, non-zero revenue share license agreement.
   */
  async enableMonetization(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsEnableMonetization({
      accountId,
      agreementId,
    });
  }

  /**
   * Creates a new IP Listing.
   */
  async createIpListing(
    accountId: string,
    listingRequest: ListingsCreateListingRequest,
  ): Promise<ListingResponse> {
    return this.listingsApi.listingsCreateListing({
      accountId,
      listingsCreateListingRequest: listingRequest,
    });
  }

  /**
   * Updates an existing IP Listing.
   */
  async updateIpListing(
    accountId: string,
    listingId: string,
    listingRequest: ListingsUpdateListingRequest,
  ): Promise<ListingResponse> {
    return this.listingsApi.listingsUpdateListing({
      accountId,
      listingId,
      listingsUpdateListingRequest: listingRequest,
    });
  }

  /**
   * As an IP Holder, lists agreement candidates by given accountId and parameters.
   */
  async listAgreementCandidatesByAccount(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<ListAgreementCandidatesResponse> {
    return this.agreementCandidatesApi.agreementCandidatesListAgreementCandidatesByAccount({
      accountId,
      pageSize,
      pageToken,
      filter,
    });
  }

  /**
   * Fetches the number of agreements by status for a given ip holder account.
   */
  async getAgreementCountsByAccountAndStatuses(
    accountId: string,
    statuses: AgreementStatus[],
  ): Promise<GetAgreementCountByStatusResponse> {
    const statusesString = statuses?.join(',');
    return this.agreementsApi.agreementsGetAgreementCountByStatusAndAccount({
      accountId,
      statuses: statusesString,
    });
  }

  /**
   * Fetches the number of agreements by status for a given creator account.
   */
  async getAgreementCountsByTargetAccountAndStatuses(
    accountId: string,
    statuses: AgreementStatus[],
  ): Promise<GetAgreementCountByStatusResponse> {
    const statusesString = statuses?.join(',');
    return this.agreementsApi.agreementsGetAgreementCountByStatusAndTargetAccount({
      accountId,
      statuses: statusesString,
    });
  }

  /**
   * Creates a new requested (aka manual) scan candidate.
   */
  async createManualScanCandidate(
    accountId: string,
    ipFamilyId: string,
    licenseId: string,
    universeId: string,
  ): Promise<RequestedScanCandidateResponse> {
    const request: RequestedScanCandidatesCreateRequestedScanCandidateRequest = {
      accountId,
      ipFamilyId,
      licenseId,
      candidateId: universeId,
      candidateType: AgreementCandidateType.Universe,
    };
    return this.requestedScansCandidatesApi.requestedScanCandidatesCreateRequestedScanCandidate({
      accountId,
      requestedScanCandidatesCreateRequestedScanCandidateRequest: request,
    });
  }

  /**
   * Validates an IP family and experience combination for manual scanning.
   */
  async validateManualScanCombination(
    accountId: string,
    ipFamilyId: string,
    universeId: string,
  ): Promise<ValidateRequestedScanResponse> {
    const request: RequestedScanCandidatesValidateRequestedScanRequest = {
      ipFamilyId,
      candidateId: universeId,
      candidateType: AgreementCandidateType.Universe,
    };
    return this.requestedScansCandidatesApi.requestedScanCandidatesValidateRequestedScan({
      accountId,
      requestedScanCandidatesValidateRequestedScanRequest: request,
    });
  }

  /**
   * Lists requested scan candidates by account.
   */
  async listRequestedScanCandidatesByAccount(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<ListRequestedScanCandidatesByAccountResponse> {
    return this.requestedScansCandidatesApi.requestedScanCandidatesListRequestedScanCandidatesByAccount(
      {
        accountId,
        pageSize,
        pageToken,
        filter,
      },
    );
  }

  /**
   * As a Creator, cancels an agreement.
   */
  async cancelAgreement(
    accountId: string,
    agreementId: string,
    reason: CancellationReason,
  ): Promise<void> {
    const agreementsCancelAgreementRequest: AgreementsCancelAgreementRequest = {
      reason,
    };
    return this.agreementsApi.agreementsCancelAgreement({
      accountId,
      agreementId,
      agreementsCancelAgreementRequest,
    });
  }

  /**
   * Validates an IP family for manual scan.
   */
  async validateIpFamilyForManualScan(
    accountId: string,
    ipFamilyId: string,
  ): Promise<ValidateIpFamilyResponse> {
    return this.requestedScansCandidatesApi.requestedScanCandidatesValidateIpFamily({
      accountId,
      ipFamilyId,
    });
  }

  /**
   * Creator-specific action where they attest the removal of IP from their experience.
   * Used in ending stages of time-limited agreement lifecycle.
   */
  async completeIpRemoval(accountId: string, agreementId: string): Promise<void> {
    return this.agreementsApi.agreementsAttestIpRemoval({
      accountId,
      agreementId,
    });
  }
}

// Create and export a default instance
const contentLicensingClient = new ContentLicensingApiClient();

export default contentLicensingClient;
