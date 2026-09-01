import type {
  PackageVersionNoteGetAssetPackageMetadataRequest,
  GetPackageVersionNoteResponse,
  PackageVersionNoteSetPackageVersionNoteOperationRequest,
} from '@rbx/client-packages-api/v1';
import { PackageVersionNoteApi } from '@rbx/client-packages-api/v1';
import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import { createClientConfiguration } from './utils/createClientConfiguration';
import tryParseResponseError from './utils/tryParseResponseError';

export class PackagesClient {
  private packagesApi: PackageVersionNoteApi;

  constructor() {
    const defaultConfig = createClientConfiguration('packages-api', 'bedev2');

    this.packagesApi = new PackageVersionNoteApi(defaultConfig);
  }

  async getPackageVersionNote(
    requestParameters: PackageVersionNoteGetAssetPackageMetadataRequest,
    initOverrides?: RequestInit,
  ): Promise<GetPackageVersionNoteResponse> {
    try {
      return await this.packagesApi.packageVersionNoteGetAssetPackageMetadata(
        requestParameters,
        initOverrides,
      );
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }

  async setPackageVersionNote(
    requestParameters: PackageVersionNoteSetPackageVersionNoteOperationRequest,
    initOverrides?: RequestInit,
  ): Promise<void> {
    try {
      await this.packagesApi.packageVersionNoteSetPackageVersionNote(
        requestParameters,
        initOverrides,
      );
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }
}

const packagesClient = new PackagesClient();
export default packagesClient;
