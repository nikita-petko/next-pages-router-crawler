import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateInvitationRequestModel } from '@rbx/client-organizations-service-api/v1';
import organizationApiClient from '@modules/clients/organizationApi';
import type { InvitedMember } from '@modules/group/constants/groupConstants';
import { invalidateInvitationQueries } from './rolesQueries';

export type TCreateInvitationProps = {
  organizationId: string;
} & CreateInvitationRequestModel;

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, ...rest }: TCreateInvitationProps) => {
      return organizationApiClient.invitationClient.createInvitation(organizationId, rest);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationsApi_invitations', variables.organizationId],
      });
      invalidateInvitationQueries(queryClient, variables.organizationId, variables.roleIds);
    },
  });
};

export const useGetInvitationsByOrganizationId = (
  organizationId?: string,
  pageToken?: string,
  maxPageSize?: number,
) => {
  return useQuery({
    queryKey: ['organizationsApi_invitations', organizationId, pageToken, maxPageSize],
    enabled: !!organizationId,
    queryFn: async () => {
      return organizationApiClient.invitationClient.getInvitationsByOrganizationId(
        organizationId!,
        pageToken,
        maxPageSize,
      );
    },
  });
};

export type TDeleteInvitationProps = {
  organizationId: string;
  member: InvitedMember;
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, member }: TDeleteInvitationProps) => {
      return organizationApiClient.invitationClient.deleteInvitationById(
        organizationId,
        member.invitationId,
      );
    },
    onSuccess: (_, variables) => {
      invalidateInvitationQueries(
        queryClient,
        variables.organizationId,
        variables.member.roles?.map((role) => role.id),
      );
      queryClient.invalidateQueries({
        queryKey: ['organizationsApi_invitations', variables.organizationId],
      });
    },
  });
};
