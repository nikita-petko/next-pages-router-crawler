import type {
  Hold,
  AcceptTransferRequestResource,
  CreateTransferRequestCurrentCreator,
  ListInvalidTargetsResponse,
  Creator,
} from '@rbx/client-ownership-transfer-api/v1';
import {
  TransferApi,
  UserApi,
  ResourceType,
  CreatorType,
  type ResourceType as TResourceType,
} from '@rbx/client-ownership-transfer-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { ResourceType as TransferResourceType, CreatorType as TransferCreatorType };
export type TCreator = Creator;
export type TTransferResourceType = TResourceType;
export type TransferResource = AcceptTransferRequestResource;
export type TransferCreator = CreateTransferRequestCurrentCreator;
export type TransferHold = Hold;
export type TGroupEligibilityChecks = Awaited<
  ReturnType<TransferApi['transferGetGroupEligibility']>
>;

export class TransferClient {
  private transferApi: TransferApi;

  private userApi: UserApi;

  constructor() {
    const defaultConfig = createClientConfiguration('ownership-transfer', 'bedev2');

    this.transferApi = new TransferApi(defaultConfig);
    this.userApi = new UserApi(defaultConfig);
  }

  async createTransfer(
    currentCreator: TransferCreator,
    targetCreator: TransferCreator,
    resource: TransferResource,
  ): Promise<Hold> {
    return this.transferApi.transferCreateTransfer({
      transferCreateTransferRequest: {
        currentCreator,
        targetCreator,
        resource,
      },
    });
  }

  async getLatestTransfer(resource: TransferResource): Promise<Hold> {
    return this.transferApi.transferGetLatestTransferForResource({
      transferGetLatestTransferForResourceRequest: { resource },
    });
  }

  async acceptLatestTransfer(resource: TransferResource): Promise<boolean> {
    return this.transferApi.transferAcceptTransfer({
      transferAcceptTransferRequest: { resource },
    });
  }

  async cancelLatestTransfer(resource: TransferResource): Promise<boolean> {
    return this.transferApi.transferCancelTransfer({
      transferCancelTransferRequest: { resource },
    });
  }

  async rejectLatestTransfer(resource: TransferResource): Promise<boolean> {
    return this.transferApi.transferRejectTransfer({
      transferRejectTransferRequest: { resource },
    });
  }

  async acknowledgeTransfer(resource: TransferResource): Promise<boolean> {
    return this.transferApi.transferAcknowledgeExpiredTransfer({
      transferAcknowledgeExpiredTransferRequest: { resource },
    });
  }

  async getPermissibleGroups(): Promise<number[]> {
    return this.userApi.userListPermissibleGroupsForExperienceTransfer();
  }

  async listInvalidTargets(resource: TransferResource): Promise<ListInvalidTargetsResponse> {
    return this.transferApi.transferListInvalidTargetsForResource({
      transferListInvalidTargetsForResourceRequest: { resource },
    });
  }

  async getGroupEligibility(groupId: number): Promise<TGroupEligibilityChecks> {
    return this.transferApi.transferGetGroupEligibility({
      groupId,
    });
  }
}

const transferClient = new TransferClient();
export default transferClient;
