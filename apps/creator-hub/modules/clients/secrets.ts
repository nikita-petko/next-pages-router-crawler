import type { SecretPaginatedList, Secret } from '@rbx/client-secrets-store-service/v1';
import { SecretsStoreApiServiceApi } from '@rbx/client-secrets-store-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { Secret, SecretPaginatedList };

export class SecretsStoreClient {
  private secretsStoreApi: SecretsStoreApiServiceApi;

  constructor() {
    this.secretsStoreApi = new SecretsStoreApiServiceApi(
      createClientConfiguration('secrets', 'bedev2'),
    );
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
