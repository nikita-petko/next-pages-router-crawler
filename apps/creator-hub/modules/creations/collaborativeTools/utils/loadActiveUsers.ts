import type { ActiveUser } from '@modules/clients/teamCreatePresence';
import teamCreatePresenceClient from '@modules/clients/teamCreatePresence';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import { maxActiveUsers } from '../constants/activeUserConstants';

export type IdToActiveUsers = {
  [key: number]: ActiveUser[];
};

export default async function loadActiveUsersForGames(
  games: Array<CreationData>,
  curActiveUsers: IdToActiveUsers = {} as IdToActiveUsers,
): Promise<IdToActiveUsers> {
  try {
    const requestIds = games
      .filter(
        (game) =>
          game.universeId && !game.isArchived && !Object.hasOwn(curActiveUsers, game.universeId),
      )
      .map((game) => game.universeId) as number[];
    if (requestIds.length === 0) {
      return {};
    }

    const { data: universeList } = await teamCreatePresenceClient.getActiveUsers({
      ids: requestIds,
      maxUsers: maxActiveUsers,
    });

    return (
      universeList?.reduce((accum, index) => {
        const modifiedAccum = accum;
        if (index.id && index.activeUsers) {
          modifiedAccum[index.id] = index.activeUsers;
        }
        return modifiedAccum;
      }, {} as IdToActiveUsers) ?? {}
    );
  } catch {
    return {};
  }
}
