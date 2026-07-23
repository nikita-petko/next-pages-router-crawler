import { useEffect, useState } from 'react';
import gamesClient from '@modules/clients/games';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

/**
 * Fetches the vote information of a universe from Games.Api.
 *
 * Returns the loading/error status for the network call, and the up/down votes for the universe.
 */
const useUniverseVotes = (universeId: number) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const [votes, setVotes] = useState<{ upVotes: number; downVotes: number }>({
    upVotes: 0,
    downVotes: 0,
  });

  useEffect(() => {
    const loadVotes = async () => {
      if (universeId === uninitializedUniverseId) {
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const response = await gamesClient.multigetGameVotes([universeId]);
        if (response.data == null || response.data.length < 1) {
          setVotes({ upVotes: 0, downVotes: 0 });
          setError(true);
          return;
        }

        const [{ upVotes, downVotes }] = response.data;
        setVotes({ upVotes: upVotes ?? 0, downVotes: downVotes ?? 0 });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [universeId]);

  return { isLoading, isError, votes };
};

export default useUniverseVotes;
