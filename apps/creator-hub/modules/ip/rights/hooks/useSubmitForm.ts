import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Account, User } from '@rbx/client-rights/v1';
import { AccountAccountTypeEnum, UserRoleEnum } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';
import type RightsAccountFormType from '../types/RightsAccountFormType';
import createDocuments from './document';
import { currentAccountKey } from './useCurrentAccount';

export default function useSubmitForm() {
  const queryClient = useQueryClient();
  const submitHandler = async (data: RightsAccountFormType) => {
    // upload documents, only if corporate account
    let documentIds: string[] = [];
    if (data.accountType === AccountAccountTypeEnum.Corporate) {
      const files: Array<File | undefined> = data.documents.map((file) => file.file);
      const filteredFiles = files.filter((file) => file !== undefined);
      documentIds = await createDocuments(filteredFiles);
    }
    // send application
    const acc: Account = {
      notes: '',
      organizationId: '',
      organizationName:
        data.accountType === AccountAccountTypeEnum.Corporate ? data.organizationName : '',
      verificationDocumentIds: documentIds,
      accountType: data.accountType,
    };
    const user: User = {
      accountId: '00000000-0000-0000-0000-000000000000',
      email: 'placeholder',
      role: UserRoleEnum.Owner,
      fullName: data.legalName,
      phone: 'placeholder',
      country: data.country.name,
      address: data.address,
      address2: data.address2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      invitedByUserId: '00000000-0000-0000-0000-000000000000',
      inviteId: '00000000-0000-0000-0000-000000000000',
      signature: data.signature,
    };
    return rightsClient.applyAccount(acc, user);
  };
  const mutation = useMutation({
    mutationFn: submitHandler,
    // TODO: will have effect when react query client is global
    onSuccess: () => queryClient.removeQueries({ queryKey: [currentAccountKey] }),
  });

  return mutation;
}
