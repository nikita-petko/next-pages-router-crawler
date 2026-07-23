import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  PackageVersionNoteApi,
  PackageVersionNoteGetAssetPackageMetadataRequest,
  GetPackageVersionNoteResponse,
  PackageVersionNoteSetPackageVersionNoteOperationRequest,
} from '@rbx/clients/packagesApi/v1';

import { getBEDEV2ServiceBasePath } from './utils';

import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import tryParseResponseError from './utils/tryParseResponseError';

export class PackagesClient {
  private packagesApi: PackageVersionNoteApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('packages-api')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

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
