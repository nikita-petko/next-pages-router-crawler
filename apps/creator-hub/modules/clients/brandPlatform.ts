import { BrandMetadataApi } from '@rbx/client-brand-platform-api/v1';
import type {
  BrandMetadataGetCreatorAccountInfoRequest,
  BrandMetadataGetCreatorContactInfoRequest,
  BrandMetadataUpsertCreatorAccountInfoRequest,
  BrandMetadataUpsertCreatorContactInfoRequest,
} from '@rbx/client-brand-platform-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  CreatorContactInfo,
  UpsertCreatorAccountInfoRequestAccountInfo as CreatorAccountInfo,
  UpsertCreatorContactRequestContactInfo as CreatorContact,
} from '@rbx/client-brand-platform-api/v1';
export { CreatorContactType, CreatorType, TaxIdType } from '@rbx/client-brand-platform-api/v1';

export class BrandPlatformApiClient {
  public brandMetadataApi: BrandMetadataApi;

  constructor() {
    const configuration = createClientConfiguration('brand-platform', 'bedev2');
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
