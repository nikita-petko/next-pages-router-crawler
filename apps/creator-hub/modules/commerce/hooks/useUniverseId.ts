import { useRouter } from 'next/router';

const useUniverseId = () => {
  const router = useRouter();
  const routerQueryId = router.query.id;

  if (!routerQueryId || Array.isArray(routerQueryId)) {
    throw new Error('Unable to parse universe ID from route');
  }

  const universeId = Number(routerQueryId);
  if (Number.isNaN(universeId) || !Number.isInteger(universeId)) {
    throw new TypeError('Unable to parse numeric universe ID from route');
  }

  return universeId;
};

export default useUniverseId;
