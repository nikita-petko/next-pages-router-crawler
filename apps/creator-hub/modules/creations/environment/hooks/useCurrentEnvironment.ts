import { useRouter } from 'next/router';
import useEnvironment from '@modules/react-query/environments/environmentQueries';

export default function useCurrentEnvironment() {
  const router = useRouter();
  const { id: gameId, environmentId } = router.query;

  const {
    data: environment,
    isLoading,
    error,
  } = useEnvironment(gameId as string, environmentId as string);

  return {
    environment: environment ?? null,
    isLoading,
    error,
  };
}
