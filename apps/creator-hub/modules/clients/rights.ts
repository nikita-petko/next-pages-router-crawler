import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  Account,
  User,
  DefaultApi as RightsApi,
  GetAccountRequest,
  ListAccountsResponse,
  ListAccountsRequest,
  UpdateAccountRequest,
  Document,
  AuthorizationStatus,
  CreateClaimRequest,
  Claim,
  CreateClaimItemRequest,
  ClaimItem,
  ClaimContent,
  ClaimStatusEnum,
  AccountAndUser,
  ClaimItemStatusEnum,
  SubmitClaimRequest,
  GetClaimRequest,
  GetClaimItemRequest,
  ListClaimsResponse,
  ListClaimsRequest,
  ListClaimItemsResponse,
  ListClaimItemsRequest,
  CheckAssetPermissionsResponse,
  CheckAssetPermissionsRequest,
  CreateDocumentOperationRequest,
  ClaimItemSourceEnum,
  CheckAgeResponse,
  SearchOperationRequest,
  SearchResponse,
  CheckAssetTypeResponse,
  CheckAssetTypeRequest,
  SearchRequestTypeEnum,
  CheckContentPermissionsRequest,
  CheckContentPermissionsRequestContentTypeEnum,
  SearchImage,
  Dispute,
  GetDisputeByClaimItemRequest,
  DisputeClaimItemOperationRequest,
  GetCurrentAccountRequest,
  GetCurrentAccountDetailsRequest,
  ListClaimItemsByContentRequest,
  DisputeClaimItemRequest,
  ListClaimItemsByAccountRequest,
  ListClaimItemsByAccountResponse,
  ListIncomingClaimItemsRequest,
  AcceptClaimItemRequest,
  EscalateClaimItemRequest,
  EscalateClaimItemOperationRequest,
  DropClaimItemRequest,
  ClaimItemDiscoveredFromEnum,
  ClaimContentContentTypeEnum,
  GetIncomingClaimItemRequest,
  AckCurrentAccountRequest,
  CreateIpFamilyRequest,
  CreateIpContentRequest,
  BatchCreateIpContentsRequest,
  UpdateIpFamilyRequest,
  GetIpFamilyIdRequest,
  ListIpFamiliesByAccountRequest,
  ListIpContentsByIpFamilyRequest,
  ArchiveIpContentRequest,
  GetFeatureTimeoutRequest,
  ListMatchesByAccountRequest,
  ListMatchesByAccountResponse,
  IsContentUnderReviewResponse,
  GetMatchedVisitCountResponse,
  UpdateIpContentRequest,
  PrepareSnapshotViewRequest,
  PrepareSnapshotViewResponse,
  GetSnapshotViewRequest,
  SnapshotView,
  EnrichClaimItemMetadataResponse,
  GetClaimItemEnrichmentMetadataRequest,
  ClaimItemViewResponse,
  GetClaimItemViewRequest,
} from '@rbx/clients/rightsV1';
import { getBEDEV2ServiceBasePath } from './utils';

export type { Account, User, Claim, ClaimItem } from '@rbx/clients/rightsV1';

const DEFAULT_PAGE_SIZE = 10;

// TODO (CDS-411): @aaronchen to replace these types once typescript-fetch is patched
export interface ClaimContentOverride {
  asset_type?: string;
  claim_id?: string;
  claim_item_id?: string;
  content_id?: string;
  content_type?: ClaimContentContentTypeEnum;
  created_at?: Date;
  url?: string;
}
export interface ClaimItemOverride {
  account_id?: string;
  claim_id?: string;
  content?: ClaimContentOverride;
  content_ids?: Array<string>;
  contents?: Array<ClaimContentOverride>;
  created_at?: Date;
  created_by?: string;
  discovered_from?: ClaimItemDiscoveredFromEnum;
  id?: string;
  notes?: string;
  original_content_id?: string;
  original_description?: string;
  original_document_ids?: Array<string>;
  original_documents?: Array<Document>;
  removal_reason?: string;
  source?: ClaimItemSourceEnum;
  status?: ClaimItemStatusEnum;
  status_expire_at?: Date;
  status_reason?: string;
  target_account_id?: string;
  updated_at?: Date;
  updated_by?: string;
}

