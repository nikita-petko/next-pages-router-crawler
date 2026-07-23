import { useRouter } from 'next/router';

export default function useCurrentAlert() {
  const router = useRouter();
  const { id: universeId, alertId } = router.query;

  // TODO(@yukihe): fetch alert details when API ready

  return {
    alert: { name: alertId as string, universeId },
  };
}
