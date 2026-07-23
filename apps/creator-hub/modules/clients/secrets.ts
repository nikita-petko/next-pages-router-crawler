import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  SecretsStoreApiServiceApi,
  SecretPaginatedList,
  Secret,
} from '@rbx/clients/secretsStoreService';

import { getBEDEV2ServiceBasePath } from './utils';

export type { Secret, SecretPaginatedList };

export class SecretsStoreClient {
  private secretsStoreApi: SecretsStoreApiServiceApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('secrets')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.secretsStoreApi = new SecretsStoreApiServiceApi(defaultConfig);
  }

  async getPublicKey(universeId: number): Promise<Secret> {
    return this.secretsStoreApi.v1UniversesUniverseIdSecretsPublicKeyGet({
      universeId,
    });
  }

  async list(universeId: number, limit: number): Promise<SecretPaginatedList> {
    return this.secretsStoreApi.v1UniversesUniverseIdSecretsGet({
      universeId,
      limit,
    });
  }

  async delete(universeId: number, secretId: string): Promise<void> {
    return this.secretsStoreApi.v1UniversesUniverseIdSecretsSecretIdDelete({
      universeId,
      secretId,
    });
  }

  async create(
    universeId: number,
    secretId: string,
    domain: string,
    secret: string,
    keyId: string,
  ): Promise<Secret> {
    return this.secretsStoreApi.v1UniversesUniverseIdSecretsPost({
      universeId,
      secret: { id: secretId, domain, secret, keyId },
    });
  }

  async update(
    universeId: number,
    secretId: string,
    domain: string,
    secret: string,
    keyId: string,
  ): Promise<Secret> {
    return this.secretsStoreApi.v1UniversesUniverseIdSecretsSecretIdPatch({
      universeId,
      secretId,
      secret: { id: secretId, domain, secret, keyId },
    });
  }
}

const secretsStoreClient = new SecretsStoreClient();
export default secretsStoreClient;
