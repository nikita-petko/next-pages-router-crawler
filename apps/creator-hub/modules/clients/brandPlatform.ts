import { Configuration } from '@rbx/clients';
import { BrandMetadataApi } from '@rbx/clients/brandPlatformApi';
import type {
  BrandMetadataGetCreatorAccountInfoRequest,
  BrandMetadataGetCreatorContactInfoRequest,
  BrandMetadataUpsertCreatorAccountInfoRequest,
  BrandMetadataUpsertCreatorContactInfoRequest,
} from '@rbx/clients/brandPlatformApi/v1';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  CreatorContactInfo,
  UpsertCreatorAccountInfoRequestAccountInfo as CreatorAccountInfo,
  UpsertCreatorContactRequestContactInfo as CreatorContact,
} from '@rbx/clients/brandPlatformApi/v1';
export { CreatorContactType, CreatorType, TaxIdType } from '@rbx/clients/brandPlatformApi/v1';

export class BrandPlatformApiClient {
  public brandMetadataApi: BrandMetadataApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('brand-platform')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.brandMetadataApi = new BrandMetadataApi(configuration);
  }

  async getCreatorAccountInfo(request: BrandMetadataGetCreatorAccountInfoRequest) {
    return this.brandMetadataApi.brandMetadataGetCreatorAccountInfo(request);
  }

  async getCreatorContactInfo(request: BrandMetadataGetCreatorContactInfoRequest) {
    return this.brandMetadataApi.brandMetadataGetCreatorContactInfo(request);
  }

  async upsertCreatorAccountInfo(request: BrandMetadataUpsertCreatorAccountInfoRequest) {
    return this.brandMetadataApi.brandMetadataUpsertCreatorAccountInfo({
      brandMetadataUpsertCreatorAccountInfoRequest: request,
    });
  }

  async upsertCreatorContactInfo(request: BrandMetadataUpsertCreatorContactInfoRequest) {
    return this.brandMetadataApi.brandMetadataUpsertCreatorContactInfo({
      brandMetadataUpsertCreatorContactInfoRequest: request,
    });
  }
}

const brandPlatformApiClient = new BrandPlatformApiClient();
export default brandPlatformApiClient;
