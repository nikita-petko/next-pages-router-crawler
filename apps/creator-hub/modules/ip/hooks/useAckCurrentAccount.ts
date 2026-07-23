import { useMutation } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';

export type AckCurrentAccountData = {
  ackId: string;
};

export default function useAckCurrentAccount() {
  const submitHandler = async (data: AckCurrentAccountData) => {
    return rightsClient.ackCurrentAccount(data.ackId);
  };

  const mutation = useMutation({
    mutationFn: submitHandler,
  });

  return mutation;
}
