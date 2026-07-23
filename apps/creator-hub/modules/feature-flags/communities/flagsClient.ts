import groupsClient, { type GroupsClient } from '@modules/clients/groups';
import { getRecordEntries } from '@modules/miscellaneous/common/utils/helperUtils';
import { FeatureFlagNamespace } from '../namespaces';
import { type TFlag, type FeatureFlagsClient, type EvaluationContext } from '../types';

class CommunitiesFlagsClient implements FeatureFlagsClient<FeatureFlagNamespace.Communities> {
  constructor(private readonly client: GroupsClient) {
    this.client = client;
  }

  fetchFlags({
    groupId,
  }: EvaluationContext & { userId: number }): Promise<
    Partial<Record<TFlag<FeatureFlagNamespace.Communities>, boolean>>
  > {
    if (!groupId) return Promise.resolve({});

    return this.client.getProductFeatures(groupId).then((features) => {
      const result: Partial<Record<TFlag<FeatureFlagNamespace.Communities>, boolean>> = {};
      getRecordEntries(features).forEach(([flag, value]) => {
        result[flag] = value ?? false;
      });
      return result;
    });
  }
}

const communitiesFlagsClient = new CommunitiesFlagsClient(groupsClient);

export default communitiesFlagsClient;