type ListIncomingClaimItemsResponseOverride = {
  claimItemGroups?: Array<Array<ClaimItemOverride>>;
  nextPageToken?: string;
};
export class RightsClient {
  private rightsApi: RightsApi;

  constructor(
    basePathRights: string = getBEDEV2ServiceBasePath('rights-management-api/rights/v1'),
  ) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathRights,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.rightsApi = new RightsApi(defaultConfiguration);
  }

  prepareSnapshotView(code: string): Promise<PrepareSnapshotViewResponse> {
    const request: PrepareSnapshotViewRequest = { code };
    return this.rightsApi.prepareSnapshotView(request);
  }

  getSnapshotView(id: string): Promise<SnapshotView> {
    const request: GetSnapshotViewRequest = { id };
    return this.rightsApi.getSnapshotView(request);
  }

  createDocument(name: string): Promise<Document> {
    const request: CreateDocumentOperationRequest = {
      createDocumentRequest: {
        name,
      },
    };
    return this.rightsApi.createDocument(request);
  }

  createSearchImage(): Promise<SearchImage> {
    return this.rightsApi.createSearchImage();
  }

  getAccount(accountId: string): Promise<Account> {
    const request: GetAccountRequest = {
      accountId,
    };

    return this.rightsApi.getAccount(request);
  }

  getCurrentAccount(): Promise<AccountAndUser> {
    const request: GetCurrentAccountRequest = {
      associatedEntityId: '',
      associatedEntityType: 'RobloxUser',
    };
    return this.rightsApi.getCurrentAccount(request);
  }

  getCurrentAccountDetails(): Promise<AccountAndUser> {
    const request: GetCurrentAccountDetailsRequest = {
      associatedEntityId: '',
      associatedEntityType: 'RobloxUser',
    };
    return this.rightsApi.getCurrentAccountDetails(request);
  }

  ackCurrentAccount(ackId: string): Promise<void> {
    const request: AckCurrentAccountRequest = {
      ackId,
    };
    return this.rightsApi.ackCurrentAccount(request);
  }

  checkAssetPermissions(assetIds: Array<number>): Promise<CheckAssetPermissionsResponse> {
    const request: CheckAssetPermissionsRequest = { assetIds };
    return this.rightsApi.checkAssetPermissions({
      checkAssetPermissionsRequest: request,
    });
  }

  checkAssetType(assetIds: Array<number>): Promise<CheckAssetTypeResponse> {
    const request: CheckAssetTypeRequest = { assetIds };
    return this.rightsApi.checkAssetType({
      checkAssetTypeRequest: request,
    });
  }

  checkAge(): Promise<CheckAgeResponse> {
    return this.rightsApi.checkAge();
  }

  checkContentPermissions(
    contentIds: Array<string>,
    contentType: string,
  ): Promise<CheckAssetPermissionsResponse> {
    const request: CheckContentPermissionsRequest = {
      contentType: contentType as CheckContentPermissionsRequestContentTypeEnum,
      contentIds,
    };
    return this.rightsApi.checkContentPermissions({
      checkContentPermissionsRequest: request,
    });
  }

  listAccounts(
    namePrefix?: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListAccountsResponse> {
    const request: ListAccountsRequest = {
      namePrefix,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    };
    return this.rightsApi.listAccounts(request);
  }

  applyAccount(account: Account, user: User): Promise<Account> {
    const request = {
      account,
      user,
    };

    return this.rightsApi.applyAccount({ applyAccountRequest: request });
  }

  updateAccount(account: Account): Promise<Account> {
    if (!account.id) {
      throw new Error('The given account must have an id');
    }

    const request: UpdateAccountRequest = {
      accountId: account.id,
      account,
    };

    return this.rightsApi.updateAccount(request);
  }

  getEligibility(): Promise<AuthorizationStatus> {
    return this.rightsApi.eligibility();
  }

  getClaim(accountId: string, claimId: string): Promise<Claim> {
    const request: GetClaimRequest = {
      accountId,
      claimId,
    };

    return this.rightsApi.getClaim(request);
  }

  getClaimItem(accountId: string, claimId: string, claimItemId: string): Promise<ClaimItem> {
    const request: GetClaimItemRequest = {
      accountId,
      claimId,
      claimItemId,
    };

    return this.rightsApi.getClaimItem(request);
  }

  getIncomingClaimItem(accountId: string, claimItemId: string): Promise<ClaimItem> {
    const request: GetIncomingClaimItemRequest = {
      accountId,
      claimItemId,
    };

    return this.rightsApi.getIncomingClaimItem(request);
  }

  getClaimItemMetadata(
    accountId: string,
    claimItemId: string,
  ): Promise<EnrichClaimItemMetadataResponse> {
    const request: GetClaimItemEnrichmentMetadataRequest = {
      accountId,
      claimItemId,
    };
    return this.rightsApi.getClaimItemEnrichmentMetadata(request);
  }

  getClaimItemView(accountId: string, claimItemId: string): Promise<ClaimItemViewResponse> {
    const request: GetClaimItemViewRequest = {
      accountId,
      claimItemId,
    };
    return this.rightsApi.getClaimItemView(request);
  }

  listClaims(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListClaimsResponse> {
    const request: ListClaimsRequest = {
      accountId,
      pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
      pageToken,
    };
    return this.rightsApi.listClaims(request);
  }

  listIncomingClaimItems(
    accountId: string,
    contentGrouped: boolean,
  ): Promise<ListIncomingClaimItemsResponseOverride> {
    const request: ListIncomingClaimItemsRequest = {
      accountId,
      contentGrouped,
    };
    return this.rightsApi
      .listIncomingClaimItems(request)
      .then((resp) => resp as unknown as ListIncomingClaimItemsResponseOverride);
  }

  listClaimItemsByAccount(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
    filter?: string,
  ): Promise<ListClaimItemsByAccountResponse> {
    const request: ListClaimItemsByAccountRequest = {
      accountId,
      pageSize,
      pageToken,
      filter,
    };
    return this.rightsApi.listClaimItemsByAccount(request);
  }

  listClaimItems(accountId: string, claimId: string): Promise<ListClaimItemsResponse> {
    const request: ListClaimItemsRequest = {
      accountId,
      claimId,
    };
    return this.rightsApi.listClaimItems(request);
  }

  listClaimItemsByContent(
    accountId: string,
    contentType: string,
    contentId: string,
  ): Promise<ListClaimItemsResponse> {
    const request: ListClaimItemsByContentRequest = {
      accountId,
      contentType,
      contentId,
    };
    return this.rightsApi.listClaimItemsByContent(request);
  }

  listMatchesByAccount(
    accountId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<ListMatchesByAccountResponse> {
    const request: ListMatchesByAccountRequest = {
      accountId,
      pageSize,
      pageToken,
    };
    return this.rightsApi.listMatchesByAccount(request);
  }

  getMatchVisitCount(accountId: string, matchId: string): Promise<GetMatchedVisitCountResponse> {
    return this.rightsApi.getMatchVisitCount({
      accountId,
      matchId,
    });
  }

  isContentUnderReview(
    ownerContentId: string,
    pageSize?: number,
    pageToken?: string,
  ): Promise<IsContentUnderReviewResponse> {
    const request = {
      ownerContentId,
      ownerContentType: 'Asset',
      pageSize,
      pageToken,
    };
    return this.rightsApi.contentUnderReviewStatus(request);
  }

  createClaim(
    accountId: string,
    userId: string,
    description: string,
    documentIds: Array<string>,
    claimItems: Array<ClaimItem>,
    snapshotId?: string,
  ): Promise<Claim> {
    const request: CreateClaimRequest = {
      accountId,
      claim: {
        accountId,
        userId,
        description,
        snapshotId,
        documentIds,
        status: ClaimStatusEnum.Creating,
        claimItems,
      },
    };

    return this.rightsApi.createClaim(request);
  }

  createClaimItem(
    accountId: string,
    claimId: string,
    documentIds: Array<string>,
    notes: string,
    originalContent: ClaimContent | null,
    infringingContent: Array<ClaimContent>,
    source: ClaimItemSourceEnum,
  ): Promise<ClaimItem> {
    const request: CreateClaimItemRequest = {
      accountId,
      claimId,
      claimItem: {
        source,
        claimId,
        contents: infringingContent,
        originalDocumentIds: documentIds,
        notes,
        status: ClaimItemStatusEnum.Pending,
        ...(originalContent && { content: originalContent }),
      },
    };

    return this.rightsApi.createClaimItem(request);
  }

  acceptClaimItem(accountId: string, claimId: string, claimItemId: string): Promise<void> {
    const request: AcceptClaimItemRequest = {
      accountId,
      claimId,
      claimItemId,
    };
    return this.rightsApi.acceptClaimItem(request);
  }

  dropClaimItem(accountId: string, claimId: string, claimItemId: string): Promise<void> {
    const request: DropClaimItemRequest = {
      accountId,
      claimId,
      claimItemId,
    };
    return this.rightsApi.dropClaimItem(request);
  }

  submitClaim(accountId: string, claimId: string): Promise<Claim> {
    const request: SubmitClaimRequest = {
      accountId,
      claimId,
    };

    return this.rightsApi.submitClaim(request);
  }

  getDisputeByClaimItem(accountId: string, claimItemId: string): Promise<Dispute> {
    const request: GetDisputeByClaimItemRequest = {
      accountId,
      claimItemId,
    };

    return this.rightsApi.getDisputeByClaimItem(request);
  }

  disputeClaimItem(
    accountId: string,
    claimId: string,
    claimItemId: string,
    disputeClaimItemRequest: DisputeClaimItemRequest,
  ): Promise<void> {
    const request: DisputeClaimItemOperationRequest = {
      accountId,
      claimId,
      claimItemId,
      disputeClaimItemRequest,
    };

    return this.rightsApi.disputeClaimItem(request);
  }

  escalateClaimItem(
    accountId: string,
    claimId: string,
    claimItemId: string,
    escalateClaimItemRequest: EscalateClaimItemRequest,
  ): Promise<void> {
    const request: EscalateClaimItemOperationRequest = {
      accountId,
      claimId,
      claimItemId,
      escalateClaimItemRequest,
    };

    return this.rightsApi.escalateClaimItem(request);
  }

  listIpFamiliesByAccount(params: ListIpFamiliesByAccountRequest) {
    return this.rightsApi.listIpFamiliesByAccount(params);
  }

  createIpFamily(params: CreateIpFamilyRequest) {
    return this.rightsApi.createIpFamily(params);
  }

  updateIpFamily(params: UpdateIpFamilyRequest) {
    return this.rightsApi.updateIpFamily(params);
  }

  getIpFamilyId(params: GetIpFamilyIdRequest) {
    return this.rightsApi.getIpFamilyId(params);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars -- temporary
  deleteIpFamily(_params: { accountId: string; ipFamilyId: string }) {
    // eslint-disable-next-line no-alert -- temporary
    alert('deleteIpFamily API is not implemented');
  }

  listIpContentsByIpFamily(params: ListIpContentsByIpFamilyRequest) {
    return this.rightsApi.listIpContentsByIpFamily(params);
  }

  createIpContent(params: CreateIpContentRequest) {
    return this.rightsApi.createIpContent(params);
  }

  batchCreateIpContents(params: BatchCreateIpContentsRequest) {
    return this.rightsApi.batchCreateIpContents(params);
  }

  archiveIpContent(params: ArchiveIpContentRequest) {
    return this.rightsApi.archiveIpContent(params);
  }

  updateIpContent(params: UpdateIpContentRequest) {
    return this.rightsApi.updateIpContent(params);
  }

  search(
    type: SearchRequestTypeEnum,
    text: string,
    imageId: string,
    pageToken: string,
    source: string,
    group?: string,
  ): Promise<SearchResponse> {
    const request: SearchOperationRequest = {
      searchRequest: {
        filter: group
          ? `search_source = "${source}" AND search_category = "${group}"`
          : `search_source= "${source}"`,
        query: {
          text,
          imageId,
        },
        pageToken,
        type,
      },
    };

    return this.rightsApi.search(request);
  }

  getFeatureTimeoutIntervention(request: GetFeatureTimeoutRequest) {
    return this.rightsApi.getFeatureTimeout(request);
  }
}

const rightsClient = new RightsClient();

export default rightsClient;
