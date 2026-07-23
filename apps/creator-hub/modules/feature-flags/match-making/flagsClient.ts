import {
  matchmakingClient,
  MatchmakingClient,
} from '@modules/react-query/matchmaking/matchmakingRequests';
import { getRecordEntries } from '@modules/miscellaneous/common/utils/helperUtils';
import { FeatureFlagNamespace } from '../namespaces';
import { type TFlag, type FeatureFlagsClient, type EvaluationContext } from '../types';

class MatchmakingFlagsClient implements FeatureFlagsClient<FeatureFlagNamespace.Matchmaking> {
  constructor(private readonly client: MatchmakingClient) {
    this.client = client;
  }

  fetchFlags({
    universeId,
  }: EvaluationContext & { userId: number }): Promise<
    Partial<Record<TFlag<FeatureFlagNamespace.Matchmaking>, boolean>>
  > {
    if (!universeId) return Promise.resolve({});

    return this.client
      .getIsFeatureEnabledForUniverse({
        universeId,
      })
      .then(({ featureFlags }) => {
        const result: Partial<Record<TFlag<FeatureFlagNamespace.Matchmaking>, boolean>> = {};
        getRecordEntries(featureFlags ?? {}).forEach(([flag, value]) => {
          result[flag] = value;
        });
        return result;
      });
  }
}

const matchmakingFlagsClient = new MatchmakingFlagsClient(matchmakingClient);

export default matchmakingFlagsClient;
